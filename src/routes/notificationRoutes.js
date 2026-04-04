const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get notifications
router.get('/', getUserNotifications);

// Mark as read
router.patch('/:notificationId/read', markAsRead);

// Mark all as read
router.patch('/mark/all-read', markAllAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

module.exports = router;
