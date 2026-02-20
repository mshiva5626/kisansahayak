const Notification = require('../models/Notification');

// Get all notifications for the logged-in user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user_id: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ user_id: req.user._id, is_read: false });

        res.status(200).json({ notifications, unread_count: unreadCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user._id },
            { is_read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({ notification });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user_id: req.user._id, is_read: false },
            { is_read: true }
        );
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a notification (backend hook for alerts)
exports.createAlert = async (req, res) => {
    try {
        const { user_id, type, title, message, farm_id } = req.body;

        if (!user_id || !title || !message) {
            return res.status(400).json({ message: 'user_id, title, and message are required' });
        }

        const notification = await Notification.create({
            user_id,
            type: type || 'general',
            title,
            message,
            farm_id: farm_id || null
        });

        res.status(201).json({ notification });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
