import { useEffect, useState, useMemo } from 'react';
import { FACILITY_OPTIONS, PROPERTY_TYPES, ROOM_TYPES, hasCoordinates } from '../constants.jsx';
import { createRoom, updateRoom } from '../features/rooms/services/roomService.js';
import MapLocationSelector from './MapLocationSelector.jsx';
import Toast from './Toast.jsx';
import { reverseGeocodeAddress } from '../services/addressService.js';

// SVG Icons for Property Types, Room Types, Capacity, and Amenities
const MODAL_ICONS = {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 15a4 4 0 004 4 4 4 0 004-4 4 4 0 004-4 4 4 0 004-4M3 9a4 4 0 004 4 4 4 0 004-4 4 4 0 004-4" />
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
    )
};

const ROOM_TYPE_CONFIG = {
    entire_place: { label: 'Entire Place', desc: 'Guests have the entire space to themselves', icon: MODAL_ICONS.entire_place },
    private_room: { label: 'Private Room', desc: 'Guests have their own private room in a home', icon: MODAL_ICONS.private_room },
    shared_room: { label: 'Shared Room', desc: 'Guests share a bedroom or common sleeping area', icon: MODAL_ICONS.shared_room }
};

const AddEditRoomModal = ({ isOpen, onClose, initialRoomData, onRoomModified, geoApiKey }) => {
    const isEditing = !!initialRoomData;
    const AVAILABILITY_TYPES = [
        { value: 'instant', label: 'Instant Booking', desc: 'Guests can book automatically' },
        { value: 'approval_required', label: 'Host Approval', desc: 'Review booking requests before confirming' }
    ];

    const toNumberOrEmpty = (value) => {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        const n = Number(value);
        return Number.isFinite(n) ? String(n) : '';
    };

    const parseImagesArray = (room) => {
        if (!Array.isArray(room?.images)) return [];
        return room.images
            .map((img) => (typeof img === 'string' ? img : img?.url))
            .filter(Boolean);
    };

    const getInitialState = () => {
        if (isEditing) {
            const lat = initialRoomData.location?.coordinates?.[1]
                ?? initialRoomData.geo?.coordinates?.[1]
                ?? initialRoomData.latitude
                ?? 30.3037;
            const lng = initialRoomData.location?.coordinates?.[0]
                ?? initialRoomData.geo?.coordinates?.[0]
                ?? initialRoomData.longitude
                ?? 78.0329;
            const city = initialRoomData.address?.city
                || (typeof initialRoomData.location === 'string' ? initialRoomData.location : '')
                || '';

            const initialImgList = parseImagesArray(initialRoomData);

            return {
                id: initialRoomData._id,
                title: initialRoomData.title || '',
                description: initialRoomData.description || '',
                propertyType: initialRoomData.propertyType || initialRoomData.type || PROPERTY_TYPES[0] || 'apartment',
                roomType: initialRoomData.roomType || ROOM_TYPES[0] || 'entire_place',
                location: {
                    address: city,
                    lat,
                    lng
                },
                address: {
                    street: initialRoomData.address?.street || '',
                    city: initialRoomData.address?.city || city || '',
                    state: initialRoomData.address?.state || '',
                    country: initialRoomData.address?.country || '',
                    zipCode: initialRoomData.address?.zipCode || ''
                },
                pricePerNight: toNumberOrEmpty(initialRoomData.pricePerNight ?? initialRoomData.price),
                cleaningFee: toNumberOrEmpty(initialRoomData.cleaningFee),
                serviceFee: toNumberOrEmpty(initialRoomData.serviceFee),
                maxGuests: toNumberOrEmpty(initialRoomData.maxGuests ?? initialRoomData.capacity) || '2',
                bedrooms: toNumberOrEmpty(initialRoomData.bedrooms) || '1',
                beds: toNumberOrEmpty(initialRoomData.beds) || '1',
                bathrooms: toNumberOrEmpty(initialRoomData.bathrooms) || '1',
                images: initialImgList,
                amenities: Array.isArray(initialRoomData.amenities)
                    ? initialRoomData.amenities
                    : (Array.isArray(initialRoomData.facilities) ? initialRoomData.facilities : []),
                availabilityType: initialRoomData.availabilityType || 'instant',
                checkInTime: initialRoomData.checkInTime || '',
                checkOutTime: initialRoomData.checkOutTime || '',
                isActive: typeof initialRoomData.isActive === 'boolean'
                    ? initialRoomData.isActive
                    : (initialRoomData.status === 'active' || initialRoomData.status === undefined)
            };
        }

        return {
            title: '',
            description: '',
            propertyType: PROPERTY_TYPES[0] || 'apartment',
            roomType: ROOM_TYPES[0] || 'entire_place',
            location: { address: '', lat: 30.3037, lng: 78.0329 },
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
            maxGuests: '2',
            bedrooms: '1',
            beds: '1',
            bathrooms: '1',
            images: [],
            amenities: [],
            availabilityType: 'instant',
            checkInTime: '',
            checkOutTime: '',
            isActive: true
        };
    };

    const [formData, setFormData] = useState(getInitialState);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [autoFilling, setAutoFilling] = useState(false);
    const [message, setMessage] = useState('');
    const [msgType, setMsgType] = useState('error');

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialState());
            setNewImageUrl('');
            setMessage('');
        }
    }, [isOpen, initialRoomData]);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !loading) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const showMsg = (text, type = 'error') => {
        setMessage(text);
        setMsgType(type);
    };

    const handleInputChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    const handleLocationSelect = (loc) => setFormData((prev) => ({ ...prev, location: { ...prev.location, ...loc } }));

    const handleAddressComponentChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [name]: value
            }
        }));
    };

    const handleAutoFillAddress = async () => {
        if (!formData.location.lat || !formData.location.lng) {
            showMsg('Please select a location on the map first.');
            return;
        }

        setAutoFilling(true);
        try {
            const parsedAddress = await reverseGeocodeAddress(formData.location.lat, formData.location.lng);
            if (parsedAddress) {
                setFormData(prev => ({
                    ...prev,
                    address: {
                        street: parsedAddress.street || '',
                        city: parsedAddress.city || '',
                        state: parsedAddress.state || '',
                        country: parsedAddress.country || '',
                        zipCode: parsedAddress.zipCode || ''
                    },
                    location: {
                        ...prev.location,
                        address: `${parsedAddress.street || ''}, ${parsedAddress.city || ''}, ${parsedAddress.state || ''}`.replace(/^, |, $/g, '')
                    }
                }));
                showMsg('Address auto-filled from coordinates!', 'success');
            } else {
                showMsg('Could not auto-fill address. Please enter details manually.');
            }
        } catch (err) {
            console.error('Error auto-filling address:', err);
            showMsg('Error auto-filling address.');
        } finally {
            setAutoFilling(false);
        }
    };

    const handleAddImage = (e) => {
        e?.preventDefault();
        const trimmed = newImageUrl.trim();
        if (!trimmed) return;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            showMsg('Please enter a valid image URL starting with http:// or https://');
            return;
        }

        setFormData(prev => ({
            ...prev,
            images: [...prev.images, trimmed]
        }));
        setNewImageUrl('');
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const handleFacilityToggle = (facility) => {
        setFormData((prev) => {
            const updated = prev.amenities.includes(facility)
                ? prev.amenities.filter((f) => f !== facility)
                : [...prev.amenities, facility];
            return { ...prev, amenities: updated };
        });
    };

    const handleSubmit = async (e, publishState) => {
        if (e) e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!formData.title.trim()) {
            showMsg('Please provide a property title.');
            setLoading(false);
            return;
        }

        if (!formData.description.trim()) {
            showMsg('Please provide a description.');
            setLoading(false);
            return;
        }

        if (!hasCoordinates(formData.location)) {
            showMsg('Please select a location on the map.');
            setLoading(false);
            return;
        }

        if (!formData.address?.city?.trim()) {
            showMsg('Please provide a city for the property address.');
            setLoading(false);
            return;
        }

        const parsedPrice = Number.parseFloat(formData.pricePerNight);
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            showMsg('Please provide a valid price per night.');
            setLoading(false);
            return;
        }

        const imageList = formData.images.filter(Boolean);
        if (imageList.length === 0) {
            showMsg('Please provide at least one photo URL for your property.');
            setLoading(false);
            return;
        }

        const parseOptionalNumber = (value) => {
            if (value === '' || value === null || value === undefined) {
                return undefined;
            }
            const parsed = Number.parseFloat(value);
            return Number.isFinite(parsed) ? parsed : undefined;
        };

        const payload = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            propertyType: formData.propertyType,
            roomType: formData.roomType,
            pricePerNight: parsedPrice,
            cleaningFee: parseOptionalNumber(formData.cleaningFee),
            serviceFee: parseOptionalNumber(formData.serviceFee),
            address: {
                street: formData.address.street?.trim() || '',
                city: formData.address.city?.trim() || '',
                state: formData.address.state?.trim() || '',
                country: formData.address.country?.trim() || '',
                zipCode: formData.address.zipCode?.trim() || ''
            },
            location: {
                type: 'Point',
                coordinates: [Number(formData.location.lng), Number(formData.location.lat)]
            },
            maxGuests: parseOptionalNumber(formData.maxGuests) || 2,
            bedrooms: parseOptionalNumber(formData.bedrooms) || 1,
            beds: parseOptionalNumber(formData.beds) || 1,
            bathrooms: parseOptionalNumber(formData.bathrooms) || 1,
            images: imageList.map((url, index) => ({
                url,
                isPrimary: index === 0
            })),
            amenities: formData.amenities,
            availabilityType: formData.availabilityType,
            checkInTime: formData.checkInTime || undefined,
            checkOutTime: formData.checkOutTime || undefined,
            isActive: publishState === 'active'
        };

        try {
            if (isEditing) {
                await updateRoom(formData.id, payload);
            } else {
                await createRoom(payload);
            }

            if (onRoomModified) onRoomModified();
            showMsg(`Property successfully ${isEditing ? 'updated' : 'added'}.`, 'success');
            setTimeout(() => {
                setLoading(false);
                onClose();
            }, 1200);
        } catch (err) {
            console.error('Submit Error:', err);
            showMsg(err.response?.data?.msg || err.message || 'Network error occurred while saving.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
                
                {/* Header Section */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {isEditing ? 'Edit Property Details' : 'List a New Property'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isEditing ? 'Make changes to your property listing, pricing, and availability' : 'Fill out details below to list your stay on StayHub'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        title="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Notification Toast */}
                {message && (
                    <div className="px-6 pt-4 shrink-0">
                        <Toast message={message} type={msgType} />
                    </div>
                )}

                {/* Form Content Area */}
                <form className="flex-1 overflow-y-auto px-6 py-6 space-y-8 text-gray-800 dark:text-gray-200">

                    {/* Section 1: Basic Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Step 1</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">General Information</span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                                Property Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g. Modern Coastal Villa with Sea View"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="description"
                                rows="3"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe what makes your property unique, nearby attractions, and key features..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition resize-y"
                            />
                        </div>

                        {/* Property Type Grid */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                                Property Category <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                                {PROPERTY_TYPES.map((type) => {
                                    const isSelected = formData.propertyType === type;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, propertyType: type }))}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center ${
                                                isSelected
                                                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 font-semibold shadow-sm'
                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-teal-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }`}
                                        >
                                            <span className={isSelected ? 'text-teal-600 dark:text-teal-400 mb-1.5' : 'text-gray-400 mb-1.5'}>
                                                {MODAL_ICONS[type] || MODAL_ICONS.apartment}
                                            </span>
                                            <span className="text-xs capitalize">{type}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Room Type Options */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                                Room Type <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {ROOM_TYPES.map((type) => {
                                    const config = ROOM_TYPE_CONFIG[type] || { label: type, desc: '', icon: null };
                                    const isSelected = formData.roomType === type;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, roomType: type }))}
                                            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                                                isSelected
                                                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-gray-900 dark:text-gray-100 ring-1 ring-teal-500/50'
                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }`}
                                        >
                                            <span className="mt-0.5 shrink-0">{config.icon}</span>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{config.label}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{config.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Location & Coordinates */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Step 2</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Location on Map & Address</span>
                            </div>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">Click on map to pin coordinates</span>
                        </div>

                        {/* Interactive Map Box */}
                        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative">
                            <div style={{ height: '260px', width: '100%' }}>
                                <MapLocationSelector location={formData.location} onLocationSelect={handleLocationSelect} geoApiKey={geoApiKey} />
                            </div>
                        </div>

                        {/* Auto-fill Action Bar */}
                        <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-teal-800 dark:text-teal-200 font-medium">
                                <svg className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>
                                    {formData.location?.lat && formData.location?.lng
                                        ? `Lat: ${Number(formData.location.lat).toFixed(4)}, Lng: ${Number(formData.location.lng).toFixed(4)}`
                                        : 'Select a point on the map to set coordinates'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleAutoFillAddress}
                                disabled={!formData.location.lat || !formData.location.lng || autoFilling}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                                <svg className={`w-3.5 h-3.5 ${autoFilling ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>{autoFilling ? 'Detecting Address...' : 'Auto-fill from Map'}</span>
                            </button>
                        </div>

                        {/* Address Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Street Address
                                </label>
                                <input
                                    type="text"
                                    name="street"
                                    value={formData.address.street}
                                    onChange={handleAddressComponentChange}
                                    placeholder="e.g. 14 Marine Drive, Block B"
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.address.city}
                                    onChange={handleAddressComponentChange}
                                    placeholder="e.g. Dehradun"
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    State / Province
                                </label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.address.state}
                                    onChange={handleAddressComponentChange}
                                    placeholder="e.g. Uttarakhand"
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.address.country}
                                    onChange={handleAddressComponentChange}
                                    placeholder="e.g. India"
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Zip / Postal Code
                                </label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={formData.address.zipCode}
                                    onChange={handleAddressComponentChange}
                                    placeholder="e.g. 248001"
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Pricing & Capacity */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Step 3</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pricing & Capacity</span>
                        </div>

                        {/* Pricing Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Price / Night (₹) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-gray-400 pointer-events-none">₹</span>
                                    <input
                                        type="number"
                                        name="pricePerNight"
                                        min="1"
                                        value={formData.pricePerNight}
                                        onChange={handleInputChange}
                                        className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Cleaning Fee (Optional)
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-gray-400 pointer-events-none">₹</span>
                                    <input
                                        type="number"
                                        name="cleaningFee"
                                        min="0"
                                        value={formData.cleaningFee}
                                        onChange={handleInputChange}
                                        className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Service Fee (Optional)
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-gray-400 pointer-events-none">₹</span>
                                    <input
                                        type="number"
                                        name="serviceFee"
                                        min="0"
                                        value={formData.serviceFee}
                                        onChange={handleInputChange}
                                        className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Capacity Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Max Guests
                                </label>
                                <input
                                    type="number"
                                    name="maxGuests"
                                    min="1"
                                    value={formData.maxGuests}
                                    onChange={handleInputChange}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-center"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Bedrooms
                                </label>
                                <input
                                    type="number"
                                    name="bedrooms"
                                    min="0"
                                    value={formData.bedrooms}
                                    onChange={handleInputChange}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-center"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Beds
                                </label>
                                <input
                                    type="number"
                                    name="beds"
                                    min="1"
                                    value={formData.beds}
                                    onChange={handleInputChange}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-center"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Bathrooms
                                </label>
                                <input
                                    type="number"
                                    name="bathrooms"
                                    min="0"
                                    value={formData.bathrooms}
                                    onChange={handleInputChange}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Property Photos */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Step 4</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Property Photos</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formData.images.length} photo{formData.images.length !== 1 ? 's' : ''} added
                            </span>
                        </div>

                        {/* Add Photo Input */}
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                placeholder="Paste image URL (https://images.unsplash.com/...)"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddImage();
                                    }
                                }}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddImage}
                                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add Photo</span>
                            </button>
                        </div>

                        {/* Image Thumbnails Strip */}
                        {formData.images.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                {formData.images.map((imgUrl, idx) => (
                                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 aspect-video bg-gray-100 dark:bg-gray-800 shadow-sm">
                                        <img
                                            src={imgUrl}
                                            alt={`Property photo ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                                            }}
                                        />
                                        {idx === 0 && (
                                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-bold shadow">
                                                Cover
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow hover:bg-red-700"
                                            title="Delete photo"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400">
                                No photos added yet. Paste image URLs above to showcase your property.
                            </div>
                        )}
                    </div>

                    {/* Section 5: Amenities */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Step 5</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Amenities & Facilities</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                            {FACILITY_OPTIONS.map((facility) => {
                                const isChecked = formData.amenities.includes(facility);
                                return (
                                    <button
                                        key={facility}
                                        type="button"
                                        onClick={() => handleFacilityToggle(facility)}
                                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                                            isChecked
                                                ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 text-teal-800 dark:text-teal-200 font-semibold shadow-sm'
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-teal-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                                        }`}
                                    >
                                        <span className={isChecked ? 'text-teal-600 dark:text-teal-400 shrink-0' : 'text-gray-400 shrink-0'}>
                                            {MODAL_ICONS[facility] || (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </span>
                                        <span className="text-xs truncate">{facility}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 6: Policies & Availability */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Step 6</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Booking Policy & Hours</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {AVAILABILITY_TYPES.map((avail) => {
                                const isSelected = formData.availabilityType === avail.value;
                                return (
                                    <button
                                        key={avail.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, availabilityType: avail.value }))}
                                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                                            isSelected
                                                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-teal-500/50'
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300'
                                        }`}
                                    >
                                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-teal-600 bg-teal-600' : 'border-gray-300'}`}>
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{avail.label}</p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{avail.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Check-in Time
                                </label>
                                <input
                                    type="time"
                                    name="checkInTime"
                                    value={formData.checkInTime}
                                    onChange={handleInputChange}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                                    Check-out Time
                                </label>
                                <input
                                    type="time"
                                    name="checkOutTime"
                                    value={formData.checkOutTime}
                                    onChange={handleInputChange}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer Action Bar */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                        Cancel
                    </button>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'inactive')}
                            disabled={loading}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 transition shadow-sm disabled:opacity-50"
                        >
                            Save as Draft
                        </button>

                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'active')}
                            disabled={loading}
                            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>{isEditing ? 'Save Changes' : 'Publish Listing'}</span>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AddEditRoomModal;
