const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Entreprise = require('./entreprise.model');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user: {
    type: DataTypes.STRING,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: 1,
      max: 5
    }
  },

  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Clé étrangère automatique : Associe un commentaire à une entreprise
Comment.belongsTo(Entreprise, { foreignKey: 'entrepriseId', onDelete: 'CASCADE' });
Entreprise.hasMany(Comment, { foreignKey: 'entrepriseId' });

module.exports = Comment;