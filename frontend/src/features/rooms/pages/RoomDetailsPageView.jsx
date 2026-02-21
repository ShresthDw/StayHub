import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Toast from '../../../components/Toast.jsx';
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
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        const loadRoom = async () => {
            setLoading(true);
            try {
                const data = await getRoomById(roomId);
                setRoom(data);
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
                // Ensure container has proper dimensions before initializing
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

            // Add marker for the property
            const propertyIcon = L.divIcon({
                html: `
                    <div style="
                        background: #5735ff;
                        color: white;
                        padding: 10px 14px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        white-space: nowrap;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    ">
                        📍 ${room.title}
                    </div>
                `,
                className: 'property-marker',
                iconSize: [120, 40],
                iconAnchor: [60, 40],
                popupAnchor: [0, -40]
            });

            const marker = L.marker([lat, lng], { icon: propertyIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
            marker.bindPopup(`
                <div style="text-align: center; padding: 8px;">
                    <p style="font-weight: bold; margin: 5px 0; font-size: 14px;">${room.title}</p>
                    <p style="font-size: 12px; margin: 5px 0; color: #555;">${getAddressLine(room)}</p>
                    <p style="font-weight: bold; margin: 5px 0; color: #5735ff; font-size: 13px;">₹${room.pricePerNight}/night</p>
                </div>
            `);
            
            // Trigger map to recalculate size
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
                        setTimeout(() => navigate('/profile'), 2000);
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
                    color: '#4f46e5'
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

    const reviews = room?.reviews?.length ? room.reviews : sampleReviews;

    if (loading) {
        return <PageSkeleton />;
    }

    if (!room) {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {message && <Toast message={message} type={msgType} />}
                <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 rounded-md bg-indigo-600 text-white">Go Back</button>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white dark:bg-gray-900">
            {message && <div className="mb-6"><Toast message={message} type={msgType} /></div>}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <section className="lg:col-span-2 space-y-6">
                        <div className="rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800">
                            <img src={getImageUrl(room.images?.[0])} alt={room.title} className="w-full h-80 object-cover" />
                            <div className="p-6">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 capitalize">{room.propertyType}</span>
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">Daily stays</span>
                                    <span className="flex items-center text-sm text-gray-700 dark:text-gray-300">{icons.star}<span className="ml-1 font-medium">{room.rating || room.ratingAverage || '4.9'}</span></span>
                                    <button
                                        type="button"
                                        onClick={handleToggleWishlist}
                                        className={`ml-auto rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isWishlisted ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                                    >
                                        {isWishlisted ? '♥ Saved' : '♡ Save'}
                                    </button>
                                </div>
                                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{room.title}</h1>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">{getAddressLine(room)}</p>
                                <p className="mt-4 text-gray-700 dark:text-gray-300 leading-7">{room.description}</p>
                            </div>
                        </div>

                        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 space-y-4">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {room.images?.slice(1, 5).map((image, index) => (
                                <img key={index} src={getImageUrl(image)} alt={`${room.title} ${index + 2}`} className="h-52 w-full object-cover rounded-2xl shadow-md" />
                            ))}
                        </div>

                        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reviews</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recent guest feedback from similar bookings.</p>

                            {/* Review Form - Show to all, but disable if user hasn't stayed there */}
                            {!hasReviewed && (
                                <form onSubmit={handleReviewSubmit} className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl border border-indigo-200 dark:border-indigo-700/50">
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
                                            className={`w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 ${
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
                                                    : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600'
                                            }`}
                                        >
                                            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                        
                                        {!canReview && (
                                            <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">
                                                You can review after your checkout date
                                            </p>
                                        )}
                                    </div>
                                </form>
                            )}

                            {hasReviewed && (
                                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700/50">
                                    <p className="text-sm text-green-700 dark:text-green-400">✓ You have already reviewed this property</p>
                                </div>
                            )}

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
                        </section>
                    </section>

                    <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-5">
                            <div>
                                <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Starting from</p>
                                <p className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">₹{nightlyRate.toLocaleString()}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">per night</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    From
                                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
                                </label>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    To
                                    <input type="date" value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" />
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

                            <button onClick={handleBookNow} disabled={bookingBusy} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white ${bookingBusy ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                {bookingBusy ? 'Preparing checkout…' : 'Book Now'}
                            </button>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
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

            {/* Full Width Map Section */}
            {room.location?.coordinates?.length === 2 && (
                <div className="w-screen -ml-px bg-white dark:bg-gray-900 mt-12 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Location</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{getAddressLine(room)}</p>
                        <div 
                            ref={mapRef}
                            id="room-detail-map"
                            style={{
                                width: '100%',
                                height: '500px',
                                borderRadius: '1rem',
                                border: '1px solid rgb(229, 231, 235)',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        >
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default RoomDetailsPageView;

