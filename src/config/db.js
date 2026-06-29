const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');




require('dotenv').config();

const sequelize = new Sequelize('greenbiz', 'postgres', 'himjaa', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
});
module.exports = sequelize;