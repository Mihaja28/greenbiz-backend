const jwt = require('jsonwebtoken');
const User = require('../models/user.model'); 
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const { sendResetEmail } = require('../services/emailService');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Vérification de l'utilisateur et du mot de passe
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // 2. Génération du Token JWT
    // On y stocke les infos nécessaires pour le middleware protect et restrictTo
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Le token expire après 24 heures
    );

    // 3. Renvoi de la réponse au client (Flutter)
    res.status(200).json({
      status: 'success',
      token,
      data: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet e-mail." });
    }

    // Génère un token unique à 6 chiffres (plus simple pour Flutter) ou une chaîne crypto
    const token = crypto.randomBytes(3).toString('hex').toUpperCase(); // Ex: A1B2C3

    // Définir l'expiration à 15 minutes
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // Sauvegarde dans la BDD
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    // Envoi de l'e-mail
    await sendResetEmail(user.email, token);

    res.status(200).json({ message: "E-mail de réinitialisation envoyé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Une erreur est survenue lors de la demande." });
  }
};

// 2. RÉINITIALISER LE MOT DE PASSE - Valider le token et changer le mot de passe
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Recherche de l'utilisateur avec un token valide et non expiré
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() } // Doit être supérieur à l'heure actuelle
      }
    });

    if (!user) {
      return res.status(400).json({ message: "Le token est invalide ou a expiré." });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Effacer les champs du token pour qu'il ne soit plus réutilisable
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Votre mot de passe a été réinitialisé avec succès !" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Impossible de réinitialiser le mot de passe." });
  }
};