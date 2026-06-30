const express = require('express');
const router = express.Router();
const Comment = require('../models/comment.model');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// Ajouter un commentaire (Sécurisé : Utilisateur connecté uniquement)
const createComment = async (req, res) => {
  try {
    const newComment = await Comment.create(req.body);
    res.status(201).json(newComment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Voir les commentaires validés d'une entreprise (Public)
const getCompanyComments = async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { 
        entrepriseId: req.params.entrepriseId, 
        isApproved: true 
      },
      order: [['createdAt', 'DESC']] 
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Voir tous les commentaires (Admin)
const getAllCommentsAdmin = async (req, res) => {
  try {
    const comments = await Comment.findAll({ order: [['createdAt', 'DESC']] });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  Voir uniquement les commentaires EN ATTENTE (Admin)
const getPendingCommentsAdmin = async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { isApproved: false },
      order: [['createdAt', 'DESC']]
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approuver un commentaire (Admin)
const approveComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ message: "Commentaire introuvable" });

    comment.isApproved = true;
    await comment.save();

    res.json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Supprimer un commentaire (Admin)
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ message: "Commentaire introuvable" });

    await comment.destroy();
    res.json({ message: "Commentaire supprimé avec succès" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ---Routes ---

// Route publique pour envoyer un avis
router.post('/', protect, createComment);

// Route publique pour lire les avis d'une entreprise
router.get('/entreprise/:entrepriseId', getCompanyComments);

// Routes d'administration (Protégées par rôle)
router.get('/', protect, restrictTo('admin'), getAllCommentsAdmin);
// [NOUVELLE ROUTE] -> C'est celle-ci qui manquait pour enlever la 404 de ton écran Flutter !
router.get('/pending', protect, restrictTo('admin'), getPendingCommentsAdmin); 

router.put('/:id/approve', protect, restrictTo('admin'), approveComment);
router.delete('/:id', protect, restrictTo('admin'), deleteComment);

module.exports = router;