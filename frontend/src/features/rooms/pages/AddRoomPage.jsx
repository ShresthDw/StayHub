import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PROPERTY_TYPES, ROOM_TYPES, FACILITY_OPTIONS } from '../../../constants.jsx';
import { createRoom } from '../services/roomService.js';
import MapLocationSelector from '../../../components/MapLocationSelector.jsx';
import Toast from '../../../components/Toast.jsx';
import BackButton from '../../../components/BackButton.jsx';
import { reverseGeocodeAddress } from '../../../services/addressService.js';

// Clean SVG Icons for property categories, room types, capacity, and amenities
const ICONS = {
    apartment: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    ),
    house: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    villa: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
    ),
    resort: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    hotel: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    cottage: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10M9 21V12h6v9" />
        </svg>
    ),
    hostel: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M4 16V6a2 2 0 012-2h12a2 2 0 012 2v10M4 16h16M4 11h16" />
        </svg>
    ),
    entire_place: (
        <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
    ),
    private_room: (
        <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
    ),
    shared_room: (
        <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    users: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    bedrooms: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 12h18M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 18h18M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3" />
        </svg>
    ),
    beds: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 18v-2m16 2v-2M3 12h18v4H3v-4zm0 0V9a2 2 0 012-2h6a2 2 0 012 2v3" />
        </svg>
    ),
    bathrooms: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 14h16a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 012-2zm2-4a2 2 0 100-4 2 2 0 000 4zm0 0v4m10-7l-3 3" />
        </svg>
    ),
    WiFi: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
    ),
    AC: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 3v18m0-18l3 3m-3-3l-3 3m0 12l3 3m0 0l3-3M3 12h18m-18 0l3 3m-3-3l3-3m12 0l3 3m0 0l-3 3" />
        </svg>
    ),
    Pool: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 15a4 4 0 004 4 4 4 0 004-4 4 4 0 004 4 4 4 0 004-4M3 9a4 4 0 004 4 4 4 0 004-4 4 4 0 004-4" />
        </svg>
    ),
    Parking: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M5 8h6a4 4 0 014 4 4 4 0 01-4 4H5V4h6a4 4 0 010 8H5" />
        </svg>
    ),
    Gym: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 8v8m16-8v8m-4-7v6m-8-6v6m-2-3h12" />
        </svg>
    ),
    Laundry: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm7 8a4 4 0 100 8 4 4 0 000-8zM8 6h.01M11 6h.01" />
        </svg>
    ),
    Balcony: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 16h16M4 20h16M4 12h16M6 12v8m4-8v8m4-8v8m4-8v8M3 8l9-4 9 4" />
        </svg>
    ),
    Kitchen: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
    ),
    TV: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    Workspace: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    autoFill: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    publish: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
    )
};

const ROOM_TYPE_CONFIG = {
    entire_place: { label: 'Entire Place', desc: 'Guests have the entire space', icon: ICONS.entire_place },
    private_room: { label: 'Private Room', desc: 'Guests get a private room', icon: ICONS.private_room },
    shared_room: { label: 'Shared Room', desc: 'Shared bedroom or common area', icon: ICONS.shared_room }
};

const AddRoomPage = () => {
    const navigate = useNavigate();
    const { geoApiKey } = useSelector((state) => state.app);
    const [message, setMessage] = useState('');
    const [msgType, setMsgType] = useState('error');
    const [loading, setLoading] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        propertyType: PROPERTY_TYPES[0] || 'apartment',
        roomType: ROOM_TYPES[0] || 'entire_place',
        location: {
            address: '',
            lat: 30.3037,
            lng: 78.0329
        },
        address: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
        },
        pricePerNight: '',
        cleaningFee: '',
        serviceFee: '',
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        images: [],
        amenities: ['WiFi', 'AC'],
        availabilityType: 'instant',
        checkInTime: '14:00',
        checkOutTime: '11:00'
    });

    const showMsg = (msg, type = 'error') => {
        setMessage(msg);
        setMsgType(type);
        setTimeout(() => setMessage(''), 4000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [name]: value }
        }));
    };

    const handleLocationSelect = (location) => {
        setFormData(prev => ({
            ...prev,
            location: { ...prev.location, ...location }
        }));
    };

    const handleAutoFillAddress = async () => {
        if (!formData.location.lat || !formData.location.lng) {
            showMsg('Please click on the map to set a location pin first.');
            return;
        }

        setLoading(true);
        try {
            const parsed = await reverseGeocodeAddress(formData.location.lat, formData.location.lng, geoApiKey);
            if (parsed && (parsed.city || parsed.street || parsed.state || parsed.country)) {
                setFormData(prev => ({
                    ...prev,
                    address: {
                        street: parsed.street || prev.address.street || '',
                        city: parsed.city || prev.address.city || '',
                        state: parsed.state || prev.address.state || '',
                        country: parsed.country || prev.address.country || '',
                        zipCode: parsed.zipCode || prev.address.zipCode || ''
                    },
                    location: {
                        ...prev.location,
                        address: [parsed.street, parsed.city, parsed.state, parsed.country].filter(Boolean).join(', ')
                    }
                }));
                showMsg('Address auto-filled successfully!', 'success');
            } else {
                showMsg('Could not detect address for these coordinates. Please enter manually.');
            }
        } catch (err) {
            console.error('Auto-fill error:', err);
            showMsg('Error auto-filling address. Please enter manually.');
        } finally {
            setLoading(false);
        }
    };

    const handleAmenityToggle = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleStepperChange = (field, delta, min = 0) => {
        setFormData(prev => {
            const currentVal = Number(prev[field]) || 0;
            return { ...prev, [field]: Math.max(min, currentVal + delta) };
        });
    };

    const handleAddImage = () => {
        const url = newImageUrl.trim();
        if (!url) return;

        const urls = url.split(',').map(s => s.trim()).filter(Boolean);
        const validUrls = urls.filter(u => u.startsWith('http://') || u.startsWith('https://'));

        if (validUrls.length === 0) {
            showMsg('Please enter a valid image URL starting with http:// or https://');
            return;
        }

        setFormData(prev => ({
            ...prev,
            images: [...new Set([...prev.images, ...validUrls])]
        }));
        setNewImageUrl('');
        showMsg(`Added ${validUrls.length} image(s)`, 'success');
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
        if (primaryImageIndex >= formData.images.length - 1) {
            setPrimaryImageIndex(Math.max(0, formData.images.length - 2));
        }
    };

    const handleSubmit = async (e, shouldBeActive) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.title.trim()) {
            showMsg('Please enter a property title.');
            setLoading(false);
            return;
        }

        if (!formData.description.trim()) {
            showMsg('Please enter a property description.');
            setLoading(false);
            return;
        }

        if (!formData.location.lat || !formData.location.lng) {
            showMsg('Please select a location on the map.');
            setLoading(false);
            return;
        }

        if (!formData.address?.city?.trim()) {
            showMsg('Please enter the city name.');
            setLoading(false);
            return;
        }

        const parsedPrice = Number.parseFloat(formData.pricePerNight);
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            showMsg('Please enter a valid nightly price greater than ₹0.');
            setLoading(false);
            return;
        }

        if (formData.images.length === 0) {
            showMsg('Please add at least one property image URL.');
            setLoading(false);
            return;
        }

        const parseOptional = (val) => {
            if (!val && val !== 0) return undefined;
            const parsed = Number.parseFloat(val);
            return Number.isFinite(parsed) ? parsed : undefined;
        };

        const formattedImages = formData.images.map((url, idx) => ({
            url,
            isPrimary: idx === primaryImageIndex
        }));

        const payload = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            propertyType: formData.propertyType,
            roomType: formData.roomType,
            pricePerNight: parsedPrice,
            cleaningFee: parseOptional(formData.cleaningFee),
            serviceFee: parseOptional(formData.serviceFee),
            address: {
                street: formData.address.street?.trim() || '',
                city: formData.address.city?.trim() || '',
                state: formData.address.state?.trim() || '',
                country: formData.address.country?.trim() || '',
                zipCode: formData.address.zipCode?.trim() || ''
            },
            location: {
                type: 'Point',
                coordinates: [formData.location.lng, formData.location.lat]
            },
            maxGuests: parseOptional(formData.maxGuests) || 1,
            bedrooms: parseOptional(formData.bedrooms) || 1,
            beds: parseOptional(formData.beds) || 1,
            bathrooms: parseOptional(formData.bathrooms) || 1,
            images: formattedImages,
            amenities: formData.amenities,
            availabilityType: formData.availabilityType,
            checkInTime: formData.checkInTime || '14:00',
            checkOutTime: formData.checkOutTime || '11:00',
            isActive: shouldBeActive
        };

        try {
            await createRoom(payload);
            showMsg(shouldBeActive ? 'Property listed successfully!' : 'Saved as draft!', 'success');
            setTimeout(() => navigate('/my-properties'), 1200);
        } catch (err) {
            showMsg(err.message || 'Failed to list property.');
            setLoading(false);
        }
    };

    const priceNum = Number(formData.pricePerNight) || 0;
    const hostEstimatedPayout = Math.round(priceNum * 0.97);

    return (
        <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950 pt-5 pb-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header Context Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-5 border-b border-gray-200 dark:border-gray-800 gap-4">
                    <div>
                        <BackButton to="/my-properties" label="Back to My Properties" className="mb-2" />
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            List a New Property
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Enter your space details to start receiving bookings on StayHub.
                        </p>
                    </div>

                    {/* Quick Stat Pill */}
                    <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                            Host Studio
                        </span>
                    </div>
                </div>

                {message && <Toast message={message} type={msgType} />}

                {/* 2-Column Balanced Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT COLUMN: Overview, Map Location & Amenities (7 cols on lg) */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* 1. Property Type & Category */}
                        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-700/80 shadow-sm space-y-5">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center text-xs font-bold">1</span>
                                Property Type & Category
                            </h2>

                            {/* Property Type Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                                {PROPERTY_TYPES.map((type) => {
                                    const icon = ICONS[type] || ICONS.house;
                                    const isSelected = formData.propertyType === type;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, propertyType: type }))}
                                            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${
                                                isSelected
                                                    ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-900/30 text-teal-900 dark:text-teal-100 ring-2 ring-teal-500/20 font-bold'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50/40 dark:bg-gray-800/50'
                                            }`}
                                        >
                                            <span className="text-teal-600 dark:text-teal-400 mb-1">{icon}</span>
                                            <span className="text-[10px] capitalize">{type}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Room Privacy */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Space Privacy
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {ROOM_TYPES.map((type) => {
                                        const config = ROOM_TYPE_CONFIG[type] || { label: type, desc: '', icon: ICONS.house };
                                        const isSelected = formData.roomType === type;
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, roomType: type }))}
                                                className={`p-3 rounded-xl border text-left transition-all ${
                                                    isSelected
                                                        ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-900/30 text-teal-900 dark:text-teal-100 ring-1 ring-teal-500'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                                                    <span>{config.icon}</span>
                                                    <span>{config.label}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{config.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Title & Description */}
                            <div className="space-y-4 pt-1">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Modern Sunset Beach Villa with Infinity Pool"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe what guests will love about your space, key amenities, and nearby attractions..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-y"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Location & Map Pin */}
                        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-700/80 shadow-sm space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center text-xs font-bold">2</span>
                                    Location & Map Pin
                                </h2>
                                <button
                                    type="button"
                                    onClick={handleAutoFillAddress}
                                    disabled={loading || !formData.location.lat}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 bg-teal-50 dark:bg-teal-900/40 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-700 transition-all disabled:opacity-50"
                                >
                                    {ICONS.autoFill}
                                    <span>{loading ? 'Auto-filling...' : 'Auto-fill from Pin'}</span>
                                </button>
                            </div>

                            {/* Map */}
                            <div className="h-56 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner">
                                <MapLocationSelector
                                    location={formData.location}
                                    onLocationSelect={handleLocationSelect}
                                    geoApiKey={geoApiKey}
                                />
                            </div>

                            {/* Address Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Street Address / Landmark
                                    </label>
                                    <input
                                        type="text"
                                        name="street"
                                        value={formData.address.street}
                                        onChange={handleAddressChange}
                                        placeholder="e.g. 104 Sunset Blvd, Near Lighthouse"
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        City <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.address.city}
                                        onChange={handleAddressChange}
                                        placeholder="e.g. Goa"
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        State / Province
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.address.state}
                                        onChange={handleAddressChange}
                                        placeholder="e.g. Goa"
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.address.country}
                                        onChange={handleAddressChange}
                                        placeholder="e.g. India"
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.address.zipCode}
                                        onChange={handleAddressChange}
                                        placeholder="e.g. 403509"
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Amenities & Features */}
                        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-700/80 shadow-sm space-y-4">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center text-xs font-bold">3</span>
                                Amenities & Features
                            </h2>

                            <div className="flex flex-wrap gap-2">
                                {FACILITY_OPTIONS.map((facility) => {
                                    const isSelected = formData.amenities.includes(facility);
                                    const icon = ICONS[facility] || ICONS.WiFi;
                                    return (
                                        <button
                                            key={facility}
                                            type="button"
                                            onClick={() => handleAmenityToggle(facility)}
                                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                                                isSelected
                                                    ? 'bg-teal-600 text-white shadow-sm'
                                                    : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            <span className={isSelected ? 'text-white' : 'text-teal-600 dark:text-teal-400'}>{icon}</span>
                                            <span>{facility}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </div>


                    {/* RIGHT COLUMN: Pricing & Capacity + Photos + Publish Actions (5 cols on lg) */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* 4. Pricing & Capacity */}
                        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-700/80 shadow-sm space-y-5">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center text-xs font-bold">4</span>
                                Pricing & Capacity
                            </h2>

                            {/* Price Field - Clean & Neutral */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Price Per Night <span className="text-red-500">*</span>
                                </label>
                                <div className="relative rounded-xl">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                        <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold">₹</span>
                                    </div>
                                    <input
                                        type="number"
                                        name="pricePerNight"
                                        min="1"
                                        value={formData.pricePerNight}
                                        onChange={handleInputChange}
                                        className="w-full pl-8 pr-16 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">/ night</span>
                                    </div>
                                </div>
                                {priceNum > 0 && (
                                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        Host Net Payout: <span className="font-semibold text-gray-700 dark:text-gray-300">₹{hostEstimatedPayout.toLocaleString()} / night</span>
                                    </p>
                                )}
                            </div>

                            {/* Steppers Grid */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                {[
                                    { label: 'Guests', field: 'maxGuests', icon: ICONS.users, min: 1 },
                                    { label: 'Bedrooms', field: 'bedrooms', icon: ICONS.bedrooms, min: 0 },
                                    { label: 'Beds', field: 'beds', icon: ICONS.beds, min: 1 },
                                    { label: 'Bathrooms', field: 'bathrooms', icon: ICONS.bathrooms, min: 1 }
                                ].map(item => (
                                    <div key={item.field} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/40 text-center">
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1.5 mb-2">
                                            <span className="text-gray-500 dark:text-gray-400">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleStepperChange(item.field, -1, item.min)}
                                                className="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-xs"
                                            >
                                                -
                                            </button>
                                            <span className="w-6 text-center font-bold text-gray-900 dark:text-white text-sm">
                                                {formData[item.field]}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleStepperChange(item.field, 1, item.min)}
                                                className="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-xs"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 5. Property Photos */}
                        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-700/80 shadow-sm space-y-4">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center text-xs font-bold">5</span>
                                Property Photos
                            </h2>

                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddImage();
                                        }
                                    }}
                                    placeholder="Paste photo URL (https://...)"
                                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddImage}
                                    className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm whitespace-nowrap"
                                >
                                    + Add Photo
                                </button>
                            </div>

                            {/* Photo Thumbnails */}
                            {formData.images.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    {formData.images.map((url, idx) => {
                                        const isCover = idx === primaryImageIndex;
                                        return (
                                            <div
                                                key={idx}
                                                className={`relative rounded-xl overflow-hidden aspect-video border-2 group transition-all ${
                                                    isCover ? 'border-teal-500 shadow-sm' : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                            >
                                                <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                                {isCover && (
                                                    <span className="absolute top-1.5 left-1.5 bg-teal-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                                        Cover
                                                    </span>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                                    {!isCover && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPrimaryImageIndex(idx)}
                                                            className="px-2 py-0.5 bg-white text-gray-900 rounded text-[10px] font-bold"
                                                        >
                                                            Set Cover
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center bg-gray-50/40 dark:bg-gray-900/30">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">No photos added yet. Paste image URLs above.</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm space-y-2.5">
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, true)}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {ICONS.publish}
                                <span>{loading ? 'Publishing...' : 'Publish Listing'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, false)}
                                disabled={loading}
                                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all text-xs disabled:opacity-50"
                            >
                                Save as Draft
                            </button>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default AddRoomPage;
