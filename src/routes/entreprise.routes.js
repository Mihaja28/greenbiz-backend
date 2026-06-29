const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Entreprise = require('../models/entreprise.model');
const bcrypt = require('bcrypt');
const entrepriseCtrl = require('../controllers/entreprise.controller');

// CONFIGURATION DE MULTER POUR LES IMAGES
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 Mo par image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées !'), false);
    }
  }
});

// Liaison des champs attendus depuis Flutter
const profileUploads = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]);

// --- TES FONCTIONS LOCALES EXISTANTES ---
const getPublicCompanies = async (req, res) => {
  try {
    const companies = await Entreprise.findAll({ where: { isValidated: true } });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllCompaniesAdmin = async (req, res) => {
  try {
    const companies = await Entreprise.findAll({ order: [['createdAt', 'DESC']] });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const validateCompany = async (req, res) => {
  try {
    const company = await Entreprise.findByPk(req.params.id);
    if (!company) return res.status(404).json({ message: "Entreprise introuvable" });
    
    company.isValidated = true;
    await company.save();
    
    res.json(company);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// --- LE CORPS DES ROUTES ---
router.get('/', entrepriseCtrl.getPublicCompanies);
router.post('/register', entrepriseCtrl.register); // Utilise ton contrôleur externe
router.post('/login', entrepriseCtrl.login);       // Utilise ton contrôleur externe
router.get('/admin/all', getAllCompaniesAdmin);
router.put('/:id/validate', validateCompany);

// NOUVELLE ROUTE : Mise à jour du profil avec gestion d'images
router.put('/profile/:id', profileUploads, entrepriseCtrl.updateProfile);

module.exports = router;