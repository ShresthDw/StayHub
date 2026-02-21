import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FACILITY_OPTIONS, PROPERTY_TYPES, ROOM_TYPES } from '../../../constants.jsx';
import { createRoom, updateRoom } from '../services/roomService.js';
import InputField from '../../../components/InputField.jsx';
import MapLocationSelector from '../../../components/MapLocationSelector.jsx';
import Toast from '../../../components/Toast.jsx';
import { reverseGeocodeAddress } from '../../../services/addressService.js';

const AddRoomPage = () => {
    const navigate = useNavigate();
    const { geoApiKey } = useSelector((state) => state.app);
    const [message, setMessage] = useState('');
    const [msgType, setMsgType] = useState('error');
    const [loading, setLoading] = useState(false);
    const AVAILABILITY_TYPES = ['instant', 'approval_required'];

    const getInitialState = () => {
        return {
            title: '',
            description: '',
            propertyType: PROPERTY_TYPES[0],
            roomType: ROOM_TYPES[0],
            location: {
                address: '',
                lat: null,
                lng: null
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
            maxGuests: '',
            bedrooms: '',
            beds: '',
            bathrooms: '',
            images: '',
            amenities: [],
            availabilityType: 'instant',
            checkInTime: '',
            checkOutTime: '',
            isActive: true
        };
    };

    const [formData, setFormData] = useState(getInitialState());
    const [publishState, setPublishState] = useState('active');

    const showMsg = (msg, type = 'error') => {
        setMessage(msg);
        setMsgType(type);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddressChange = (e) => {
        const address = e.target.value;
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                address
            }
        }));
    };

    const handleLocationSelect = (location) => {
        setFormData(prev => ({
            ...prev,
            location
        }));
    };

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

        setLoading(true);
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
                        address: `${parsedAddress.street}, ${parsedAddress.city}, ${parsedAddress.state}`.replace(/^, |, $/g, '')
                    }
                }));
                showMsg('Address fields auto-filled successfully!', 'success');
            } else {
                showMsg('Could not auto-fill address. Please enter manually.');
            }
        } catch (err) {
            console.error('Error auto-filling address:', err);
            showMsg('Error auto-filling address.');
        } finally {
            setLoading(false);
        }
    };

    const handleFacilityChange = (facility) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(facility)
                ? prev.amenities.filter(f => f !== facility)
                : [...prev.amenities, facility]
        }));
    };

    const handleSubmit = async (e, state) => {
        e.preventDefault();
        setPublishState(state);
        setLoading(true);

        if (!formData.title?.trim()) {
            showMsg('Please provide a title.');
            setLoading(false);
            return;
        }

        if (!formData.description?.trim()) {
            showMsg('Please provide a description.');
            setLoading(false);
            return;
        }

        if (!formData.location.lat || !formData.location.lng) {
            showMsg('Please select a location on the map.');
            setLoading(false);
            return;
        }

        if (!formData.address?.city?.trim()) {
            showMsg('Please provide a city.');
            setLoading(false);
            return;
        }

        const parsedPrice = Number.parseFloat(formData.pricePerNight);
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            showMsg('Please provide a valid price per night.');
            setLoading(false);
            return;
        }

        const imageList = formData.images.split(',').map((s) => s.trim()).filter(Boolean);
        if (imageList.length === 0) {
            showMsg('Please provide at least one image URL.');
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
                coordinates: [formData.location.lng, formData.location.lat]
            },
            maxGuests: parseOptionalNumber(formData.maxGuests),
            bedrooms: parseOptionalNumber(formData.bedrooms),
            beds: parseOptionalNumber(formData.beds),
            bathrooms: parseOptionalNumber(formData.bathrooms),
            images: imageList.map((url, index) => ({
                url,
                isPrimary: index === 0
            })),
            amenities: formData.amenities,
            availabilityType: formData.availabilityType,
            checkInTime: formData.checkInTime || undefined,
            checkOutTime: formData.checkOutTime || undefined,
            isActive: state === 'active'
        };

        try {
            await createRoom(payload);
            showMsg('Property successfully added.', 'success');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            console.error('ERROR in AddRoomPage submit:', err);
            showMsg(err.response?.data?.msg || err.message || 'Network error.');
            setLoading(false);
        }
    };

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mb-4 text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                >
                    ← Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Add New Property</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">List your property and start earning.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                {message && <Toast message={message} type={msgType} />}
                <form className="space-y-4 mt-4">
                    <InputField label="Property Title" name="title" value={formData.title} onChange={handleInputChange} />
                    <InputField label="Description" name="description" isTextArea={true} value={formData.description} onChange={handleInputChange} />

                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Select Location on Map<span className="text-red-500">*</span></label>
                        <div style={{ height: '250px', width: '100%' }}>
                            <MapLocationSelector location={formData.location} onLocationSelect={handleLocationSelect} geoApiKey={geoApiKey} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Address<span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="address"
                            value={formData.location.address || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, address: e.target.value } }))}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            placeholder="Full address (optional - auto-filled from map)"
                        />
                        <button
                            type="button"
                            onClick={handleAutoFillAddress}
                            disabled={!formData.location.lat || !formData.location.lng || loading}
                            className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Auto-filling...' : 'Auto-fill from Coordinates'}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click "Auto-fill" to extract address components from map coordinates.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Street Address" name="street" value={formData.address.street} onChange={handleAddressComponentChange} />
                        <InputField label="City" name="city" value={formData.address.city} onChange={handleAddressComponentChange} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="State/Province" name="state" value={formData.address.state} onChange={handleAddressComponentChange} />
                        <InputField label="Country" name="country" value={formData.address.country} onChange={handleAddressComponentChange} />
                        <InputField label="Zip Code" name="zipCode" value={formData.address.zipCode} onChange={handleAddressComponentChange} />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Property Type<span className="text-red-500">*</span></label>
                        <select name="propertyType" value={formData.propertyType} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Room Type<span className="text-red-500">*</span></label>
                            <select name="roomType" value={formData.roomType} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                {ROOM_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Availability Type<span className="text-red-500">*</span></label>
                            <select name="availabilityType" value={formData.availabilityType} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                {AVAILABILITY_TYPES.map((availability) => (
                                    <option key={availability} value={availability}>{availability}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Price Per Night" name="pricePerNight" type="number" value={formData.pricePerNight} onChange={handleInputChange} />
                        <InputField label="Max Guests" name="maxGuests" type="number" value={formData.maxGuests} onChange={handleInputChange} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Bedrooms" name="bedrooms" type="number" value={formData.bedrooms} onChange={handleInputChange} required={false} />
                        <InputField label="Beds" name="beds" type="number" value={formData.beds} onChange={handleInputChange} required={false} />
                        <InputField label="Bathrooms" name="bathrooms" type="number" value={formData.bathrooms} onChange={handleInputChange} required={false} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Cleaning Fee" name="cleaningFee" type="number" value={formData.cleaningFee} onChange={handleInputChange} required={false} />
                        <InputField label="Service Fee" name="serviceFee" type="number" value={formData.serviceFee} onChange={handleInputChange} required={false} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Check-in Time" name="checkInTime" type="time" value={formData.checkInTime} onChange={handleInputChange} required={false} />
                        <InputField label="Check-out Time" name="checkOutTime" type="time" value={formData.checkOutTime} onChange={handleInputChange} required={false} />
                    </div>

                    <InputField label="Image URLs (Comma Separated)" name="images" value={formData.images} onChange={handleInputChange} />

                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Facilities</label>
                        <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                            {FACILITY_OPTIONS.map((f) => (
                                <label key={f} className="flex items-center cursor-pointer p-2 border rounded-md border-gray-300 dark:border-gray-700 transition-colors hover:bg-indigo-50 dark:hover:bg-gray-700">
                                    <input type="checkbox" checked={formData.amenities.includes(f)} onChange={() => handleFacilityChange(f)} className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded" />
                                    <span className="ml-2 text-gray-700 dark:text-gray-300">{f}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'inactive')}
                            disabled={loading}
                            className={`flex-1 py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ${loading ? 'opacity-50' : ''}`}
                        >
                            Save as Draft
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'active')}
                            disabled={loading}
                            className={`flex-1 py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            List Immediately
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default AddRoomPage;
