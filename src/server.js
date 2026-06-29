require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); 
const sequelize = require('./config/db');
const adminRoutes = require('./routes/admin.routes');

require('./models/user.model');
require('./models/entreprise.model');
require('./models/comment.model');
require('./models/upgradeRequest.model');


const userRoutes = require('./routes/user.routes');
const entrepriseRoutes = require('./routes/entreprise.routes');
const commentRoutes = require('./routes/comment.routes');
const upgradeRoutes = require('./routes/upgrade.routes');

const app = express();




app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));
app.use('/api/users', userRoutes);
app.use('/api/entreprises', entrepriseRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enterprise', upgradeRoutes);
const PORT = process.env.PORT || 5000;


sequelize.sync({ alter: true }) 
  .then(() => {
    console.log('Base de données PostgreSQL synchronisée !');
    app.listen(PORT, () => {
      console.log(`Serveur GreenBiz Postgres démarré sur le port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Impossible de se connecter à PostgreSQL :', err);
  });

