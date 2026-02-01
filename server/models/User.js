// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name:     { type: String,  required: true, trim: true },
    email:    { type: String,  required: true, unique: true, lowercase: true, trim: true },
    password: { type: String,  required: true },          // Hash with bcrypt before saving
    phone:    { type: String,  trim: true },
    role:     { type: String,  enum: ['guest', 'owner'], default: 'guest' },
    // Safe default: assume unverified. auth.js explicitly sets true for guests.
    verified: { type: Boolean, default: false }
}, { timestamps: true });

UserSchema.index({ email: 1 });

const User = mongoose.model('User', UserSchema);
export default User;