const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        default: ''
    },
    mobile_number: {
        type: String,
        default: ''
    },
    preferred_language: {
        type: String,
        enum: ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'ml', 'gu', 'pa', 'bn'],
        default: 'en'
    },
    state: {
        type: String,
        default: ''
    },
    district: {
        type: String,
        default: ''
    },
    farming_type: {
        type: String,
        enum: ['organic', 'conventional', ''],
        default: ''
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
