const mongoose = require('mongoose');

const advisorySchema = new mongoose.Schema({
    farm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        required: true
    },
    advisory_text: {
        type: String,
        required: true
    },
    weather_snapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    query: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Advisory', advisorySchema);
