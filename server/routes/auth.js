// routes/auth.js
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a user or an owner (simulated verification for owner)
router.post('/register', async (req, res) => {
    const { name, email, password, phone, role } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const newUser = new User({
            name,
            email,
            // *In a real app, the password must be hashed before saving*
            password, 
            phone,
            role,
            // Simulate owner verification logic
            verified: role === 'guest' ? true : false // Owner needs verification
        });

        await newUser.save();

        // Respond with created user data (excluding password)
        const userData = { id: newUser._id, name: newUser.name, role: newUser.role, verified: newUser.verified };
        res.status(201).json({ msg: 'Registration successful', user: userData });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get user data
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user || user.password !== password) { // *In a real app, compare hashed passwords*
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Respond with user data
        const userData = { id: user._id, name: user.name, role: user.role, verified: user.verified };
        res.json({ msg: 'Login successful', user: userData });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
