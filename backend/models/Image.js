const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    farm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        required: true
    },
    image_url: {
        type: String,
        required: true
    },
    image_type: {
        type: String,
        enum: ['leaf', 'soil', 'field'],
        default: 'field'
    },
    analysis_result: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    confidence_score: {
        type: Number,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);
