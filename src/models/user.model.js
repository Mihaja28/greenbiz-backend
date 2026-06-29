const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
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
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('citoyen', 'admin'),
    defaultValue: 'citoyen', 
    allowNull: false
  },

  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true 
  },
 
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true 
  }
});

module.exports = User;