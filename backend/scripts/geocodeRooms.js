import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import Room from '../models/Room.js';

dotenv.config();

async function geocodeAddress(address) {
    if (!address) return null;
    
    try {
        const apiKey = process.env.GEOAPIFY_API_KEY;
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${apiKey}`;
        
        const response = await axios.get(url);
        const results = response.data?.features;
        
        if (results && results.length > 0) {
            const coords = results[0].geometry.coordinates;
            return { lng: coords[0], lat: coords[1] };
        }
    } catch (err) {
        console.error(`Geocoding error for "${address}":`, err.message);
    }
    
    return null;
}

async function fixRoomCoordinates() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find all rooms where location is a string (not GeoJSON)
        const roomsToFix = await Room.find({
            $or: [
                { location: { $type: 'string' } },
                { location: null },
                { location: { $exists: false } }
            ]
        });


        let fixed = 0;
        let failed = 0;

        for (const room of roomsToFix) {
            const address = typeof room.location === 'string' 
                ? room.location 
                : room.address?.street || room.address?.city || 'Unknown';

            const coords = await geocodeAddress(address);
            
            if (coords) {
                await Room.updateOne(
                    { _id: room._id },
                    { 
                        location: {
                            type: 'Point',
                            coordinates: [coords.lng, coords.lat]
                        }
                    }
                );
                fixed++;
            } else {
                failed++;
            }

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

fixRoomCoordinates();
