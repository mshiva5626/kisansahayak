const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    benefits: {
        type: String,
        required: true
    },
    eligibility: {
        type: String,
        required: true
    },
    application_guidance: {
        type: String,
        required: true
    },
    state: {
        type: String,
        default: 'Central'
    },
    scheme_type: {
        type: String,
        enum: ['central', 'state'],
        default: 'central'
    },
    ministry: {
        type: String,
        default: ''
    },
    website_url: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Scheme', schemeSchema);
