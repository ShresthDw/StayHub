// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authenticate user via JWT cookie or x-user-id header
 * Verifies user exists in DB and attaches user data to req.user
 */
export const mockAuth = async (req, res, next) => {
    const token = req.cookies.authToken;
    const userId = req.headers['x-user-id'];

    if (!token && !userId) {
        return res.status(401).json({ msg: 'Authentication required' });
    }

    try {
        if (token) {
            // Verify JWT token from cookie
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            req.user = { id: decoded.id, role: decoded.role };
            return next();
        }

        if (userId) {
            // Fallback to header-based auth
            const user = await User.findById(userId).select('-password');
            if (!user) {
                return res.status(401).json({ msg: 'User not found' });
            }
            req.user = { id: user._id.toString(), role: user.role, verified: user.verified };
            return next();
        }
    } catch (err) {
        return res.status(401).json({ msg: 'Invalid authentication' });
    }
};

export default mockAuth;
