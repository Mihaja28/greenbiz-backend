const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Entreprise = sequelize.define('Entreprise', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contact: {
        type: DataTypes.STRING,
        allowNull: true
    },
    region: {
        type: DataTypes.STRING,
        allowNull: false
    },

    address: {
        type: DataTypes.STRING,
        allowNull: false 
    },

    labelLevel: {
        type: DataTypes.ENUM('Bronze', 'Silver', 'Gold'),
        defaultValue: 'Bronze'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending', // Une nouvelle entreprise est TOUJOURS en attente par défaut
        allowNull: false
    },
    isValidated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // Par défaut, l'entreprise n'est pas encore validée
  },
    logoUrl: {
        type: DataTypes.STRING,
        allowNull: true // Facultatif au début
    },
    galleryUrls: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [] // Un tableau vide par défaut
    }
});

module.exports = Entreprise;