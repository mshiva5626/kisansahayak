const jwt = require('jsonwebtoken');
const { getIsConnected } = require('../config/db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Temporary in-memory OTP store (email -> { otp, expiresAt })
const otpStore = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'kisansahayakapp@gmail.com', // Replace with real or use ENV
        pass: process.env.EMAIL_PASS || 'dummy_password' // Replace with App Password
    }
});

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register new user
exports.register = async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        let user;

        if (getIsConnected()) {
            const User = require('../models/User');
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists with this email' });
            }
            user = await User.create({ email, password, name: name || '' });
        } else {
            const { UserStore } = require('../memoryStore');
            const existingUser = await UserStore.findOne({ email: email.toLowerCase().trim() });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists with this email' });
            }
            user = await UserStore.create({ email, password, name: name || '' });
        }

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                mobile_number: user.mobile_number || '',
                preferred_language: user.preferred_language || 'en',
                state: user.state || '',
                district: user.district || '',
                farming_type: user.farming_type || ''
            }
        });
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Login existing user
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        let user, isMatch;

        if (getIsConnected()) {
            const User = require('../models/User');
            user = await User.findOne({ email });
            if (!user) return res.status(401).json({ message: 'Invalid email or password' });
            isMatch = await user.matchPassword(password);
        } else {
            const { UserStore } = require('../memoryStore');
            user = await UserStore.findOne({ email: email.toLowerCase().trim() });
            if (!user) return res.status(401).json({ message: 'Invalid email or password' });
            isMatch = await UserStore.matchPassword(user, password);
        }

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                mobile_number: user.mobile_number || '',
                preferred_language: user.preferred_language || 'en',
                state: user.state || '',
                district: user.district || '',
                farming_type: user.farming_type || ''
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        let user;
        if (getIsConnected()) {
            const User = require('../models/User');
            user = await User.findById(req.user._id).select('-password');
        } else {
            const { UserStore } = require('../memoryStore');
            user = await UserStore.findById(req.user._id);
            if (user) {
                const { password, ...safe } = user;
                user = safe;
            }
        }
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    const { name, mobile_number, preferred_language, state, district, farming_type } = req.body;

    try {
        let user;

        if (getIsConnected()) {
            const User = require('../models/User');
            user = await User.findById(req.user._id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            if (name !== undefined) user.name = name;
            if (mobile_number !== undefined) user.mobile_number = mobile_number;
            if (preferred_language !== undefined) user.preferred_language = preferred_language;
            if (state !== undefined) user.state = state;
            if (district !== undefined) user.district = district;
            if (farming_type !== undefined) user.farming_type = farming_type;
            await user.save();
        } else {
            const { UserStore } = require('../memoryStore');
            user = await UserStore.findById(req.user._id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            if (name !== undefined) user.name = name;
            if (mobile_number !== undefined) user.mobile_number = mobile_number;
            if (preferred_language !== undefined) user.preferred_language = preferred_language;
            if (state !== undefined) user.state = state;
            if (district !== undefined) user.district = district;
            if (farming_type !== undefined) user.farming_type = farming_type;
            await UserStore.save(user);
        }

        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                mobile_number: user.mobile_number || '',
                preferred_language: user.preferred_language || 'en',
                state: user.state || '',
                district: user.district || '',
                farming_type: user.farming_type || ''
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        let user;
        if (getIsConnected()) {
            const User = require('../models/User');
            user = await User.findOne({ email });
        } else {
            const { UserStore } = require('../memoryStore');
            user = await UserStore.findOne({ email: email.toLowerCase().trim() });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with 10 minute expiry
        otpStore[email.toLowerCase().trim()] = {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000
        };

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'kisansahayakapp@gmail.com',
            to: email,
            subject: 'Kisan Sahayak - Password Reset OTP',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #2e7d32;">Kisan Sahayak</h2>
                    <p>You requested a password reset. Your OTP is:</p>
                    <h1 style="letter-spacing: 5px; color: #15803d; background: #f0fdf4; padding: 10px; display: inline-block; border-radius: 5px;">${otp}</h1>
                    <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        // Log to console for easy testing if email fails
        console.log(`[DEV ONLY] OTP for ${email}: ${otp}`);

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.warn('Email failed to send, but OTP logged to console. Check EMAIL_USER/EMAIL_PASS in .env');
        }

        res.status(200).json({ message: 'OTP sent successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reset Password - Verify OTP & Update
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const storedData = otpStore[normalizedEmail];

    if (!storedData) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (Date.now() > storedData.expiresAt) {
        delete otpStore[normalizedEmail];
        return res.status(400).json({ message: 'OTP has expired' });
    }

    if (storedData.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    try {
        if (getIsConnected()) {
            const User = require('../models/User');
            const user = await User.findOne({ email: normalizedEmail });
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            await user.save();
        } else {
            const { UserStore } = require('../memoryStore');
            const user = await UserStore.findOne({ email: normalizedEmail });
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            await UserStore.save(user);
        }

        // Clean up OTP
        delete otpStore[normalizedEmail];

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
