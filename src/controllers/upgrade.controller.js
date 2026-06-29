const { v4: uuidv4 } = require('uuid');
const UpgradeRequest = require('../models/upgradeRequest.model');
const Entreprise = require('../models/entreprise.model');

// POST /api/enterprise/request-upgrade
exports.createUpgradeRequest = async (req, res) => {
  try {
    const { currentLevel, requestedLevel, comment } = req.body;
    const entrepriseId = req.user.id; // injecté par le middleware protect

    if (!currentLevel || !requestedLevel || !comment) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const validLevels = ['Bronze', 'Silver', 'Gold'];
    if (!validLevels.includes(requestedLevel)) {
      return res.status(400).json({ message: "Niveau demandé invalide." });
    }

    // Vérifier qu'il n'y a pas déjà une demande en attente
    const existing = await UpgradeRequest.findOne({
      where: { entrepriseId, status: 'Pending' }
    });

    if (existing) {
      return res.status(409).json({
        message: "Vous avez déjà une demande d'upgrade en attente de traitement."
      });
    }

    const request = await UpgradeRequest.create({
      id: uuidv4(),
      entrepriseId,
      currentLevel,
      requestedLevel,
      comment,
      status: 'Pending',
    });

    return res.status(201).json({
      success: true,
      message: "Votre demande d'upgrade a été soumise avec succès !",
      data: request,
    });
  } catch (error) {
    console.error("Erreur createUpgradeRequest:", error);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// GET /api/admin/upgrades/pending  (pour l'admin)
exports.getPendingUpgrades = async (req, res) => {
  try {
    const requests = await UpgradeRequest.findAll({
      where: { status: 'Pending' },
      include: [{ model: Entreprise, attributes: ['id', 'name', 'email', 'region', 'labelLevel'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// PUT /api/admin/upgrades/:id/review  (approuver ou rejeter)
exports.reviewUpgradeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body; // 'approved' ou 'rejected'

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: "Décision invalide." });
    }

    const request = await UpgradeRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: "Demande introuvable." });
    }

    const statusMap = { approved: 'Approved', rejected: 'Rejected' };
    request.status = statusMap[decision];
    await request.save();

    // Si approuvé → mettre à jour le labelLevel de l'entreprise
    if (decision === 'approved') {
      await Entreprise.update(
        { labelLevel: request.requestedLevel },
        { where: { id: request.entrepriseId } }
      );
    }

    return res.json({
      success: true,
      message: decision === 'approved'
          ? `Label ${request.requestedLevel} accordé avec succès !`
          : "Demande refusée.",
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};