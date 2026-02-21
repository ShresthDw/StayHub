// features/rooms/roomController.js
import Room from '../../models/Room.js';
import Booking from '../../models/Booking.js';
import { getActualRoadDistance, getRoomCoordinates, filterRoomsByDistance } from './roomService.js';

// Helper function to check if a room is available for a date range
const isRoomAvailable = async (roomId, checkInDate, checkOutDate) => {
    try {
        // Parse dates (format: YYYY-MM-DD)
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        // Find confirmed bookings that overlap with the requested date range
        const conflictingBooking = await Booking.findOne({
            roomId,
            status: 'confirmed',
            $expr: {
                $not: {
                    $or: [
                        { $lt: [new Date('$checkOutDate'), checkIn] },  // Booking ends before check-in
                        { $gte: [new Date('$checkInDate'), checkOut] }   // Booking starts on or after check-out
                    ]
                }
            }
        });

        return !conflictingBooking;  // Room is available if no conflicting booking
    } catch (err) {
        console.error('Error checking room availability:', err);
        return true;  // Return true (available) if error occurs
    }
};

// GET /api/rooms

export const getRooms = async (req, res) => {
    const { page = 1, limit = 10, lat, lng, maxDistance, propertyType, amenities, isActive, hostId, checkInDate, checkOutDate, city } = req.query;

    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (propertyType) query.propertyType = propertyType;
    if (amenities) query.amenities = { $all: amenities.split(',') };
    if (hostId) query.hostId = hostId;
    if (city) query['address.city'] = { $regex: city, $options: 'i' };  // Case-insensitive city search

    try {
        const pageNum = Math.max(1, parseInt(page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Cap at 100
        const skip = (pageNum - 1) * pageSize;

        // OPTIMIZATION 1: Use field projection to select only needed fields for list view
        const projectionFields = 'title propertyType address location images pricePerNight rating reviewCount maxGuests hostId';
        
        // If no location filter, apply pagination at database level
        if (!lat || !lng || !maxDistance) {
            // Build and execute query with pagination at database level
            let dbQuery = Room.find(query)
                .select(projectionFields)
                .populate('hostId', 'name email phone avatar')
                .limit(pageSize)
                .skip(skip)
                .lean(); // OPTIMIZATION 2: Use .lean() for read operations (15-20% faster)
            
            let allRooms = await dbQuery;

            // Filter by date availability if both dates provided
            if (checkInDate && checkOutDate) {
                const availableRooms = [];
                for (const room of allRooms) {
                    const isAvailable = await isRoomAvailable(room._id, checkInDate, checkOutDate);
                    if (isAvailable) {
                        availableRooms.push(room);
                    }
                }
                allRooms = availableRooms;
            }

            // Get total count for pagination info
            const total = await Room.countDocuments(query);
            
            return res.status(200).json({
                rooms: allRooms,
                pagination: {
                    page: pageNum,
                    limit: pageSize,
                    total,
                    pages: Math.ceil(total / pageSize)
                }
            });
        }

        // Location filter: fetch all matching rooms (for distance calculation)
        let dbQuery = Room.find(query)
            .select(projectionFields)
            .populate('hostId', 'name email phone avatar')
            .lean(); // OPTIMIZATION 2: Use .lean() for read operations (15-20% faster)
        
        let allRooms = await dbQuery;
        // Filter by date availability if both dates provided
        if (checkInDate && checkOutDate) {
            const availableRooms = [];
            for (const room of allRooms) {
                const isAvailable = await isRoomAvailable(room._id, checkInDate, checkOutDate);
                if (isAvailable) {
                    availableRooms.push(room);
                }
            }
            allRooms = availableRooms;
        }

        if (allRooms.length === 0) {
            return res.status(200).json({
                rooms: [],
                pagination: {
                    page: pageNum,
                    limit: pageSize,
                    total: 0,
                    pages: 0
                }
            });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const maxDistKm = parseFloat(maxDistance);

        if (isNaN(userLat) || isNaN(userLng) || isNaN(maxDistKm) || maxDistKm <= 0) {
            console.error('Invalid location parameters');
            return res.status(400).json({ message: 'Invalid location or distance parameters' });
        }

        const roomsWithDistance = await filterRoomsByDistance(allRooms, userLat, userLng, maxDistKm);
        // Apply pagination to filtered results (client-side since we filtered by distance)
        const paginatedRooms = roomsWithDistance.slice(skip, skip + pageSize);
        const total = roomsWithDistance.length;
        
        return res.status(200).json({
            rooms: paginatedRooms,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total,
                pages: Math.ceil(total / pageSize)
            }
        });

    } catch (err) {
        console.error('ERROR in GET /api/rooms:', err.message, err.stack);
        res.status(500).json({ message: 'Failed to fetch rooms' });
    }
};

// GET /api/rooms/:id

export const addRoom = async (req, res) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ msg: 'Only owners can add rooms' });
    }
    if (!req.user.verified) {
        return res.status(403).json({ msg: 'Account is not verified' });
    }

    try {
        const { title, description, pricePerNight, address, latitude, longitude, location, maxGuests, bedrooms, beds, bathrooms, images, propertyType, roomType, amenities, availabilityType, isActive } = req.body;

        if (!title || !description || !pricePerNight || !propertyType) {
            return res.status(400).json({ msg: 'Missing required fields: title, description, pricePerNight, propertyType' });
        }

        // Get coordinates from either location field or latitude/longitude
        let locationData;
        if (location && location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
            // Use provided location (GeoJSON format)
            locationData = location;
        } else if (typeof latitude === 'number' && typeof longitude === 'number') {
            // Create location from latitude/longitude
            locationData = { type: 'Point', coordinates: [longitude, latitude] };
        } else {
            return res.status(400).json({ msg: 'Valid coordinates are required (either location or latitude/longitude)' });
        }

        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ msg: 'At least one image URL is required' });
        }

        const room = new Room({
            hostId: req.user.id,
            title,
            description,
            pricePerNight,
            address,
            maxGuests,
            bedrooms,
            beds,
            bathrooms,
            location: locationData,
            images,
            propertyType,
            roomType,
            amenities: Array.isArray(amenities) ? amenities : [],
            availabilityType,
            isActive: isActive !== false
        });

        await room.save();
        res.status(201).json({ msg: 'Room added', room });

    } catch (err) {
        // Surface Mongoose validation errors clearly
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ msg: messages.join('; ') });
        }
        console.error('ERROR in POST /api/rooms/add:', err);
        res.status(500).json({ message: 'Failed to add room' });
    }
};

// PUT /api/rooms/edit/:id

export const editRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }
        
        // Ownership check: compare stringified ObjectIds from DB — no header trust
        if (String(room.hostId) !== String(req.user.id)) {
            return res.status(403).json({ msg: 'Not authorized to edit this room' });
        }

        const { title, description, pricePerNight, address, latitude, longitude, maxGuests, bedrooms, beds, bathrooms, images, propertyType, roomType, amenities, availabilityType, isActive } = req.body;

        // Build update object — only include fields that were actually sent
        const update = {};
        if (title !== undefined) update.title = title;
        if (description !== undefined) update.description = description;
        if (pricePerNight !== undefined) update.pricePerNight = pricePerNight;
        if (address !== undefined) update.address = address;
        if (maxGuests !== undefined) update.maxGuests = maxGuests;
        if (bedrooms !== undefined) update.bedrooms = bedrooms;
        if (beds !== undefined) update.beds = beds;
        if (bathrooms !== undefined) update.bathrooms = bathrooms;
        if (images !== undefined) update.images = images;
        if (propertyType !== undefined) update.propertyType = propertyType;
        if (roomType !== undefined) update.roomType = roomType;
        if (amenities !== undefined) update.amenities = amenities;
        if (availabilityType !== undefined) update.availabilityType = availabilityType;
        if (isActive !== undefined) update.isActive = isActive;

        // Only update location if both coordinates are provided
        if (latitude !== undefined && longitude !== undefined) {
            update.location = { type: 'Point', coordinates: [longitude, latitude] };
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true, runValidators: true } // runValidators ensures schema validators fire on update
        );

        res.status(200).json({ msg: 'Room updated', room: updatedRoom });

    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ msg: messages.join('; ') });
        }
        console.error('ERROR in PUT /api/rooms/edit:', err);
        res.status(500).json({ message: 'Failed to update room' });
    }
};

// DELETE /api/rooms/delete/:id

export const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }
        if (String(room.hostId) !== String(req.user.id)) {
            return res.status(403).json({ msg: 'Not authorized to delete this room' });
        }

        await Room.findByIdAndDelete(req.params.id);
        res.status(200).json({ msg: 'Room deleted' });

    } catch (err) {
        console.error('ERROR in DELETE /api/rooms/delete:', err);
        res.status(500).json({ message: 'Failed to delete room' });
    }
};


// GET /api/rooms/:id

export const getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('hostId', 'name email phone')
            .lean(); 

        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }

        res.status(200).json(room);

    } catch (err) {
        console.error('ERROR in GET /api/rooms/:id:', err);
        res.status(500).json({ message: 'Failed to fetch room' });
    }
};

// GET /api/rooms/mine

export const getMyRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ hostId: req.user.id })
            .populate('hostId', 'name email phone')
            .lean();

        res.status(200).json(rooms);

    } catch (err) {
        console.error('ERROR in GET /api/rooms/mine:', err);
        res.status(500).json({ message: 'Failed to fetch your rooms' });
    }
};

// GET /api/rooms/cities/list

export const getCities = async (req, res) => {
    try {
        const cities = await Room.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $group: {
                    _id: '$address.city',
                    count: { $sum: 1 },
                    firstImage: { $first: '$images' }
                }
            },
            {
                $match: { _id: { $ne: null } }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 8
            }
        ]);

        const formattedCities = cities.map(city => ({
            name: city._id,
            count: city.count,
            imageUrl: city.firstImage && city.firstImage.length > 0 
                ? city.firstImage[0].url 
                : `https://placehold.co/400x300?text=${encodeURIComponent(city._id)}`
        }));

        res.status(200).json(formattedCities);

    } catch (err) {
        console.error('ERROR in GET /api/rooms/cities/list:', err);
        res.status(500).json({ message: 'Failed to fetch cities' });
    }
};
