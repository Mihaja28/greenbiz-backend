const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Review', 'Label', 'System'),
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // targetId permet de lier la notification à l'ID de l'entreprise ou du citoyen
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false
  }
});

module.exports = Notification;