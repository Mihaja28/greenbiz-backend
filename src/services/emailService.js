const nodemailer = require('nodemailer');

// ─── CONFIGURATION DU TRANSPORTEUR GMAIL ───
// Utilise un "mot de passe d'application" Gmail, pas le mot de passe normal du compte.
// À générer depuis : Compte Google > Sécurité > Validation en 2 étapes > Mots de passe des applications
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // ex: votreapp@gmail.com
    pass: process.env.EMAIL_PASSWORD, // mot de passe d'application (16 caractères, sans espaces)
  },
});

/**
 * Envoie un e-mail contenant le code de réinitialisation à 6 caractères.
 * @param {string} toEmail - L'adresse e-mail du destinataire
 * @param {string} token - Le code de réinitialisation (ex: "A1B2C3")
 */
exports.sendResetEmail = async (toEmail, token) => {
  const mailOptions = {
    from: `"GreenBiz Madagascar" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Réinitialisation de votre mot de passe — GreenBiz Madagascar',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2E7D32;">Réinitialisation de mot de passe</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe sur GreenBiz Madagascar.</p>
        <p>Voici votre code de vérification :</p>
        <div style="background-color: #F1F8E9; border: 2px solid #2E7D32; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; color: #2E7D32; letter-spacing: 4px;">${token}</span>
        </div>
        <p>Ce code est valable pendant <strong>15 minutes</strong>.</p>
        <p style="color: #6B7280; font-size: 13px;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute sécurité.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`E-mail de réinitialisation envoyé à ${toEmail}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail:", error);
    throw new Error("Impossible d'envoyer l'e-mail de réinitialisation.");
  }
};