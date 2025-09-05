// models/Room.js
import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    
    // Updated/New Fields
    type: { type: String, enum: ['1 Room', '2 Rooms', '1 Room with Kitchen', '2 Rooms with Kitchen', '1 BHK', '2 BHK', 'Other'], required: true },
    facilities: [String], // Array of facilities/amenities
    images: { type: [String], required: true }, // Array of image URLs (at least 1)

    location: { type: String, required: true }, // Formatted address string
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    
    capacity: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' }
}, { timestamps: true });

// Optional: Add Geospatial Index for optimized distance search
// Note: While this index is ideal for complex geospatial queries, the Haversine calculation in rooms.js works without it for simpler distance sorting.
RoomSchema.index({ latitude: 1, longitude: 1 }); 

const Room = mongoose.model('Room', RoomSchema);
export default Room;