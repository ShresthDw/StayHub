import dotenv from 'dotenv';
dotenv.config(); 

import express        from 'express';
import cors           from 'cors';
import compression    from 'compression';
import cookieParser   from 'cookie-parser';
import rateLimit      from 'express-rate-limit';
import authRoutes     from './features/auth/routes.js';
import roomRoutes     from './features/rooms/routes.js';
import bookingRoutes  from './features/bookings/routes.js';
import addressRoutes  from './features/address/routes.js';
import { connectDB }  from './config/database.js';

if (!process.env.GEOAPIFY_API_KEY) {
    console.warn('WARNING: GEOAPIFY_API_KEY is not defined. Distance/search features will not work.');
}

const app = express();

// app.use(cors({ credentials: true }));
const allowedOrigins = [
    "http://localhost:5173", // Vite local
    "http://localhost:3000", // CRA local (if applicable)
    "https://stay-hub-psi.vercel.app", // Production frontend
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use(compression()); 
app.use(express.json());
app.use(cookieParser());



const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      30000,
    message:  { msg: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);


const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      500,
    message:  { msg: 'Too many auth attempts, please try again later.' }
});


app.get('/', (req, res) => res.send('StayHub API Running'));
app.use('/api/auth',  authLimiter, authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/address', addressRoutes);


// --- Config endpoint (exposes the Geoapify public key for frontend map/geocoding) ---
// Note: In production, proxy geocoding calls server-side instead of exposing the key.
app.get('/api/config', (req, res) => {
    res.json({ 
        geoApiKey: process.env.GEOAPIFY_API_KEY,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
