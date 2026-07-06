import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name:         { type: String,  required: true, trim: true },
    email:        { type: String,  required: true, unique: true, lowercase: true, trim: true, index: true },
    password:     { type: String,  required: false },          // Hash with bcrypt before saving (optional for OAuth users)
    phone:        { type: String,  trim: true },
    avatar:       { type: String,  trim: true },
    googleId:     { type: String,  sparse: true, index: true },
    authProvider: { type: String,  enum: ['local', 'google'], default: 'local' },
    role:         { type: String,  enum: ['guest', 'owner'], default: 'guest' },
   
    verified:     { type: Boolean, default: false },
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room'
        }
    ]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
