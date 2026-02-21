const { getSupabase } = require('../config/db');

// Get all notifications for the logged-in user
exports.getNotifications = async (req, res) => {
    try {
        const supabase = getSupabase();
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.user._id || req.user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error && error.code === '42P01') {
            // Table doesn't exist yet, gracefully return empty
            return res.status(200).json({ notifications: [], unread_count: 0 });
        }
        if (error) throw error;

        const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;
        res.status(200).json({ notifications: notifications || [], unread_count: unreadCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', req.params.id)
            .eq('user_id', req.user._id || req.user.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Notification not found' });

        res.status(200).json({ notification: data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const supabase = getSupabase();
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', req.user._id || req.user.id)
            .eq('is_read', false);

        if (error) throw error;
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

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                user_id,
                type: type || 'general',
                title,
                message,
                farm_id: farm_id || null
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ notification: data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
