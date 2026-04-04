const express = require('express');
const { login, logout, registerUser, forceLogoutAll } = require('../controllers/authController');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/force-logout-all', forceLogoutAll);
router.post('/logout', authenticate, logout);
router.post('/register', authenticate, adminOnly, registerUser);

module.exports = router;
