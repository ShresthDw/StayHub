// server/server.js
import dotenv from 'dotenv';
dotenv.config(); // AT THE VERY TOP

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';

// --- CHECK API KEYS ---
if (!process.env.MONGO_URI) {
    console.error("FATAL ERROR: MONGO_URI is not defined.");
    process.exit(1);
}
if (!process.env.GEOAPIFY_API_KEY) {
    console.warn("WARNING: GEOAPIFY_API_KEY is not defined. Distance/Search will fail.");
}
// ---------------------

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

// --- API Routes ---
app.get('/', (req, res) => res.send('StayHub API Running'));
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// --- NEW SECURE KEY ENDPOINT ---
// This endpoint sends the public-facing API key to the frontend.
app.get('/api/config', (req, res) => {
    res.json({
        geoApiKey: process.env.GEOAPIFY_API_KEY 
    });
});

// --- MongoDB Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Atlas connected successfully! 🚀');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1); 
    }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));