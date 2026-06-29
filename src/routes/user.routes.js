const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware'); 


router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);


router.put('/profile/:id', protect, ctrl.updateProfile);
router.put('/change-password/:id', protect, ctrl.changePassword);

module.exports = router;