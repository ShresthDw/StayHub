// routes/auth.js
import express from 'express';
import bcrypt  from 'bcryptjs';
import User    from '../models/User.js';

const router = express.Router();

// ---------- helpers ----------
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// @route   POST /api/auth/register
// @desc    Register a guest or owner (owners start unverified)
router.post('/register', async (req, res) => {
    const { name, email, password, phone, role } = req.body;

    // --- Input validation ---
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

        // Hash password
        const salt      = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(password, salt);

        const effectiveRole = role || 'guest';

        const newUser = new User({
            name:     name.trim(),
            email:    email.toLowerCase().trim(),
            password: hashedPwd,
            phone:    phone ? phone.trim() : undefined,
            role:     effectiveRole,
            // Guests are verified immediately; owners need manual verification
            verified: effectiveRole === 'guest'
        });

        await newUser.save();

        const userData = {
            id:       newUser._id,
            name:     newUser.name,
            email:    newUser.email,
            role:     newUser.role,
            verified: newUser.verified
        };
        res.status(201).json({ msg: 'Registration successful', user: userData });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & return user data
router.post('/login', async (req, res) => {
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

        const userData = {
            id:       user._id,
            name:     user.name,
            email:    user.email,
            role:     user.role,
            verified: user.verified
        };
        res.json({ msg: 'Login successful', user: userData });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;