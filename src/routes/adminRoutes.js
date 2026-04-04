const express = require('express');
const { createUser } = require('../controllers/authController');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/create-user', authenticate, adminOnly, createUser);

module.exports = router;
