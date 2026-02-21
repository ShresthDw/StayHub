
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
            phone: phone ? phone.trim() : undefined,   // Agar phone number nahi diya, toh use save hi mat karo (instead of saving empty string).
            role: effectiveRole,
            // Guests are verified immediately; owners need manual verification
            verified: effectiveRole === 'guest' //user ek Guest hai, toh use turant verified: true kar do (use wait nahi karna padega).
        });

        await newUser.save();

        const userData = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            verified: newUser.verified,
            wishlist: []
        };
        res.status(201).json({ msg: 'Registration successful', user: userData });

    } catch (err) {
        console.error(err.message);
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
            maxAge:  60 * 1000 
        });

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            verified: user.verified,
            wishlist: (user.wishlist || []).map(roomId => roomId.toString())
        };
        res.json({ msg: 'Login successful', user: userData });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// GET /api/auth/me

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            verified: user.verified,
            wishlist: (user.wishlist || []).map(roomId => roomId.toString())
        };
        res.json({ user: userData });

    } catch (err) {
        console.error(err.message);
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

        // Update fields that are provided
        if (name !== undefined) user.name = name.trim();
        if (phone !== undefined) user.phone = phone ? phone.trim() : undefined;

        // Handle password change
        if (newPassword) {
            if (newPassword.length < 6) {
                return res.status(400).json({ msg: 'New password must be at least 6 characters' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            verified: user.verified,
            wishlist: (user.wishlist || []).map(roomId => roomId.toString())
        };
        res.json({ msg: 'Profile updated', user: userData });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};



//POST /api/auth/become-owner

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
        user.verified = false; // Unverified until admin approves
        await user.save();

        const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            verified: user.verified,
            wishlist: (user.wishlist || []).map(roomId => roomId.toString())
        };
        res.json({ msg: 'Owner role granted (pending verification)', user: userData });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

//POST /api/auth/logout

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
        const user = await User.findById(req.user.id).populate('wishlist', 'title images pricePerNight location propertyType roomType');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Send wishlist IDs for Redux store (not full objects)
        const wishlistIds = user.wishlist.map(item => item._id.toString());

        const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            verified: user.verified,
            wishlist: wishlistIds
        };

        res.json({ 
            wishlist: user.wishlist || [],
            user: userData
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

        const wishlistIndex = user.wishlist.findIndex(savedRoomId => savedRoomId.toString() === roomId);
        let isWishlisted = false;

        if (wishlistIndex > -1) {
            // Room is already in wishlist, remove it
            user.wishlist.splice(wishlistIndex, 1);
        } else {
            // Room is not in wishlist, add it
            user.wishlist.push(roomId);
            isWishlisted = true;
        }

        await user.save();

        // Populate wishlist for response
        const updatedUser = await User.findById(req.user.id).populate('wishlist', 'title images pricePerNight location propertyType roomType');

        // Send wishlist IDs for Redux store (not full objects)
        const wishlistIds = updatedUser.wishlist.map(item => item._id.toString());

        const userData = {
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            verified: updatedUser.verified,
            wishlist: wishlistIds
        };

        res.json({ 
            msg: isWishlisted ? 'Room added to wishlist' : 'Room removed from wishlist',
            wishlist: updatedUser.wishlist || [],
            user: userData,
            isWishlisted
        });

    } catch (err) {
        console.error('ERROR in POST /api/auth/wishlist/:roomId:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
