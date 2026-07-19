import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import User from '../../models/User.js';

const oauthClient = new OAuth2Client();

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const formatUserData = (user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    avatar: user.avatar || '',
    googleId: user.googleId || '',
    authProvider: user.authProvider || (user.googleId ? 'google' : 'local'),
    role: user.role,
    verified: user.verified,
    wishlist: (user.wishlist || []).map((item) => (item?._id ? item._id.toString() : item.toString()))
});

// POST /api/auth/register
export const register = async (req, res) => {
    const { name, email, password, phone, role } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ msg: 'Name is required' });
    }
    if (!email || !validateEmail(email)) {
        return res.status(400).json({ msg: 'A valid email is required' });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }
    if (role && !['guest', 'owner'].includes(role)) {
        return res.status(400).json({ msg: 'Invalid role' });
    }

    try {
        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(password, salt);

        const effectiveRole = role || 'guest';

        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPwd,
            phone: phone ? phone.trim() : undefined,
            role: effectiveRole,
            authProvider: 'local',
            verified: effectiveRole === 'guest'
        });

        await newUser.save();

        res.status(201).json({
            msg: 'Registration successful',
            user: formatUserData(newUser)
        });

    } catch (err) {
        console.error('Register Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// POST /api/auth/login
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (!user.password) {
            return res.status(400).json({
                msg: 'This account uses Google Sign-In. Please sign in with Google.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            msg: 'Login successful',
            user: formatUserData(user)
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// POST /api/auth/google
export const googleAuth = async (req, res) => {
    const { credential, token, role } = req.body;
    const idToken = credential || token;

    if (!idToken) {
        return res.status(400).json({ msg: 'Google credential or ID token is required' });
    }

    try {
        let payload = null;
        const googleClientId = process.env.GOOGLE_CLIENT_ID;

        try {
            if (googleClientId) {
                const ticket = await oauthClient.verifyIdToken({
                    idToken,
                    audience: googleClientId
                });
                payload = ticket.getPayload();
            } else {
                const ticket = await oauthClient.verifyIdToken({ idToken });
                payload = ticket.getPayload();
            }
        } catch (verifyErr) {
            // Fallback verification via Google oauth2 tokeninfo endpoint
            const tokenInfoRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
            payload = tokenInfoRes.data;
        }

        if (!payload || !payload.email) {
            return res.status(400).json({ msg: 'Unable to retrieve email from Google token' });
        }

        const { sub: googleId, email, name, picture } = payload;
        const normalizedEmail = email.toLowerCase().trim();

        let user = await User.findOne({
            $or: [
                { googleId },
                { email: normalizedEmail }
            ]
        });

        if (user) {
            let changed = false;
            if (!user.googleId && googleId) {
                user.googleId = googleId;
                changed = true;
            }
            if (picture && !user.avatar) {
                user.avatar = picture;
                changed = true;
            }
            if (!user.verified) {
                user.verified = true;
                changed = true;
            }
            if (changed) {
                await user.save();
            }
        } else {
            const effectiveRole = role && ['guest', 'owner'].includes(role) ? role : 'guest';
            user = new User({
                name: name || 'Google User',
                email: normalizedEmail,
                googleId,
                avatar: picture || '',
                role: effectiveRole,
                authProvider: 'google',
                verified: true
            });
            await user.save();
        }

        const authToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.cookie('authToken', authToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            msg: 'Google authentication successful',
            user: formatUserData(user)
        });

    } catch (err) {
        console.error('Google Auth Error:', err);
        const errMsg = err.response?.data?.error_description || err.message || 'Invalid token';
        res.status(400).json({ msg: `Google authentication failed: ${errMsg}` });
    }
};

// GET /api/auth/me
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ user: formatUserData(user) });

    } catch (err) {
        console.error('getCurrentUser Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// PUT /api/auth/profile
export const updateProfile = async (req, res) => {
    const { name, phone, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (name !== undefined) user.name = name.trim();
        if (phone !== undefined) user.phone = phone ? phone.trim() : undefined;

        if (newPassword) {
            if (newPassword.length < 6) {
                return res.status(400).json({ msg: 'New password must be at least 6 characters' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        res.json({
            msg: 'Profile updated',
            user: formatUserData(user)
        });

    } catch (err) {
        console.error('updateProfile Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// POST /api/auth/become-owner
export const becomeOwner = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.role === 'owner') {
            return res.status(400).json({ msg: 'User is already an owner' });
        }

        user.role = 'owner';
        user.verified = false;
        await user.save();

        const token = jwt.sign(
            { id: user._id.toString(), role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            msg: 'Owner role granted (pending verification)',
            user: formatUserData(user)
        });

    } catch (err) {
        console.error('ERROR in becomeOwner:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
    });
    res.json({ msg: 'Logout successful' });
};

// GET /api/auth/wishlist
export const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: 'wishlist',
                select: 'title images pricePerNight rating location address propertyType roomType',
                options: { slice: { images: 1 } }
            })
            .lean();

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ 
            wishlist: user.wishlist || [],
            user: formatUserData(user)
        });

    } catch (err) {
        console.error('ERROR in GET /api/auth/wishlist:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// POST /api/auth/wishlist/:roomId
export const toggleWishlist = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({ msg: 'Room ID is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const wishlistIndex = (user.wishlist || []).findIndex(savedRoomId => savedRoomId.toString() === roomId);
        let isWishlisted = false;

        if (wishlistIndex > -1) {
            user.wishlist.splice(wishlistIndex, 1);
        } else {
            user.wishlist.push(roomId);
            isWishlisted = true;
        }

        await user.save();

        const updatedUser = await User.findById(req.user.id)
            .populate({
                path: 'wishlist',
                select: 'title images pricePerNight rating location address propertyType roomType',
                options: { slice: { images: 1 } }
            })
            .lean();

        res.json({ 
            msg: isWishlisted ? 'Room added to wishlist' : 'Room removed from wishlist',
            wishlist: updatedUser.wishlist || [],
            user: formatUserData(updatedUser),
            isWishlisted
        });

    } catch (err) {
        console.error('ERROR in POST /api/auth/wishlist/:roomId:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
