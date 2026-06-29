/**
 * Réinitialise le mot de passe d'un utilisateur.
 * Usage: node scripts/reset-password.js email@exemple.com NouveauMotDePasse
 */
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const email = (process.argv[2] || '').trim().toLowerCase();
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/reset-password.js <email> <mot_de_passe>');
  process.exit(1);
}

const sequelize = new Sequelize('greenbiz', 'postgres', 'himjaa', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
});

const Utilisateur = sequelize.define(
  'Utilisateur',
  {
    nom: DataTypes.STRING,
    email: DataTypes.STRING,
    mot_de_passe: DataTypes.STRING,
    role: DataTypes.STRING,
  },
  { tableName: 'Utilisateurs', timestamps: true },
);

(async () => {
  const hash = await bcrypt.hash(password, 10);
  let user = await Utilisateur.findOne({ where: { email } });

  if (!user) {
    user = await Utilisateur.create({
      nom: 'Admin',
      email,
      mot_de_passe: hash,
      role: 'admin',
    });
    console.log(`Compte créé : ${email}`);
  } else {
    await user.update({ mot_de_passe: hash });
    console.log(`Mot de passe mis à jour : ${email}`);
  }

  const ok = await bcrypt.compare(password, user.mot_de_passe);
  console.log(ok ? 'Vérification OK' : 'ERREUR vérification');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
