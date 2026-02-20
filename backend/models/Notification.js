const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['weather_alert', 'advisory_update', 'scheme_update', 'general'],
        default: 'general'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    farm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        default: null
    },
    is_read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
