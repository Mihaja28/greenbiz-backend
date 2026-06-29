const Entreprise = require('../models/entreprise.model');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');


// --- INSCRIPTION DE L'ENTREPRISE ---
exports.register = async (req, res) => {
  // Log pour voir exactement ce que Chrome transmet au serveur
  console.log(" Données d'inscription reçues de Flutter :", req.body);

  try {
    const { name, email, password, region, address, description } = req.body;

    // 1. Validation de sécurité : s'assurer que les champs requis ne sont pas vides
    if (!name || !email || !password || !region || !address) {
      console.log(" Échec : Certains champs obligatoires sont manquants dans la requête.");
      return res.status(400).json({
        message: "Données incomplètes. Le nom, l'email, le mot de passe, la région et l'adresse sont obligatoires."
      });
    }

    // 2. Vérification de l'existence de l'entreprise
    const existingEnt = await Entreprise.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existingEnt) {
      console.log(` Échec : L'email ${email} est déjà enregistré.`);
      return res.status(400).json({ message: "Cet e-mail professionnel est déjà utilisé." });
    }

    // 3. Hachage sécurisé du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insertion dans PostgreSQL avec le statut par défaut 'pending'
    console.log(" Tentative d'insertion dans la table PostgreSQL...");
    const newEntreprise = await Entreprise.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      region: region.trim(),
      address: address.trim(),
      description: description ? description.trim() : "",
      status: 'pending' // Forcé à l'inscription pour la modération admin
    });

    console.log(` Entreprise créée avec succès ! ID: ${newEntreprise.id}`);

    return res.status(201).json({
      success: true,
      message: "Demande d'inscription enregistrée. En attente de validation par l'administration GreenBiz.",
      id: newEntreprise.id
    });

  } catch (error) {
    console.error(" ERREUR CRITIQUE DANS REGISTER_ENTREPRISE :", error);

    return res.status(500).json({
      message: "Erreur interne du serveur lors du traitement de l'inscription.",
      error: error.message
    });
  }
};

// --- CONNEXION DE L'ENTREPRISE ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;


    const entreprise = await Entreprise.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!entreprise) {
      return res.status(404).json({ success: false, message: "Identifiants incorrects." });
    }


    if (entreprise.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: "Votre demande d'inscription est encore en attente de validation par un administrateur."
      });
    }

    if (entreprise.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: "Votre demande d'inscription a été refusée. Veuillez contacter le support."
      });
    }


    const isMatch = await bcrypt.compare(password, entreprise.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Identifiants incorrects." });
    }


    const token = jwt.sign(
      { id: entreprise.id, role: 'entreprise' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const entResponse = entreprise.toJSON();
    delete entResponse.password;


    return res.json({
      success: true,
      message: "Connexion réussie !",
      token,
      data: {
        entreprise: entResponse
      }
    });

  } catch (error) {
    console.error("Erreur login entreprise :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion.",
      error: error.message
    });
  }
};



exports.updateProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, contact, region, address, description, existingGallery } = req.body;

  console.log("Champs reçus pour update:", { name, email, contact, region, address, description });
  console.log("existingGallery reçu:", existingGallery);

  try {
    // 1. Recherche de l'entreprise concernée
    const entreprise = await Entreprise.findByPk(id);
    if (!entreprise) {
      return res.status(404).json({ success: false, message: "Entreprise introuvable." });
    }

    console.log("galleryUrls actuel en base:", entreprise.galleryUrls);

    // 2. Traitement du Logo
    let currentLogoUrl = entreprise.logoUrl;
    if (req.files && req.files['logo']) {
      currentLogoUrl = `/uploads/${req.files['logo'][0].filename}`;
    }

    // 3. Traitement de la Galerie Photos (Prise en compte des suppressions faites sur Flutter)
    let currentGalleryUrls = [];

    if (existingGallery) {
      try {
        currentGalleryUrls = JSON.parse(existingGallery);
      } catch (parseError) {
        console.error("Erreur lors du parsing de existingGallery:", parseError);
        currentGalleryUrls = entreprise.galleryUrls || [];
      }
    } else {
      currentGalleryUrls = entreprise.galleryUrls || [];
    }

    // 4. Ajout des nouvelles photos chargées si elles existent
    if (req.files && req.files['gallery']) {
      const newPhotos = req.files['gallery'].map(file => `/uploads/${file.filename}`);
      currentGalleryUrls = [...currentGalleryUrls, ...newPhotos];
    }

    console.log("galleryUrls qui va être sauvegardé:", currentGalleryUrls);

    // 5. Application des modifications via Sequelize
    await entreprise.update({
      name: name ? name.trim() : entreprise.name,
      email: email ? email.trim().toLowerCase() : entreprise.email,
      contact: contact ? contact.trim() : entreprise.contact, // ← AJOUT : prise en compte du numéro de contact
      region: region ? region.trim() : entreprise.region,
      address: address ? address.trim() : entreprise.address,
      description: description ? description.trim() : entreprise.description,
      logoUrl: currentLogoUrl,
      galleryUrls: currentGalleryUrls
    });

    // 6. Renvoyer l'objet rafraîchi (sans le mot de passe) pour Flutter
    const updatedData = entreprise.toJSON();
    delete updatedData.password;

    return res.json({
      success: true,
      message: "Profil mis à jour avec succès !",
      company: updatedData
    });

  } catch (error) {
    console.error("Erreur lors de l'update de l'entreprise :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour du profil.",
      error: error.message
    });
  }
};


exports.getPublicCompanies = async (req, res) => {
  try {
    const companies = await Entreprise.findAll({
      where: { isValidated: true },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error("Erreur getPublicCompanies :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des entreprises.",
      error: error.message
    });
  }
};