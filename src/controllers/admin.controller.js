const Entreprise = require('../models/entreprise.model');
const Comment = require('../models/comment.model');
const UpgradeRequest = require('../models/upgradeRequest.model');
const User = require('../models/user.model'); 
// Récupérer toutes les entreprises en attente de validation
exports.getPendingEntreprises = async (req, res) => {
  try {
    const pendingList = await Entreprise.findAll({
      where: { status: 'pending' },
      attributes: { exclude: ['password'] } 
    });
    res.json(pendingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Valider ou Refuser une entreprise (Backend adapté pour le Front)
exports.updateEntrepriseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body; 

    //  Si Flutter envoie un booléen (approve: true/false) au lieu d'un String
    if (status === true || req.body.approve === true) {
      status = 'approved';
    } else if (status === false || req.body.approve === false) {
      status = 'rejected';
    }

    // Sécurité au cas où la valeur reçue reste incorrecte
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: "Statut invalide. Le backend attend 'approved', 'rejected' ou un booléen." 
      });
    }

    const entreprise = await Entreprise.findByPk(id);
    if (!entreprise) {
      return res.status(404).json({ message: "Entreprise introuvable." });
    }

    entreprise.status = status;
    entreprise.isValidated = (status === 'approved');

    await entreprise.save();

    
    res.json({
      success: true,
      message: `L'entreprise a été ${status === 'approved' ? 'approuvée' : 'refusée'} avec succès !`
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// LABELS & MODÉRATION COMPLET
exports.labelCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, labelLevel } = req.body;

    const company = await Entreprise.findByPk(id);
    if (!company) {
      return res.status(404).json({ message: "Entreprise introuvable." });
    }

    if (status) {
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: "Statut invalide." });
      }
      company.status = status;
      company.isValidated = (status === 'approved');
    }

    if (labelLevel) {
      if (!['Bronze', 'Silver', 'Gold'].includes(labelLevel)) {
        return res.status(400).json({ message: "Niveau de label invalide." });
      }
      company.labelLevel = labelLevel;
    }

    await company.save();

    return res.json({
      success: true,
      message: "Mise à jour de l'entreprise effectuée avec succès.",
      company
    });
  } catch (error) {
    console.error("Erreur Admin Modération :", error);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

exports.getPendingComments = async (req, res) => {
  try {
    const pendingComments = await Comment.findAll({
      where: { isApproved: false },
      order: [['createdAt', 'DESC']] 
    });
    res.json(pendingComments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approuver un commentaire
exports.approveComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({ message: "Commentaire introuvable." });
    }

    comment.isApproved = true;
    await comment.save();

    res.json({
      success: true,
      message: "Le commentaire a été approuvé et est désormais public !"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rejeter / Supprimer définitivement un commentaire
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({ message: "Commentaire introuvable." });
    }

    await comment.destroy();
    res.json({
      success: true,
      message: "Le commentaire a été rejeté et supprimé de la base de données."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [pendingEntreprisesCount, pendingCommentsCount, pendingUpgradesCount] = await Promise.all([
      Entreprise.count({ where: { status: 'pending' } }),
      Comment.count({ where: { isApproved: false } }),
      UpgradeRequest.count({ where: { status: 'Pending' } }),
    ]);

    res.json({
      success: true,
      pendingEntreprisesCount,
      pendingCommentsCount,
      pendingUpgradesCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ACTIVITÉ RÉCENTE
// RECENT ACTIVITY CORRIGÉ
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const treatedEntreprises = await Entreprise.findAll({
      where: { status: ['approved', 'rejected'] },
      // Sécurité : on prend l'ID et les statuts sans risquer le crash sur le nom
      attributes: ['id', 'status', 'updatedAt'], 
      order: [['updatedAt', 'DESC']],
      limit: limit,
    });

    const treatedComments = await Comment.findAll({
      where: { isApproved: true },
      // Utilisation de 'texte' (comme défini dans votre modèle) au lieu de 'text'
      attributes: ['id', 'texte', 'updatedAt', 'entrepriseId'], 
      order: [['updatedAt', 'DESC']],
      limit: limit,
    });

    const treatedUpgrades = await UpgradeRequest.findAll({
      where: { status: ['Approved', 'Rejected'] },
      attributes: ['id', 'currentLevel', 'requestedLevel', 'status', 'updatedAt', 'entrepriseId'],
      order: [['updatedAt', 'DESC']],
      limit: limit,
    });

    const activities = [];

    treatedEntreprises.forEach((e) => {
      activities.push({
        type: 'entreprise',
        action: e.status, 
        label: e.status === 'approved'
          ? `Une organisation a été validée`
          : `Une organisation a été refusée`,
        date: e.updatedAt,
      });
    });

    treatedComments.forEach((c) => {
      activities.push({
        type: 'comment',
        action: 'approved',
        label: `Commentaire citoyen approuvé`,
        date: c.updatedAt,
      });
    });

    treatedUpgrades.forEach((u) => {
      activities.push({
        type: 'upgrade',
        action: u.status.toLowerCase(), 
        label: u.status === 'Approved'
          ? `Label ${u.requestedLevel} accordé`
          : `Demande d'upgrade de niveau rejetée`,
        date: u.updatedAt,
      });
    });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = activities.slice(0, limit);

    res.json({
      success: true,
      data: recent,
    });
  } catch (error) {
    console.error("Erreur getRecentActivity :", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



/**
 * @desc    Récupérer toutes les entreprises validées / actives
 * @route   GET /api/admin/companies
 */
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Entreprise.findAll({
      where: { status: 'approved' }, // On prend uniquement celles validées pour la gestion active
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Supprimer une entreprise définitivement
 * @route   DELETE /api/admin/companies/:id
 */
exports.deleteEntreprise = async (req, res) => {
  try {
    const { id } = req.params;
    const entreprise = await Entreprise.findByPk(id);

    if (!entreprise) {
      return res.status(404).json({ success: false, message: "Entreprise introuvable." });
    }

    // On procède à la suppression
    await entreprise.destroy();
    res.json({
      success: true,
      message: "L'entreprise a été supprimée avec succès de la plateforme."
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Récupérer tous les utilisateurs ayant le rôle 'citoyen'
 * @route   GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: 'citoyen' },
      attributes: { exclude: ['password'] }, // Sécurité
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Supprimer un utilisateur définitivement
 * @route   DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ where: { id, role: 'citoyen' } });

    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable ou rôle non modérable." });
    }

    await user.destroy();
    res.json({
      success: true,
      message: `L'utilisateur ${user.name} a été supprimé définitivement.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};