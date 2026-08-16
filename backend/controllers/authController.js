const jwt = require('jsonwebtoken');
const { getSupabase, getRealSupabase } = require('../config/db');
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
    return jwt.sign({ id }, process.env.JWT_SECRET || 'kisan_farm_copilot_jwt_secret_2026', { expiresIn: '30d' });
};

// Register new user (Supabase Native Auth + Local Hybrid Store)
exports.register = async (req, res) => {
    const { 
        email, 
        password, 
        name, 
        age, 
        mobile_number, 
        land_size, 
        experience_years, 
        estimated_revenue, 
        has_degree,
        education_qualification,
        role,
        preferred_language, 
        farming_type 
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const realSupabase = getRealSupabase();
        const supabase = getSupabase();

        let userId = null;
        let authUser = null;
        let token = null;

        const assignedRole = role || (has_degree ? 'verified_agri_entrepreneur' : 'verified_farmer');

        const profileMetadata = {
            name: name || '',
            age: age ? Number(age) : null,
            mobile_number: mobile_number || '',
            land_size: land_size || '',
            experience_years: experience_years || '',
            estimated_revenue: estimated_revenue || '',
            has_degree: Boolean(has_degree),
            education_qualification: education_qualification || '',
            role: assignedRole,
            preferred_language: preferred_language || 'en',
            farming_type: farming_type || 'Conventional'
        };

        // 1. Hash password for secure local persistence
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Try Supabase Auth integration if available
        if (realSupabase && realSupabase.auth) {
            try {
                // Check if user already exists in Supabase
                const { data: supaUser, error: supaErr } = await realSupabase.auth.admin.createUser({
                    email: normalizedEmail,
                    password: password,
                    email_confirm: true,
                    user_metadata: profileMetadata
                });

                if (!supaErr && supaUser?.user) {
                    authUser = supaUser.user;
                    userId = authUser.id;

                    const { data: signInData } = await realSupabase.auth.signInWithPassword({
                        email: normalizedEmail,
                        password: password
                    });
                    token = signInData?.session?.access_token;
                }
            } catch (supaNetErr) {
                console.warn('Supabase Auth remote error/timeout, using local fallback:', supaNetErr.message);
            }
        }

        // 3. Fallback UUID if Supabase was offline
        if (!userId) {
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', normalizedEmail)
                .maybeSingle();

            if (existingUser) {
                return res.status(400).json({ message: 'User already exists with this email' });
            }
            userId = 'farmer_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
        }

        if (!token) {
            token = generateToken(userId);
        }

        // 4. Save/update full farmer profile in persistent store
        const { data: existingRecord } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        let finalUser;
        if (!existingRecord) {
            const { data: savedRecord } = await supabase
                .from('users')
                .insert([{
                    id: userId,
                    email: normalizedEmail,
                    password: hashedPassword,
                    ...profileMetadata
                }])
                .select()
                .maybeSingle();
            finalUser = savedRecord || { id: userId, email: normalizedEmail, ...profileMetadata };
        } else {
            const { data: updatedRecord } = await supabase
                .from('users')
                .update({
                    ...profileMetadata,
                    password: hashedPassword
                })
                .eq('id', userId)
                .select()
                .maybeSingle();
            finalUser = updatedRecord || existingRecord;
        }

        const userResponse = { ...finalUser, ...profileMetadata, _id: userId, id: userId };
        delete userResponse.password;

        res.status(201).json({
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ message: error.message || 'Registration failed' });
    }
};

// Login existing user (Supports Email OR Mobile Number)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email/Mobile and password are required' });
    }

    try {
        const inputStr = email.trim();
        const isEmail = inputStr.includes('@');
        const supabase = getSupabase();
        const realSupabase = getRealSupabase();

        let user = null;

        // 1. Search persistent store by Email OR Mobile
        if (isEmail) {
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('email', inputStr.toLowerCase())
                .maybeSingle();
            user = data;
        } else {
            // Mobile search (e.g. 9876543210)
            const cleanDigits = inputStr.replace(/\D/g, '');
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('mobile_number', cleanDigits || inputStr)
                .maybeSingle();
            user = data;
        }

        // 2. If user found locally, verify bcrypt password
        if (user && user.password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const userId = user.id || user._id;
                const token = generateToken(userId);
                const userResponse = { ...user, id: userId, _id: userId };
                delete userResponse.password;

                return res.status(200).json({
                    token,
                    user: userResponse
                });
            }
        }

        // 3. If email login and Supabase Auth is online, try Supabase password login
        if (isEmail && realSupabase && realSupabase.auth) {
            try {
                const { data: signInData, error: signInErr } = await realSupabase.auth.signInWithPassword({
                    email: inputStr.toLowerCase(),
                    password: password
                });

                if (signInData?.session && signInData?.user) {
                    const userId = signInData.user.id;
                    const token = generateToken(userId);
                    const userData = {
                        id: userId,
                        _id: userId,
                        email: signInData.user.email,
                        name: signInData.user.user_metadata?.name || 'Farmer',
                        preferred_language: signInData.user.user_metadata?.preferred_language || 'en',
                        ...(user || {})
                    };
                    delete userData.password;

                    return res.status(200).json({
                        token,
                        user: userData
                    });
                }
            } catch (supaErr) {
                console.warn('Supabase remote sign in error:', supaErr.message);
            }
        }

        return res.status(401).json({ 
            message: 'Invalid email/mobile number or password. Please check your credentials or register.' 
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: error.message || 'Login failed' });
    }
};

// Generate Supabase Google OAuth URL
exports.getGoogleAuthUrl = async (req, res) => {
    try {
        const redirectTo = req.query.redirectTo || 'http://localhost:5173';
        const realSupabase = getRealSupabase();

        if (realSupabase && realSupabase.auth) {
            const { data, error } = await realSupabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectTo
                }
            });

            if (error) throw error;
            return res.status(200).json({ url: data.url });
        }

        // Fallback direct Supabase URL
        const supabaseUrl = process.env.SUPABASE_URL || 'https://fcnvihbpuxhkwjvxdrim.supabase.co';
        const url = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
        res.status(200).json({ url });
    } catch (error) {
        console.error('Google Auth URL error:', error.message);
        res.status(500).json({ message: error.message || 'Failed to generate Google auth URL' });
    }
};

// Sync Google OAuth user session
exports.googleSync = async (req, res) => {
    const { accessToken, user: clientUser } = req.body;

    if (!accessToken && !clientUser) {
        return res.status(400).json({ message: 'Access token or user object is required' });
    }

    try {
        const realSupabase = getRealSupabase();
        const supabase = getSupabase();

        let verifiedUser = null;

        if (accessToken && realSupabase && realSupabase.auth) {
            const { data: authData, error } = await realSupabase.auth.getUser(accessToken);
            if (!error && authData?.user) {
                verifiedUser = authData.user;
            }
        }

        if (!verifiedUser && clientUser) {
            verifiedUser = clientUser;
        }

        if (!verifiedUser || !verifiedUser.id) {
            return res.status(401).json({ message: 'Invalid or expired Google OAuth session' });
        }

        const userId = verifiedUser.id;
        const userEmail = verifiedUser.email?.toLowerCase() || '';
        const userName = verifiedUser.user_metadata?.full_name || verifiedUser.user_metadata?.name || verifiedUser.name || 'Farmer';

        // Check if user exists in persistent store
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        let finalUser;
        if (!existingUser) {
            const { data: createdUser } = await supabase
                .from('users')
                .insert([{
                    id: userId,
                    email: userEmail,
                    name: userName,
                    avatar_url: verifiedUser.user_metadata?.avatar_url || '',
                    role: 'farmer',
                    preferred_language: 'en'
                }])
                .select()
                .maybeSingle();
            finalUser = createdUser || { id: userId, email: userEmail, name: userName };
        } else {
            finalUser = existingUser;
        }

        // Always issue a long-lived application JWT token
        const token = generateToken(userId);

        res.status(200).json({
            token,
            user: {
                ...finalUser,
                id: userId,
                _id: userId,
                name: finalUser.name || userName,
                email: finalUser.email || userEmail
            }
        });
    } catch (error) {
        console.error('Google sync error:', error.message);
        res.status(500).json({ message: error.message || 'Google authentication sync failed' });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const supabase = getSupabase();
        const userId = req.user._id || req.user.id;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, mobile_number, farming_type, preferred_language, state, district, avatar_url')
            .eq('id', userId)
            .maybeSingle();

        if (user) {
            user._id = user.id;
            return res.status(200).json({ user });
        }

        // Return user from auth session if profile query was empty
        const fallbackUser = {
            id: userId,
            _id: userId,
            name: req.user.name || '',
            email: req.user.email || '',
            mobile_number: req.user.mobile_number || '',
            farming_type: req.user.farming_type || '',
            preferred_language: req.user.preferred_language || 'en',
            state: req.user.state || '',
            district: req.user.district || ''
        };

        res.status(200).json({ user: fallbackUser });
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
        const realSupabase = getRealSupabase();

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (mobile_number !== undefined) updates.mobile_number = mobile_number;
        if (preferred_language !== undefined) updates.preferred_language = preferred_language;
        if (state !== undefined) updates.state = state;
        if (district !== undefined) updates.district = district;
        if (farming_type !== undefined) updates.farming_type = farming_type;
        updates.updated_at = new Date().toISOString();

        // Update in persistent table
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        let updatedUser;
        if (existingUser) {
            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .maybeSingle();
            if (error) throw error;
            updatedUser = data;
        } else {
            const { data, error } = await supabase
                .from('users')
                .insert([{ id: userId, email: req.user.email || '', ...updates }])
                .select()
                .maybeSingle();
            if (error) throw error;
            updatedUser = data;
        }

        // Sync name to Supabase Auth metadata if real Supabase available
        if (realSupabase && realSupabase.auth && name) {
            try {
                await realSupabase.auth.admin.updateUserById(userId, {
                    user_metadata: { name }
                });
            } catch (e) {
                // Ignore metadata update error
            }
        }

        const result = updatedUser || { id: userId, ...updates };
        result._id = userId;

        res.status(200).json({ user: result });
    } catch (error) {
        console.error('Update profile error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const normalizedEmail = email.toLowerCase().trim();
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
                    <h2 style="color: #2e7d32;">Kisan Sahayak (किसान सहायक)</h2>
                    <p>You requested a password reset. Your 6-digit OTP is:</p>
                    <h1 style="letter-spacing: 5px; color: #15803d; background: #f0fdf4; padding: 10px; display: inline-block; border-radius: 5px;">${otp}</h1>
                    <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        console.log(`[AUTH] OTP for ${email}: ${otp}`);

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.warn('Email failed to send, but OTP logged to console. Check EMAIL_USER/EMAIL_PASS in .env');
        }

        res.status(200).json({ message: 'OTP sent successfully to your email' });
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

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
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
        return res.status(400).json({ message: 'Invalid OTP entered' });
    }

    try {
        const realSupabase = getRealSupabase();
        const supabase = getSupabase();

        // 1. Update in Supabase Auth if user exists there
        if (realSupabase && realSupabase.auth) {
            const { data: userList } = await realSupabase.auth.admin.listUsers();
            const supaUser = userList?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
            if (supaUser) {
                await realSupabase.auth.admin.updateUserById(supaUser.id, {
                    password: newPassword
                });
            }
        }

        // 2. Update in persistent table
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await supabase
            .from('users')
            .update({ password: hashedPassword, updated_at: new Date().toISOString() })
            .eq('email', normalizedEmail);

        delete otpStore[normalizedEmail];
        res.status(200).json({ message: 'Password reset successfully. You can now login.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

