const jwt = require('jsonwebtoken');
const { getIsConnected } = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Allow bypassing JWT verification if it's the specific hardcoded demo token (for legacy demo paths if any)
            let decoded;
            if (token === 'demo-token') {
                decoded = { id: 'demo-user-123' };
            } else {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            }

            const { getSupabase } = require('../config/db');
            const supabase = getSupabase();

            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', decoded.id)
                .maybeSingle();

            if (error || !user) {
                return res.status(401).json({ message: 'User not found, invalid token' });
            }

            // Return user without password
            const { password, ...userWithoutPassword } = user;
            userWithoutPassword._id = userWithoutPassword.id; // Map id to _id for older controllers
            req.user = userWithoutPassword;

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
