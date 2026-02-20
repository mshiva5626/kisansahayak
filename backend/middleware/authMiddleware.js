const jwt = require('jsonwebtoken');
const { getIsConnected } = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (getIsConnected()) {
                // MongoDB mode
                const User = require('../models/User');
                req.user = await User.findById(decoded.id).select('-password');
            } else {
                // In-memory mode
                const { UserStore } = require('../memoryStore');
                const user = await UserStore.findById(decoded.id);
                if (user) {
                    // Return user without password
                    const { password, ...userWithoutPassword } = user;
                    req.user = userWithoutPassword;
                }
            }

            if (!req.user) {
                return res.status(401).json({ message: 'User not found, invalid token' });
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
