const express = require('express');
const {
  getAllUsers,
  getUserStats,
  deleteUser,
  updateUserPassword,
  getProfile,
} = require('../controllers/userController');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.get('/profile', authenticate, getProfile);
router.get('/stats', authenticate, adminOnly, getUserStats);
router.get('/all', authenticate, adminOnly, getAllUsers);
router.delete('/:userId', authenticate, adminOnly, deleteUser);
router.patch('/:userId/password', authenticate, adminOnly, updateUserPassword);

module.exports = router;
