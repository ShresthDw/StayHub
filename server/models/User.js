// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // *In a real app, hash this!*
    phone: { type: String },
    role: { type: String, enum: ['guest', 'owner'], default: 'guest' },
    verified: { type: Boolean, default: true } // For owner verification
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;
