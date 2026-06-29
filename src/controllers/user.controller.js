const User = require('../models/user.model');
const bcrypt = require('bcrypt');

// --- INSCRIPTION (Toujours citoyen par défaut) ---
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Vérifier si l'adresse e-mail est déjà prise
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Cet e-mail est déjà associé à un compte." });
    }

    // 2. Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Créer l'utilisateur
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'citoyen' // Protection : impossible de s'inscrire directement comme admin via cette route public
    });

    // Ne pas renvoyer le mot de passe haché dans la réponse
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res.status(201).json({ message: "Compte créé avec succès !", user: userResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- CONNEXION (Citoyens ET Administrateurs) ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const jwt = require('jsonwebtoken');

    // 1. Chercher l'utilisateur par e-mail
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Identifiants incorrects." });
    }

    // 2. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Identifiants incorrects." });
    }

    // 3. Générer le token JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 4. Préparer la réponse sans le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      message: `Connexion réussie ! Espace ${user.role}`,
      token: token,
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- MISE À JOUR DU PROFIL CITOYEN (nom + email) ---
// PUT /api/users/profile/:id  (protégé par le middleware "protect")
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    // Sécurité : un citoyen ne doit modifier que SON PROPRE profil
    if (req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à modifier ce profil."
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    }

    // Si l'email change, vérifier qu'il n'est pas déjà utilisé par un autre compte
    if (email && email.trim().toLowerCase() !== user.email) {
      const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Cet e-mail est déjà associé à un autre compte."
        });
      }
    }

    await user.update({
      name: name ? name.trim() : user.name,
      email: email ? email.trim().toLowerCase() : user.email,
    });

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    return res.json({
      success: true,
      message: "Profil mis à jour avec succès !",
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error("Erreur updateProfile (citoyen) :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour du profil.",
      error: error.message
    });
  }
};

// --- CHANGEMENT DE MOT DE PASSE ---
// PUT /api/users/change-password/:id  (protégé par le middleware "protect")
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à modifier ce mot de passe."
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe actuel et le nouveau mot de passe sont requis."
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 6 caractères."
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    }

    // Vérifie que le mot de passe actuel est correct avant de le changer
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe actuel est incorrect."
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedNewPassword });

    return res.json({
      success: true,
      message: "Mot de passe modifié avec succès !"
    });
  } catch (error) {
    console.error("Erreur changePassword :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors du changement de mot de passe.",
      error: error.message
    });
  }
};