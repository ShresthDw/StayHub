// server/server.js
import dotenv from 'dotenv';
dotenv.config(); // Must be before any process.env usage

import express        from 'express';
import mongoose       from 'mongoose';
import cors           from 'cors';
import rateLimit      from 'express-rate-limit';
import authRoutes     from './routes/auth.js';
import roomRoutes     from './routes/rooms.js';

// --- Environment checks ---
if (!process.env.MONGO_URI) {
    console.error('FATAL: MONGO_URI is not defined.');
    process.exit(1);
}
if (!process.env.GEOAPIFY_API_KEY) {
    console.warn('WARNING: GEOAPIFY_API_KEY is not defined. Distance/search features will not work.');
}

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Rate limiting ---
// Global: 100 requests per 15-minute window per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      100,
    message:  { msg: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Auth routes get a tighter limit: 20 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      20,
    message:  { msg: 'Too many auth attempts, please try again later.' }
});

// --- Routes ---
app.get('/', (req, res) => res.send('StayHub API Running'));
app.use('/api/auth',  authLimiter, authRoutes);
app.use('/api/rooms', roomRoutes);

// --- Config endpoint (exposes the Geoapify public key for frontend map/geocoding) ---
// Note: In production, proxy geocoding calls server-side instead of exposing the key.
app.get('/api/config', (req, res) => {
    res.json({ geoApiKey: process.env.GEOAPIFY_API_KEY });
});

// --- MongoDB Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Atlas connected successfully.');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));