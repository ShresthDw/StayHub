import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Toast from '../../../components/Toast.jsx';
import BackButton from '../../../components/BackButton.jsx';
import { icons } from '../../../constants.jsx';
import { getRoomById } from '../services/roomService.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../bookings/services/bookingService.js';
import { toggleWishlist } from '../../wishlist/services/wishlistService.js';
import { setCurrentUser } from '../../../store/appSlice.js';
import { PageSkeleton } from '../../../components/Skeletons.jsx';
import { submitReview, checkUserReviewStatus } from '../services/reviewService.js';
import { getRoomDetailImage } from '../../../utils/imageKitOptimizer.js';

const sampleReviews = [
    { name: 'Aarav Mehta', avatar: 'https://i.pravatar.cc/100?img=12', comment: 'Clean rooms, fast response, and the booking was straightforward.', rating: 5 },
    { name: 'Sara Khan', avatar: 'https://i.pravatar.cc/100?img=32', comment: 'Location was accurate and the host was helpful throughout our stay.', rating: 5 },
    { name: 'Neha Sharma', avatar: 'https://i.pravatar.cc/100?img=47', comment: 'Good value for money, especially for a short daily stay.', rating: 4 }
];

const toDateString = (date) => date.toISOString().slice(0, 10);

const getNights = (fromDate, toDate) => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);
    const diff = end.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
};

const getImageUrl = (image) => {
    const rawUrl = typeof image === 'string' ? image : image?.url;
    return getRoomDetailImage(rawUrl || 'https://placehold.co/1200x800?text=No+Image');
};

const getAddressLine = (room) => {
    const parts = [room?.address?.street, room?.address?.city, room?.address?.state, room?.address?.country]
        .filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location not provided';
};

const RoomDetailsPageView = () => {
    const dispatch = useDispatch();
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { currentUser, razorpayKeyId } = useSelector((state) => state.app);
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState(() => toDateString(new Date()));
    const [toDate, setToDate] = useState(() => toDateString(new Date(Date.now() + 86400000)));
    const [message, setMessage] = useState('');
    const [msgType, setMsgType] = useState('success');
    const [bookingBusy, setBookingBusy] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [canReview, setCanReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        const loadRoom = async () => {
            setLoading(true);
            try {
                const data = await getRoomById(roomId);
                setRoom(data);
                setSelectedImageIndex(0);
            } catch (err) {
                console.error('Failed to load room:', err);
                setMessage(err.response?.data?.msg || 'Unable to load this property right now.');
                setMsgType('error');
            } finally {
                setLoading(false);
            }
        };

        loadRoom();
    }, [roomId]);

    // Separate effect for checking review status - doesn't reload room data
    useEffect(() => {
        const checkReviewStatus = async () => {
            if (!currentUser) {
                setCanReview(false);
                setHasReviewed(false);
                return;
            }
            
            try {
                const reviewStatus = await checkUserReviewStatus(roomId);
                setCanReview(reviewStatus.canReview);
                setHasReviewed(reviewStatus.hasReviewed);
            } catch (err) {
                console.error('Failed to check review status:', err);
                setCanReview(false);
                setHasReviewed(false);
            }
        };

        checkReviewStatus();
    }, [roomId, currentUser?._id]);

    // Initialize map for location display
    useEffect(() => {
        if (!room?.location?.coordinates || !mapRef.current || !window.L) {
            return;
        }

        try {
            const [lng, lat] = room.location.coordinates;
            
            if (!mapInstanceRef.current) {
                if (mapRef.current.offsetHeight === 0 || mapRef.current.offsetWidth === 0) {
                    console.warn('Container has no dimensions, retrying...');
                    setTimeout(() => {
                        if (mapRef.current && mapRef.current.offsetHeight > 0) {
                            mapInstanceRef.current = L.map(mapRef.current, {
                                preferCanvas: true
                            }).setView([lat, lng], 15);
                            
                            const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                attribution: '© OpenStreetMap contributors',
                                maxZoom: 19,
                                minZoom: 2
                            });
                            
                            tileLayer.addTo(mapInstanceRef.current);
                        }
                    }, 200);
                    return;
                }

                mapInstanceRef.current = L.map(mapRef.current, {
                    preferCanvas: true
                }).setView([lat, lng], 15);
                
                const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19,
                    minZoom: 2
                });
                
                tileLayer.on('tileerror', (error) => {
                    console.warn('Tile load error:', error);
                });
                
                tileLayer.addTo(mapInstanceRef.current);
                
            } else {
                mapInstanceRef.current.setView([lat, lng], 15);
            }

            // Clear existing markers
            mapInstanceRef.current.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    mapInstanceRef.current.removeLayer(layer);
                }
            });

            // Add custom high-end location marker for the property
            const escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
            const safeTitle = escapeHtml(room.title || 'Property');
            const safeType = escapeHtml(room.propertyType ? (room.propertyType.charAt(0).toUpperCase() + room.propertyType.slice(1)) : 'Stay');
            const formattedPrice = Number(room.pricePerNight || 0).toLocaleString();
            const safeAddress = escapeHtml(getAddressLine(room));
            const rawFirstImg = room?.images && room.images.length > 0 ? (typeof room.images[0] === 'string' ? room.images[0] : room.images[0]?.url) : '';
            const safeImgUrl = rawFirstImg ? escapeHtml(getImageUrl(rawFirstImg)) : '';

            const propertyIcon = L.divIcon({
                html: `
                    <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.35));">
                        <!-- Floating Location Detail Pill Badge -->
                        <div style="
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                            background: #0f172a;
                            color: #ffffff;
                            padding: 6px 14px 6px 8px;
                            border-radius: 9999px;
                            border: 2px solid #ffffff;
                            font-family: inherit;
                            white-space: nowrap;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                        ">
                            <span style="
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                width: 24px;
                                height: 24px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
                                color: #ffffff;
                                flex-shrink: 0;
                            ">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </span>
                            <div style="display: flex; align-items: baseline; gap: 5px;">
                                <span style="font-size: 13px; font-weight: 700; letter-spacing: -0.01em; color: #ffffff;">${safeType}</span>
                                <span style="font-size: 12px; font-weight: 600; color: #2dd4bf;">₹${formattedPrice}</span>
                            </div>
                        </div>

                        <!-- Downward Pin Pointer Stem -->
                        <div style="
                            width: 0;
                            height: 0;
                            border-left: 7px solid transparent;
                            border-right: 7px solid transparent;
                            border-top: 8px solid #0f172a;
                            margin-top: -1px;
                        "></div>

                        <!-- Coordinates Anchor Pulse Dot -->
                        <div style="
                            width: 9px;
                            height: 9px;
                            border-radius: 50%;
                            background: #0d9488;
                            border: 2px solid #ffffff;
                            box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.4);
                            margin-top: 2px;
                        "></div>
                    </div>
                `,
                className: 'custom-property-pin',
                iconSize: [0, 0],
                iconAnchor: [0, 0],
                popupAnchor: [0, -48]
            });

            const marker = L.marker([lat, lng], { icon: propertyIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
            marker.bindPopup(`
                <div style="font-family: inherit; width: 220px; padding: 3px;">
                    ${safeImgUrl ? `
                        <div style="width: 100%; height: 105px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; background: #e2e8f0;">
                            <img src="${safeImgUrl}" alt="${safeTitle}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                        </div>
                    ` : ''}
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
                        <span style="display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 700; background: #ccfbf1; color: #0f766e; border-radius: 4px; text-transform: uppercase;">${safeType}</span>
                        <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: #0f172a;">
                            ★ ${room.rating || room.ratingAverage || '4.9'}
                        </span>
                    </div>
                    <p style="font-weight: 700; font-size: 13px; color: #0f172a; margin: 0 0 3px 0; line-height: 1.3;">${safeTitle}</p>
                    <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0; line-height: 1.3;">${safeAddress}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 6px;">
                        <span style="font-weight: 800; font-size: 13px; color: #0d9488;">₹${formattedPrice} <span style="font-size: 10px; font-weight: 500; color: #64748b;">/ night</span></span>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; padding: 3px 8px; font-size: 11px; font-weight: 600; background: #0f172a; color: #ffffff; border-radius: 5px; text-decoration: none;">
                            Directions ↗
                        </a>
                    </div>
                </div>
            `);
            
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            }, 150);
        } catch (error) {
            console.error('Map initialization error:', error);
        }
    }, [room]);

    const nightlyRate = useMemo(() => Math.max(1, room?.pricePerNight || 0), [room?.pricePerNight]);
    const nights = useMemo(() => getNights(fromDate, toDate), [fromDate, toDate]);
    const bookingUnits = Math.max(1, nights);
    const totalAmount = nightlyRate * bookingUnits;
    const isWishlisted = useMemo(
        () => (currentUser?.wishlist || []).map(String).includes(String(room?._id)),
        [currentUser?.wishlist, room?._id]
    );

    const loadRazorpayScript = () => new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

    const handleBookNow = async () => {
        if (!currentUser) {
            navigate('/login', { state: { message: 'Login to continue with booking.', messageType: 'success' } });
            return;
        }

        if (!room) return;
        if (!fromDate || !toDate || nights <= 0) {
            setMessage('Please choose a valid date range.');
            setMsgType('error');
            return;
        }

        if (!razorpayKeyId) {
            setMessage('Razorpay is not configured on this server yet.');
            setMsgType('error');
            return;
        }

        setBookingBusy(true);
        setMessage('');

        try {
            const orderPayload = {
                roomId: room._id,
                fromDate,
                toDate,
                nights: bookingUnits,
                bookingUnits,
                pricePerNight: nightlyRate
            };

            const orderResponse = await createRazorpayOrder(orderPayload);
            const scriptReady = await loadRazorpayScript();

            if (!scriptReady) {
                throw new Error('Unable to load Razorpay checkout.');
            }

            const options = {
                key: razorpayKeyId,
                amount: orderResponse.amount,
                currency: orderResponse.currency || 'INR',
                name: 'StayHub',
                description: `${room.title} booking`,
                order_id: orderResponse.id,
                prefill: {
                    name: currentUser.name,
                    email: currentUser.email,
                    contact: currentUser.phone || ''
                },
                notes: {
                    roomId: room._id,
                    fromDate,
                    toDate
                },
                handler: async (razorpayResponse) => {
                    try {
                        await verifyRazorpayPayment(razorpayResponse);

                        setMessage('Payment successful! Your booking is confirmed. Redirecting to your bookings...');
                        setMsgType('success');
                        setTimeout(() => navigate('/my-bookings'), 1500);
                    } catch (paymentError) {
                        console.error('Payment verification failed:', paymentError);
                        setMessage(paymentError.response?.data?.msg || paymentError.response?.data?.message || 'Payment verification failed. Please contact support.');
                        setMsgType('error');
                    }
                },
                modal: {
                    ondismiss: () => {
                        setMessage('Payment cancelled.');
                        setMsgType('error');
                    }
                },
                theme: {
                    color: '#0d9488'
                }
            };

            const paymentWindow = new window.Razorpay(options);
            paymentWindow.open();
        } catch (err) {
            console.error('Booking Error:', err);
            setMessage(err.response?.data?.msg || err.response?.data?.message || err.response?.data?.error || err.message || 'Unable to start checkout.');
            setMsgType('error');
        } finally {
            setBookingBusy(false);
        }
    };

    const handleToggleWishlist = async () => {
        if (!currentUser) {
            navigate('/login', { state: { message: 'Login to save properties to your wishlist.', messageType: 'success' } });
            return;
        }

        try {
            const data = await toggleWishlist(room._id);
            if (data.user) {
                dispatch(setCurrentUser(data.user));
            }
            setMessage(data.msg || (data.isWishlisted ? 'Added to wishlist.' : 'Removed from wishlist.'));
            setMsgType('success');
        } catch (err) {
            console.error('Wishlist error:', err);
            setMessage(err.response?.data?.msg || 'Unable to update wishlist.');
            setMsgType('error');
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            navigate('/login', { state: { message: 'Login to leave a review.', messageType: 'success' } });
            return;
        }

        if (reviewComment.trim().length < 10) {
            setMessage('Review must be at least 10 characters long.');
            setMsgType('error');
            return;
        }

        setReviewSubmitting(true);
        try {
            const result = await submitReview(roomId, reviewRating, reviewComment);
            setMessage('Review submitted successfully! Thank you for your feedback.');
            setMsgType('success');
            setRoom(result.room);
            setReviewComment('');
            setReviewRating(5);
            setHasReviewed(true);
        } catch (err) {
            console.error('Review submission error:', err);
            setMessage(err.response?.data?.msg || 'Failed to submit review.');
            setMsgType('error');
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleCopyAddress = () => {
        const address = getAddressLine(room);
        if (address && navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(address);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    const reviews = room?.reviews?.length ? room.reviews : sampleReviews;
    const allImages = room?.images && room.images.length > 0 ? room.images : [];
    const mainImage = allImages[selectedImageIndex] || allImages[0];
    const hasMultipleImages = allImages.length > 1;

    if (loading) {
        return <PageSkeleton />;
    }

    if (!room) {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {message && <Toast message={message} type={msgType} />}
                <BackButton fallback="/" className="mt-4" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white dark:bg-gray-900">
            {message && <div className="mb-4"><Toast message={message} type={msgType} /></div>}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">
                <BackButton fallback="/" className="mb-2.5" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2 space-y-4">
                        <div className="rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800">
                            
                            {/* Gallery Section */}
                            <div className="room-detail-gallery grid grid-cols-1 gap-2 overflow-hidden sm:grid-cols-3 bg-gray-900/10 dark:bg-gray-950/40 p-2 rounded-2xl">
                                
                                {/* Main Image Box - Complete uncropped view with ambient blurred fill on left/right */}
                                <div className={`relative overflow-hidden rounded-xl bg-gray-900/80 dark:bg-gray-950 flex items-center justify-center h-full ${hasMultipleImages ? 'sm:col-span-2' : 'col-span-full'}`}>
                                    {/* Ambient backdrop that naturally fills empty space on sides without zooming the main photo */}
                                    <img
                                        src={getImageUrl(mainImage)}
                                        alt=""
                                        aria-hidden="true"
                                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                                    />
                                    {/* Full uncropped crisp image */}
                                    <img
                                        src={getImageUrl(mainImage)}
                                        alt={room.title}
                                        className="relative z-10 block max-h-full max-w-full w-auto h-auto object-contain transition-all duration-200"
                                    />
                                </div>

                                {/* Thumbnail Stack if multiple images */}
                                {hasMultipleImages && (
                                    <div className="grid min-h-0 min-w-0 grid-cols-3 sm:grid-cols-1 gap-2 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800/80 p-2">
                                        {allImages.slice(0, 3).map((img, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedImageIndex(idx)}
                                                className={`relative w-full h-full min-h-0 rounded-lg overflow-hidden border-2 transition-all group ${
                                                    selectedImageIndex === idx
                                                        ? 'border-teal-500 shadow-md ring-2 ring-teal-500/30'
                                                        : 'border-transparent opacity-75 hover:opacity-100 hover:border-teal-300'
                                                }`}
                                            >
                                                <img
                                                    src={getImageUrl(img)}
                                                    alt={`${room.title} thumbnail ${idx + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10 bg-white p-4 sm:p-6 dark:bg-gray-800">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-200 capitalize">{room.propertyType}</span>
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">Daily stays</span>
                                    <span className="flex items-center text-sm text-gray-700 dark:text-gray-300">{icons.star}<span className="ml-1 font-medium">{room.rating || room.ratingAverage || '4.9'}</span></span>
                                    <button
                                        type="button"
                                        onClick={handleToggleWishlist}
                                        className={`ml-auto rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isWishlisted ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                                    >
                                        {isWishlisted ? '♥ Saved' : '♡ Save'}
                                    </button>
                                </div>
                                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{room.title}</h1>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">{getAddressLine(room)}</p>
                                <p className="mt-4 text-gray-700 dark:text-gray-300 leading-7">{room.description}</p>
                            </div>
                        </div>

                        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Property Type</p>
                                    <p className="font-medium capitalize">{room.propertyType || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Room Type</p>
                                    <p className="font-medium capitalize">{room.roomType?.replace('_', ' ') || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Guests</p>
                                    <p className="font-medium">{room.maxGuests || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Availability</p>
                                    <p className="font-medium capitalize">{room.availabilityType?.replace('_', ' ') || 'instant'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Bedrooms</p>
                                    <p className="font-medium">{room.bedrooms ?? '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Beds</p>
                                    <p className="font-medium">{room.beds ?? '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Bathrooms</p>
                                    <p className="font-medium">{room.bathrooms ?? '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Check-in / out</p>
                                    <p className="font-medium">{room.checkInTime || '-'} / {room.checkOutTime || '-'}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Amenities</h3>
                                <div className="flex flex-wrap gap-2">
                                    {room.amenities?.length > 0 ? room.amenities.map((facility) => (
                                        <span key={facility} className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">{facility}</span>
                                    )) : <span className="text-sm text-gray-500 dark:text-gray-400">No listed amenities</span>}
                                </div>
                            </div>
                        </section>

                        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reviews</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recent guest feedback from similar bookings.</p>

                            {/* Actual User Reviews List */}
                            <div className="mt-5 space-y-4">
                                {reviews.map((review) => {
                                    const reviewKey = review._id || review.name;
                                    const avatarUrl = review.guestAvatar || `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 70)}`;
                                    return (
                                        <article key={reviewKey} className="flex gap-4 rounded-xl bg-gray-50 dark:bg-gray-700/60 p-4">
                                            <img src={avatarUrl} alt={review.guestName || review.name} className="h-12 w-12 rounded-full object-cover" />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{review.guestName || review.name}</h3>
                                                    <span className="flex items-center text-sm text-gray-700 dark:text-gray-300">{icons.star}<span className="ml-1">{review.rating}.0</span></span>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                                                </p>
                                                <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{review.comment}</p>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {/* Review Form - Positioned below actual user reviews */}
                            {!hasReviewed && (
                                <form onSubmit={handleReviewSubmit} className="mt-8 p-4 sm:p-5 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-800/20 rounded-2xl border border-teal-200 dark:border-teal-700/50">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Share Your Experience</h3>
                                    
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewRating(star)}
                                                    disabled={!canReview}
                                                    className={`text-3xl transition-transform ${
                                                        canReview ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed opacity-50'
                                                    } ${
                                                        star <= reviewRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                                    }`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Your Review (minimum 10 characters)
                                        </label>
                                        <textarea
                                            id="review-comment"
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            disabled={!canReview}
                                            placeholder={canReview ? 'Tell us about your stay...' : 'Available after checkout date'}
                                            className={`w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 ${
                                                !canReview ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                            rows="4"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            type="submit"
                                            disabled={!canReview || reviewSubmitting || reviewComment.trim().length < 10}
                                            className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                                                !canReview || reviewSubmitting || reviewComment.trim().length < 10
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600'
                                            }`}
                                        >
                                            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                        
                                        {!canReview && (
                                            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-xs font-semibold text-teal-700 dark:text-teal-300">
                                                <svg className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>You can review after your checkout date</span>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            )}

                            {hasReviewed && (
                                <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700/50">
                                    <p className="text-sm text-green-700 dark:text-green-400">✓ You have already reviewed this property</p>
                                </div>
                            )}
                        </section>
                    </section>

                    <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 space-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Starting from</p>
                                <div className="flex items-baseline gap-1.5 mt-1">
                                    <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                                        ₹{nightlyRate.toLocaleString()}
                                    </span>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        / night
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    From
                                    <input type="date" value={fromDate} onClick={(event) => event.currentTarget.showPicker?.()} onChange={(e) => setFromDate(e.target.value)} className="date-input mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-teal-500 focus:ring-teal-500" />
                                </label>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    To
                                    <input type="date" value={toDate} min={fromDate} onClick={(event) => event.currentTarget.showPicker?.()} onChange={(e) => setToDate(e.target.value)} className="date-input mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-teal-500 focus:ring-teal-500" />
                                </label>
                            </div>

                            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                    <span>Nights</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{bookingUnits}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                    <span>Rate</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">₹{nightlyRate.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-600">
                                    <span>Total</span>
                                    <span>₹{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <button onClick={handleBookNow} disabled={bookingBusy} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white ${bookingBusy ? 'bg-teal-400' : 'bg-teal-600 hover:bg-teal-700'}`}>
                                {bookingBusy ? 'Preparing checkout…' : 'Book Now'}
                            </button>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Host details</h3>
                            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                <p><span className="font-medium text-gray-900 dark:text-gray-100">Name:</span> {room.hostId?.name || 'N/A'}</p>
                                <p><span className="font-medium text-gray-900 dark:text-gray-100">Email:</span> {room.hostId?.email || 'N/A'}</p>
                                <p><span className="font-medium text-gray-900 dark:text-gray-100">Phone:</span> {room.hostId?.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Location Section */}
            {room.location?.coordinates?.length === 2 && (
                <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Where you'll be
                                </h2>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {getAddressLine(room)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleCopyAddress}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm cursor-pointer"
                                >
                                    {copiedAddress ? (
                                        <>
                                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-emerald-600 font-semibold">Address Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span>Copy Address</span>
                                        </>
                                    )}
                                </button>

                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${room.location.coordinates[1]},${room.location.coordinates[0]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    <span>Open in Maps</span>
                                </a>
                            </div>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
                            <div 
                                ref={mapRef}
                                id="room-detail-map"
                                className="w-full h-[380px] z-0"
                            />
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
};

export default RoomDetailsPageView;
