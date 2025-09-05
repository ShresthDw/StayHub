// server/routes/rooms.js
import express from 'express';

import mongoose from 'mongoose';

import axios from 'axios';
import Room from '../models/Room.js';
import { QuadTree, Rectangle, Point } from '../utils/Quadtree.js';

const router = express.Router();

// --- Utility Functions ---
const mockAuth = (req, res, next) => {
    if (!req.headers['x-user-id'] || !req.headers['x-user-role']) {
        return res.status(401).json({ msg: 'Authentication required' });
    }
    req.user = { id: req.headers['x-user-id'], role: req.headers['x-user-role'] };
    next();
};

// --- GEOAPIFY ROUTING FUNCTION ---
const getActualRoadDistance = async (userLat, userLng, roomLat, roomLng) => {
    if (typeof userLat !== 'number' || typeof userLng !== 'number' || typeof roomLat !== 'number' || typeof roomLng !== 'number') {
        return Infinity;
    }
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) return Infinity; 
    const url = `https://api.geoapify.com/v1/routing?waypoints=${userLat},${userLng}|${roomLat},${roomLng}&mode=drive&apiKey=${apiKey}`;
    try {
        const response = await axios.get(url);
        if (response.data && response.data.features && response.data.features.length > 0) {
            return response.data.features[0].properties.distance / 1000; // KM
        }
        return Infinity;
    } catch (error) {
        return Infinity;
    }
};

// --- MANUAL QUICKSORT IMPLEMENTATION ---
const swap = (arr, i, j) => { [arr[i], arr[j]] = [arr[j], arr[i]]; };
const partition = (arr, low, high) => {
    const pivot = arr[high].distance;
    let i = (low - 1);
    for (let j = low; j <= high - 1; j++) {
        if (arr[j].distance < pivot) { i++; swap(arr, i, j); }
    }
    swap(arr, i + 1, high);
    return (i + 1);
};
const quickSortRecursive = (arr, low, high) => {
    if (low < high) {
        const pi = partition(arr, low, high);
        quickSortRecursive(arr, low, pi - 1);
        quickSortRecursive(arr, pi + 1, high);
    }
};
const quickSort = (rooms) => {
    const arr = [...rooms];
    quickSortRecursive(arr, 0, arr.length - 1);
    return arr;
};

// --- ROBUST COORDINATE HELPER ---
const getRoomCoordinates = (room) => {
    try {
        if (room.geo && room.geo.coordinates && room.geo.coordinates.length === 2 && typeof room.geo.coordinates[0] === 'number' && typeof room.geo.coordinates[1] === 'number') {
            return { lng: room.geo.coordinates[0], lat: room.geo.coordinates[1] };
        }
        if (typeof room.latitude === 'number' && typeof room.longitude === 'number') {
            return { lng: room.longitude, lat: room.latitude };
        }
    } catch (e) { return null; }
    return null;
};

// @route   GET api/rooms
router.get('/', async (req, res) => {
    const { lat, lng, maxDistance, type, facilities, status } = req.query;
    let query = {};

    if (status) { query.status = status; }
    if (type) { query.type = type; }
    if (facilities) { query.facilities = { $all: facilities.split(',') }; }

    try {
        let allRooms = await Room.find(query).populate('owner', 'name email phone');

        if (lat && lng && maxDistance) {
            const userLng = parseFloat(lng);
            const userLat = parseFloat(lat);
            const maxDistKm = parseFloat(maxDistance);

            const boundary = new Rectangle(0, 0, 180, 90); 
            const qt = new QuadTree(boundary, 4); 

            for (let room of allRooms) {
                const coords = getRoomCoordinates(room);
                if (coords) {
                    const p = new Point(coords.lng, coords.lat, room); 
                    qt.insert(p);
                }
            }

            const degreesRange = maxDistKm / 111;
            const searchRange = new Rectangle(userLng, userLat, degreesRange, degreesRange);
            const nearbyCandidates = qt.query(searchRange);

            const distancePromises = nearbyCandidates.map(room => {
                const coords = getRoomCoordinates(room); 
                if (!coords) return Promise.resolve(Infinity);
                return getActualRoadDistance(userLat, userLng, coords.lat, coords.lng);
            });
            
            const distances = await Promise.all(distancePromises);

            const roomsWithDistances = nearbyCandidates.map((room, index) => ({
                ...room.toObject(), 
                distance: distances[index]
            })).filter(room => room.distance <= maxDistKm);

            const sortedRooms = quickSort(roomsWithDistances);
            res.json(sortedRooms);

        } else {
            res.json(allRooms);
        }

    } catch (err) {
        console.error("CRASH in GET /api/rooms:", err.stack);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/rooms/add
router.post('/add', mockAuth, async (req, res) => {
    const { title, description, price, location, latitude, longitude, capacity, images, type, facilities, status } = req.body;
    if (req.user.role !== 'owner') return res.status(403).json({ msg: 'Not authorized' });
    try {
        const newRoom = new Room({
            owner: req.user.id,
            title, description, price, location,
            geo: { type: 'Point', coordinates: [longitude, latitude] }, 
            latitude, longitude,
            capacity, images, type, facilities,
            status: status || 'inactive'
        });
        await newRoom.save();
        res.status(201).json({ msg: 'Room added', room: newRoom });
    } catch (err) { 
        console.error("CRASH in POST /api/rooms/add:", err.stack);
        res.status(500).send('Server Error'); 
    }
});

// @route   PUT api/rooms/edit/:id
router.put('/edit/:id', mockAuth, async (req, res) => {
    // --- THIS LINE WAS THE BUG ---
    // It had an extra '.' at the end
    const { title, description, price, location, latitude, longitude, capacity, images, type, facilities, status } = req.body;
    // ----------------------------
    
    const roomFields = { title, description, price, location, capacity, images, type, facilities, status };
    
    if (latitude !== undefined && longitude !== undefined) {
        roomFields.geo = { type: 'Point', coordinates: [longitude, latitude] };
        roomFields.latitude = latitude;
        roomFields.longitude = longitude;
    }
    try {
        let room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ msg: 'Room not found' });
        if (String(room.owner) !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
        
        const updatedRoom = await Room.findByIdAndUpdate(req.params.id, { $set: roomFields }, { new: true });
        res.json({ msg: 'Room updated', room: updatedRoom });
    } catch (err) { 
        console.error("CRASH in PUT /api/rooms/edit:", err.stack);
        res.status(500).send('Server Error'); 
    }
});

export default router;