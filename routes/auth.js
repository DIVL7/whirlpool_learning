// Make sure this file has the correct route configuration
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/check-session', authController.checkSession);
router.get('/logout', authController.logout);

module.exports = router;