

import express from 'express';
import axios from 'axios';
import Room from '../models/Room.js';
import { QuadTree, Rectangle, Point } from '../utils/Quadtree.js';

const router = express.Router();

/* 
   MOCK AUTH (TEMP – FOR LEARNING)
*/
const mockAuth = (req, res, next) => {
    if (!req.headers['x-user-id'] || !req.headers['x-user-role']) {
        return res.status(401).json({ msg: 'Authentication required' });
    }
    req.user = {
        id: req.headers['x-user-id'],
        role: req.headers['x-user-role']
    };
    next();
};

/* 
   GEOAPIFY ROAD DISTANCE
 */
const getActualRoadDistance = async (userLat, userLng, roomLat, roomLng) => {
    if (
        typeof userLat !== 'number' ||
        typeof userLng !== 'number' ||
        typeof roomLat !== 'number' ||
        typeof roomLng !== 'number'
    ) return Infinity;

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) return Infinity;

    const url = `https://api.geoapify.com/v1/routing?waypoints=${userLat},${userLng}|${roomLat},${roomLng}&mode=drive&apiKey=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data?.features?.length > 0) {
            return response.data.features[0].properties.distance / 1000; // km
        }
        return Infinity;
    } catch {
        return Infinity;
    }
};

/* 
   MANUAL QUICKSORT (BY DISTANCE)
 */
const swap = (arr, i, j) => ([arr[i], arr[j]] = [arr[j], arr[i]]);

const partition = (arr, low, high) => {
    const pivot = arr[high].distance;
    let i = low - 1;

    for (let j = low; j < high; j++) {
        if (arr[j].distance < pivot) {
            i++;
            swap(arr, i, j);
        }
    }
    swap(arr, i + 1, high);
    return i + 1;
};

const quickSortRecursive = (arr, low, high) => {
    if (low < high) {
        const pi = partition(arr, low, high);
        quickSortRecursive(arr, low, pi - 1);
        quickSortRecursive(arr, pi + 1, high);
    }
};

const quickSort = rooms => {
    const arr = [...rooms];
    if (arr.length > 1) quickSortRecursive(arr, 0, arr.length - 1);
    return arr;
};

/* 
   COORDINATE HELPER
*/
const getRoomCoordinates = room => {
    if (
        room?.geo?.coordinates?.length === 2 &&
        typeof room.geo.coordinates[0] === 'number' &&
        typeof room.geo.coordinates[1] === 'number'
    ) {
        return { lng: room.geo.coordinates[0], lat: room.geo.coordinates[1] };
    }

    if (
        typeof room.latitude === 'number' &&
        typeof room.longitude === 'number'
    ) {
        return { lng: room.longitude, lat: room.latitude };
    }

    return null;
};

/* 
   GET /api/rooms
 */
router.get('/', async (req, res) => {
    const { lat, lng, maxDistance, type, facilities, status } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (facilities) query.facilities = { $all: facilities.split(',') };

    try {
        const allRooms = await Room.find(query)
            .populate('owner', 'name email phone')
            .lean();

        // If no location filter, return all
        if (!lat || !lng || !maxDistance) {
            return res.status(200).json(allRooms);
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const maxDistKm = parseFloat(maxDistance);

        // QuadTree setup
        const boundary = new Rectangle(0, 0, 180, 90);
        const qt = new QuadTree(boundary, 4);

        for (const room of allRooms) {
            const coords = getRoomCoordinates(room);
            if (coords) {
                qt.insert(new Point(coords.lng, coords.lat, room));
            }
        }

        const degreesRange = maxDistKm / 111;
        const searchRange = new Rectangle(userLng, userLat, degreesRange, degreesRange);
        const nearbyPoints = qt.query(searchRange);

        const distances = await Promise.all(
            nearbyPoints.map(p => {
                const coords = getRoomCoordinates(p.data);
                if (!coords) return Infinity;
                return getActualRoadDistance(
                    userLat,
                    userLng,
                    coords.lat,
                    coords.lng
                );
            })
        );

        const roomsWithDistance = nearbyPoints
            .map((p, i) => ({
                ...p.data,
                distance: distances[i]
            }))
            .filter(r => r.distance <= maxDistKm);

        return res.status(200).json(quickSort(roomsWithDistance));

    } catch (err) {
        console.error('ERROR in GET /api/rooms:', err);
        res.status(500).json({ message: 'Failed to fetch rooms' });
    }
});

/* 
   POST /api/rooms/add
*/
router.post('/add', mockAuth, async (req, res) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ msg: 'Not authorized' });
    }

    try {
        const {
            title,
            description,
            price,
            location,
            latitude,
            longitude,
            capacity,
            images,
            type,
            facilities,
            status
        } = req.body;

        const room = new Room({
            owner: req.user.id,
            title,
            description,
            price,
            location,
            geo: { type: 'Point', coordinates: [longitude, latitude] },
            latitude,
            longitude,
            capacity,
            images,
            type,
            facilities,
            status: status || 'inactive'
        });

        await room.save();
        res.status(201).json({ msg: 'Room added', room });

    } catch (err) {
        console.error('ERROR in POST /api/rooms/add:', err);
        res.status(500).json({ message: 'Failed to add room' });
    }
});

/* 
   PUT /api/rooms/edit/:id
*/
router.put('/edit/:id', mockAuth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ msg: 'Room not found' });
        if (String(room.owner) !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const {
            title,
            description,
            price,
            location,
            latitude,
            longitude,
            capacity,
            images,
            type,
            facilities,
            status
        } = req.body;

        const update = {
            title,
            description,
            price,
            location,
            capacity,
            images,
            type,
            facilities,
            status
        };

        if (latitude !== undefined && longitude !== undefined) {
            update.geo = { type: 'Point', coordinates: [longitude, latitude] };
            update.latitude = latitude;
            update.longitude = longitude;
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true }
        );

        res.status(200).json({ msg: 'Room updated', room: updatedRoom });

    } catch (err) {
        console.error('ERROR in PUT /api/rooms/edit:', err);
        res.status(500).json({ message: 'Failed to update room' });
    }
});

export default router;
