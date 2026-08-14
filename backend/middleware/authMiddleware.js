const jwt = require('jsonwebtoken');
const { getSupabase, getRealSupabase } = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                return res.status(401).json({ message: 'Not authorized, no token provided' });
            }

            // 1. Allow demo token
            if (token === 'demo-token') {
                req.user = { id: 'demo-user-123', _id: 'demo-user-123', name: 'Demo Farmer', email: 'demo@kisansahayak.com' };
                return next();
            }

            let userId = null;
            let userEmail = null;
            let userName = '';

            // 2. Try verifying as Supabase access token first if real Supabase client is available
            const realSupabase = getRealSupabase();
            if (realSupabase && realSupabase.auth) {
                try {
                    const { data: supaAuthData, error: supaErr } = await realSupabase.auth.getUser(token);
                    if (!supaErr && supaAuthData && supaAuthData.user) {
                        userId = supaAuthData.user.id;
                        userEmail = supaAuthData.user.email;
                        userName = supaAuthData.user.user_metadata?.name || '';
                    }
                } catch (e) {
                    // Ignore and fallback to custom JWT
                }
            }

            // 3. If not resolved via Supabase token, verify custom app JWT
            if (!userId) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kisan_farm_copilot_jwt_secret_2026');
                    userId = decoded.id;
                } catch (jwtErr) {
                    // Token verification failed
                    console.error('JWT verify error:', jwtErr.message);
                    return res.status(401).json({ message: 'Not authorized, invalid token' });
                }
            }

            const supabase = getSupabase();
            const { data: user } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (user) {
                const { password, ...userWithoutPassword } = user;
                userWithoutPassword._id = userWithoutPassword.id || userId;
                req.user = userWithoutPassword;
            } else {
                // If user authenticated via Supabase but record not yet in table, build user object
                req.user = {
                    id: userId,
                    _id: userId,
                    email: userEmail || '',
                    name: userName || ''
                };
            }

            next();
        } catch (error) {
            console.error('Auth middleware error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };

