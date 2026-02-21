import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from '../models/Room.js';

dotenv.config();

async function checkAndFixRoomCoordinates() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const allRooms = await Room.find({});

        let roomsWithoutCoords = 0;
        let roomsWithCoords = 0;
        let fixed = 0;

        for (const room of allRooms) {
            const hasCoords = room?.location?.coordinates?.length === 2 &&
                typeof room.location.coordinates[0] === 'number' &&
                typeof room.location.coordinates[1] === 'number';

            if (!hasCoords) {
                roomsWithoutCoords++;
                
                // Try to add default location if missing
                if (!room.location) {
                    // Default to a central location in India (Delhi)
                    room.location = {
                        type: 'Point',
                        coordinates: [77.2090, 28.6139]  // [lng, lat]
                    };
                    await room.save();
                    fixed++;
                }
            } else {
                roomsWithCoords++;
            }
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

checkAndFixRoomCoordinates();
