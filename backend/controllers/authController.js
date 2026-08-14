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

// Register new user (Supabase Native Auth)
exports.register = async (req, res) => {
    const { email, password, name } = req.body;

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

        if (realSupabase && realSupabase.auth) {
            // Check if user already exists in Supabase
            const { data: userList } = await realSupabase.auth.admin.listUsers();
            const existing = userList?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

            if (existing) {
                return res.status(400).json({ message: 'User already exists with this email. Please login instead.' });
            }

            // Create confirmed user in Supabase Auth
            const { data: supaUser, error: supaErr } = await realSupabase.auth.admin.createUser({
                email: normalizedEmail,
                password: password,
                email_confirm: true,
                user_metadata: { name: name || '', role: 'farmer' }
            });

            if (supaErr) {
                return res.status(400).json({ message: supaErr.message });
            }

            authUser = supaUser.user;
            userId = authUser.id;

            // Also attempt to get a Supabase session token
            const { data: signInData } = await realSupabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: password
            });

            token = signInData?.session?.access_token || generateToken(userId);
        } else {
            // Offline fallback
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

            const { data: newUser, error } = await supabase
                .from('users')
                .insert([{ email: normalizedEmail, password: hashedPassword, name: name || '' }])
                .select()
                .single();

            if (error) throw error;
            userId = newUser.id;
            token = generateToken(userId);
        }

        // Ensure user record exists in persistent data store
        const { data: existingRecord } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        let finalUser;
        if (!existingRecord) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const { data: savedRecord } = await supabase
                .from('users')
                .insert([{
                    id: userId,
                    email: normalizedEmail,
                    password: hashedPassword,
                    name: name || '',
                    role: 'farmer',
                    preferred_language: 'en'
                }])
                .select()
                .maybeSingle();
            finalUser = savedRecord || { id: userId, email: normalizedEmail, name: name || '' };
        } else {
            finalUser = existingRecord;
        }

        res.status(201).json({
            token,
            user: { ...finalUser, _id: userId, id: userId, name: name || finalUser.name || '' }
        });
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ message: error.message || 'Registration failed' });
    }
};

// Login existing user (Supabase Native Auth)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const inputStr = email.trim();
        const isEmail = inputStr.includes('@');
        const realSupabase = getRealSupabase();
        const supabase = getSupabase();

        let userId = null;
        let token = null;
        let userData = null;

        if (isEmail && realSupabase && realSupabase.auth) {
            const normalizedEmail = inputStr.toLowerCase();

            // Authenticate with Supabase Auth
            const { data: signInData, error: signInErr } = await realSupabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: password
            });

            if (signInData && signInData.session && signInData.user) {
                userId = signInData.user.id;
                token = signInData.session.access_token;
                userData = {
                    id: userId,
                    email: signInData.user.email,
                    name: signInData.user.user_metadata?.name || signInData.user.user_metadata?.full_name || ''
                };
            } else {
                // If Supabase auth failed, check if user exists in local persistent store
                const { data: localUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', normalizedEmail)
                    .maybeSingle();

                if (localUser && localUser.password) {
                    const isMatch = await bcrypt.compare(password, localUser.password);
                    if (isMatch) {
                        userId = localUser.id;
                        token = generateToken(userId);
                        userData = localUser;

                        // Migrate user to Supabase Auth in background
                        try {
                            await realSupabase.auth.admin.createUser({
                                email: normalizedEmail,
                                password: password,
                                email_confirm: true,
                                user_metadata: { name: localUser.name || '' }
                            });
                        } catch (migrateErr) {
                            // User might already exist in Supabase
                        }
                    } else {
                        return res.status(401).json({ message: 'Invalid email or password' });
                    }
                } else {
                    return res.status(401).json({
                        message: signInErr?.message === 'Invalid login credentials' 
                            ? 'Invalid email or password. Please check your credentials or register.' 
                            : (signInErr?.message || 'Invalid email or password')
                    });
                }
            }
        } else {
            // Phone login or offline mode
            let query = supabase.from('users').select('*');
            if (isEmail) {
                query = query.eq('email', inputStr.toLowerCase());
            } else {
                query = query.eq('mobile_number', inputStr);
            }

            const { data: user, error } = await query.maybeSingle();

            if (error || !user) {
                return res.status(401).json({ message: 'Invalid credentials or user not found. Please register.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email/phone or password' });
            }

            userId = user.id;
            token = generateToken(userId);
            userData = user;
        }

        // Fetch or create profile record in persistent store
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        const mergedUser = {
            ...userData,
            ...(profile || {}),
            id: userId,
            _id: userId
        };

        delete mergedUser.password;

        res.status(200).json({
            token,
            user: mergedUser
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

        const token = accessToken || generateToken(userId);

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

