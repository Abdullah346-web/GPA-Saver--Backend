const express = require('express');
const { login, logout, heartbeat, leave, registerUser } = require('../controllers/authController');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/heartbeat', authenticate, heartbeat);
router.post('/leave', leave);
router.post('/register', authenticate, adminOnly, registerUser);

module.exports = router;
