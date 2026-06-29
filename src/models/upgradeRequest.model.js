const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LabelUpgradeRequest = sequelize.define('LabelUpgradeRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  currentLevel: {
    type: DataTypes.ENUM('Bronze', 'Silver', 'Gold'),
    allowNull: false
  },
  requestedLevel: {
    type: DataTypes.ENUM('Silver', 'Gold'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  comment: {
    type: DataTypes.TEXT, // L'entreprise explique pourquoi elle mérite l'upgrade
    allowNull: true
  },
  adminNotes: {
    type: DataTypes.TEXT, // Pourquoi l'admin a accepté ou refusé
    allowNull: true
  }
});

// Relations
const Entreprise = require('./entreprise.model');
LabelUpgradeRequest.belongsTo(Entreprise, { foreignKey: 'entrepriseId', onDelete: 'CASCADE' });
Entreprise.hasMany(LabelUpgradeRequest, { foreignKey: 'entrepriseId' });

module.exports = LabelUpgradeRequest;