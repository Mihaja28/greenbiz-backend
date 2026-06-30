const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const upgradeController = require('../controllers/upgrade.controller');

// --- STATS & ACTIVITÉS ---
router.get('/dashboard-stats', protect, restrictTo('admin'), adminCtrl.getDashboardStats);
router.get('/recent-activity', protect, restrictTo('admin'), adminCtrl.getRecentActivity);

// --- VALIDATION & LABELS (ENTREPRISES EN ATTENTE) ---
router.get('/entreprises/pending', protect, restrictTo('admin'), adminCtrl.getPendingEntreprises);
router.put('/entreprises/:id/validate', protect, restrictTo('admin'), adminCtrl.updateEntrepriseStatus);

// --- DEMANDES D'UPGRADE ---
router.get('/upgrades/pending', protect, restrictTo('admin'), upgradeController.getPendingUpgrades);
router.put('/upgrades/:id/review', protect, restrictTo('admin'), upgradeController.reviewUpgradeRequest);

// ─── CONTRÔLE & GESTION DES DONNÉES ───

// Gestion globale des Entreprises approuvées/actives
router.get('/companies', protect, restrictTo('admin'), adminCtrl.getAllCompanies);
router.delete('/companies/:id', protect, restrictTo('admin'), adminCtrl.deleteEntreprise);

// Gestion globale des Utilisateurs (Citoyens)
router.get('/users', protect, restrictTo('admin'), adminCtrl.getAllUsers);
router.delete('/users/:id', protect, restrictTo('admin'), adminCtrl.deleteUser);

module.exports = router;