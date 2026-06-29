const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('dotenv').config();

// ─── CONNEXION À LA BASE DE DONNÉES ───
// Si DATABASE_URL existe (cas de Render + Neon en production), on l'utilise.
// Sinon (développement local sur votre PC), on garde l'ancienne configuration.
let sequelize;

if (process.env.DATABASE_URL) {
  // Connexion via Neon (production)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // nécessaire pour Neon
      },
    },
  });
} else {
  // Connexion locale (développement sur votre PC)
  sequelize = new Sequelize('greenbiz', 'postgres', 'himjaa', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
  });
}

module.exports = sequelize;