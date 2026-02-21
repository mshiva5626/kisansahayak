const jwt = require('jsonwebtoken');
const { getSupabase } = require('../config/db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Temporary in-memory OTP store (email -> { otp, expiresAt })
const otpStore = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'kisansahayakapp@gmail.com',
        pass: process.env.EMAIL_PASS || 'dummy_password'
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
        const supabase = getSupabase();
        const normalizedEmail = email.toLowerCase().trim();

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data: user, error } = await supabase
            .from('users')
            .insert([{ email: normalizedEmail, password: hashedPassword, name: name || '' }])
            .select()
            .single();

        if (error) throw error;

        const token = generateToken(user.id);

        res.status(201).json({
            token,
            user: { ...user, _id: user.id }
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
        const supabase = getSupabase();
        const normalizedEmail = email.toLowerCase().trim();

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user.id);

        res.status(200).json({
            token,
            user: { ...user, _id: user.id }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const supabase = getSupabase();
        const userId = req.user._id || req.user.id;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, mobile_number, farming_type, preferred_language, state, district')
            .eq('id', userId)
            .maybeSingle();

        if (error || !user) return res.status(404).json({ message: 'User not found' });

        user._id = user.id; // Map id to _id for frontend compatibility
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    const { name, mobile_number, preferred_language, state, district, farming_type } = req.body;
    const userId = req.user._id || req.user.id;

    try {
        const supabase = getSupabase();

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (mobile_number !== undefined) updates.mobile_number = mobile_number;
        if (preferred_language !== undefined) updates.preferred_language = preferred_language;
        if (state !== undefined) updates.state = state;
        if (district !== undefined) updates.district = district;
        if (farming_type !== undefined) updates.farming_type = farming_type;

        updates.updated_at = new Date().toISOString();

        const { data: user, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        user._id = user.id;

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const supabase = getSupabase();
        const normalizedEmail = email.toLowerCase().trim();

        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        otpStore[normalizedEmail] = {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000
        };

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
        const supabase = getSupabase();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const { error } = await supabase
            .from('users')
            .update({ password: hashedPassword, updated_at: new Date().toISOString() })
            .eq('email', normalizedEmail);

        if (error) throw error;

        delete otpStore[normalizedEmail];
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
