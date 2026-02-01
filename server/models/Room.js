

// models/Room.js
import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: {
        type: Number,
        required: true,
        validate: { validator: v => v > 0, message: 'Price must be positive' }
    },

    // Property details
    type: {
        type: String,
        enum: ['1 Room', '2 Rooms', '1 Room with Kitchen', '2 Rooms with Kitchen', '1 BHK', '2 BHK', 'Other'],
        required: true
    },
    facilities: [String],
    images: {
        type: [String],
        required: true,
        validate: {
            validator: v => Array.isArray(v) && v.length > 0,
            message:  'At least one image URL is required'
        }
    },

    // Location — flat fields for easy querying + GeoJSON for 2dsphere
    location:  { type: String, required: true },            // Human-readable address
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
    geo: {                                                  // GeoJSON point (lng, lat order)
        type:        { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true }     // [longitude, latitude]
    },

    capacity: {
        type: Number,
        required: true,
        validate: { validator: v => v > 0 && Number.isInteger(v), message: 'Capacity must be a positive integer' }
    },
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' }
}, { timestamps: true });

// 2dsphere index enables native MongoDB geospatial queries on the geo field
RoomSchema.index({ geo: '2dsphere' });

const Room = mongoose.model('Room', RoomSchema);
export default Room;