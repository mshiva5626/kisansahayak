const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, createAlert } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Get all notifications for the user
router.get('/', protect, getNotifications);

// Mark all as read
router.put('/read-all', protect, markAllAsRead);

// Mark one notification as read
router.put('/:id/read', protect, markAsRead);

// Create an alert notification (backend hook)
router.post('/alert', createAlert);

module.exports = router;
