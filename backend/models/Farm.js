const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    farm_name: {
        type: String,
        required: true
    },
    state: {
        type: String,
        default: ''
    },
    area: {
        type: String,
        default: ''
    },
    terrain_type: {
        type: String,
        enum: ['plain', 'sloping', 'hilly', ''],
        default: ''
    },
    water_source: {
        type: String,
        enum: ['rainfed', 'canal', 'borewell', 'drip', ''],
        default: ''
    },
    crop_type: {
        type: String,
        default: ''
    },
    sowing_date: {
        type: Date,
        default: null
    },
    latitude: {
        type: Number,
        default: null
    },
    longitude: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        default: 'Healthy'
    }
}, { timestamps: true });

module.exports = mongoose.model('Farm', farmSchema);
