const express = require('express');
const router = express.Router();
const upgradeController = require('../controllers/upgrade.controller');
const { protect } = require('../middlewares/auth.middleware');


router.post('/request-upgrade', protect, upgradeController.createUpgradeRequest);

module.exports = router;