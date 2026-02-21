# Component Migration Examples - RTK Query

This document shows how to migrate remaining components to use RTK Query hooks. Each example shows the old approach vs. the new approach.

## 1. RoomDetailsPageView Component

### ❌ BEFORE (Using service functions)
```javascript
import { useState, useEffect } from 'react';
import { getRoomById } from '../services/roomService.js';
import { submitReview, checkUserReviewStatus } from '../services/reviewService.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../bookings/services/bookingService.js';
import { toggleWishlist } from '../../wishlist/services/wishlistService.js';

function RoomDetailsPageView() {
    const [room, setRoom] = useState(null);
    const [reviewStatus, setReviewStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const data = await getRoomById(roomId);
                setRoom(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoom();
    }, [roomId]);
    
    const handleBooking = async () => {
        try {
            const order = await createRazorpayOrder({...});
            const verified = await verifyRazorpayPayment({...});
        } catch (err) {
            console.error(err);
        }
    };
    
    const handleReview = async (rating, comment) => {
        try {
            await submitReview(roomId, rating, comment);
        } catch (err) {
            console.error(err);
        }
    };
    
    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} />;
    
    return <div>{/* render room */}</div>;
}
```

### ✅ AFTER (Using RTK Query)
```javascript
import { useParams } from 'react-router-dom';
import {
    useGetRoomByIdQuery,
    useCreateRazorpayOrderMutation,
    useVerifyRazorpayPaymentMutation,
    useToggleWishlistMutation,
    useSubmitReviewMutation,
    useCheckUserReviewStatusQuery
} from '../../../api/apiSlice.js';

function RoomDetailsPageView() {
    const { roomId } = useParams();
    
    // All data fetching is automatic with caching
    const { data: room, isLoading, error } = useGetRoomByIdQuery(roomId);
    const { data: reviewStatus } = useCheckUserReviewStatusQuery(roomId);
    
    // Mutations for user actions
    const [createOrder, { isLoading: isCreatingOrder }] = useCreateRazorpayOrderMutation();
    const [verifyPayment] = useVerifyRazorpayPaymentMutation();
    const [toggleWishlist] = useToggleWishlistMutation();
    const [submitReview] = useSubmitReviewMutation();
    
    const handleBooking = async () => {
        try {
            const order = await createOrder({...}).unwrap();
            const verified = await verifyPayment({...}).unwrap();
            // Cache automatically invalidates related queries
        } catch (err) {
            console.error(err.userMessage);
        }
    };
    
    const handleReview = async (rating, comment) => {
        try {
            await submitReview({ roomId, rating, comment }).unwrap();
            // Cache automatically updates
        } catch (err) {
            console.error(err.userMessage);
        }
    };
    
    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error.userMessage} />;
    
    return <div>{/* render room */}</div>;
}
```

## 2. ProfilePage Component

### ❌ BEFORE
```javascript
import { getCurrentUser } from '../services/authService.js';
import { updateProfile } from '../services/profileService.js';

function ProfilePage() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await getCurrentUser();
                setUser(userData);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, []);
    
    const handleUpdate = async (updatedData) => {
        setIsUpdating(true);
        try {
            const updated = await updateProfile(updatedData);
            setUser(updated);
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };
}
```

### ✅ AFTER
```javascript
import { useGetCurrentUserQuery, useUpdateProfileMutation } from '../../../api/apiSlice.js';

function ProfilePage() {
    const { data: user, isLoading } = useGetCurrentUserQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
    
    const handleUpdate = async (updatedData) => {
        try {
            await updateProfile(updatedData).unwrap();
            // Cache automatically updates User tag
        } catch (err) {
            console.error(err.userMessage);
        }
    };
    
    if (isLoading) return <LoadingSpinner />;
    
    return <div>{/* render profile */}</div>;
}
```

## 3. AuthPage Component

### ❌ BEFORE
```javascript
import { login, register } from '../../auth/services/authService.js';
import { useDispatch } from 'react-redux';
import { setCurrentUser } from '../../../store/appSlice.js';

function AuthPage({ mode }) {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (credentials) => {
        setIsLoading(true);
        try {
            const response = mode === 'login' 
                ? await login(credentials)
                : await register(credentials);
            
            if (response.user) {
                dispatch(setCurrentUser(response.user));
                navigate('/');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
}
```

### ✅ AFTER
```javascript
import { useLoginMutation, useRegisterMutation } from '../../../api/apiSlice.js';
import { useDispatch } from 'react-redux';
import { setCurrentUser } from '../../../store/appSlice.js';

function AuthPage({ mode }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const [login, { isLoading: loginLoading }] = useLoginMutation();
    const [register, { isLoading: registerLoading }] = useRegisterMutation();
    
    const isLoading = loginLoading || registerLoading;
    
    const handleSubmit = async (credentials) => {
        try {
            const { user } = mode === 'login'
                ? await login(credentials).unwrap()
                : await register(credentials).unwrap();
            
            if (user) {
                dispatch(setCurrentUser(user));
                navigate('/');
            }
        } catch (err) {
            console.error(err.userMessage);
        }
    };
}
```

## 4. EarningsPage Component

### ❌ BEFORE
```javascript
import { getHostEarnings } from '../services/bookingService.js';

function EarningsPage() {
    const [earnings, setEarnings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const data = await getHostEarnings();
                setEarnings(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEarnings();
    }, []);
    
    const handleRefresh = async () => {
        const data = await getHostEarnings();
        setEarnings(data);
    };
}
```

### ✅ AFTER
```javascript
import { useGetHostEarningsQuery } from '../../../api/apiSlice.js';

function EarningsPage() {
    const { data: earnings, isLoading, refetch } = useGetHostEarningsQuery();
    
    // Auto-refreshes on component mount and on focus
    const handleRefresh = () => {
        refetch(); // Manual refetch if needed
    };
}
```

## 5. WishlistPage Component

### ❌ BEFORE
```javascript
import { getWishlist, toggleWishlist } from '../services/wishlistService.js';

function WishlistPage() {
    const [wishlist, setWishlist] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        loadWishlist();
    }, []);
    
    const loadWishlist = async () => {
        try {
            const data = await getWishlist();
            setWishlist(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleToggle = async (roomId) => {
        try {
            await toggleWishlist(roomId);
            loadWishlist(); // Manual refetch
        } catch (err) {
            console.error(err);
        }
    };
}
```

### ✅ AFTER
```javascript
import { useGetWishlistQuery, useToggleWishlistMutation } from '../../../api/apiSlice.js';

function WishlistPage() {
    const { data: wishlist = [], isLoading } = useGetWishlistQuery();
    const [toggleWishlist] = useToggleWishlistMutation();
    
    const handleToggle = async (roomId) => {
        try {
            await toggleWishlist(roomId).unwrap();
            // Cache automatically invalidates - wishlist refetches
        } catch (err) {
            console.error(err.userMessage);
        }
    };
}
```

## 6. OwnerDashboard Component

### ❌ BEFORE
```javascript
import { getMyRooms, deleteRoom } from '../services/roomService.js';

function OwnerDashboard() {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        loadRooms();
    }, []);
    
    const loadRooms = async () => {
        try {
            const data = await getMyRooms();
            setRooms(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDelete = async (roomId) => {
        try {
            await deleteRoom(roomId);
            loadRooms(); // Manual refetch
        } catch (err) {
            console.error(err);
        }
    };
}
```

### ✅ AFTER
```javascript
import { useGetMyRoomsQuery, useDeleteRoomMutation } from '../../../api/apiSlice.js';

function OwnerDashboard() {
    const { data: rooms = [], isLoading, refetch } = useGetMyRoomsQuery();
    const [deleteRoom, { isLoading: isDeleting }] = useDeleteRoomMutation();
    
    const handleDelete = async (roomId) => {
        try {
            await deleteRoom(roomId).unwrap();
            // Cache automatically invalidates MyRooms - refetch happens
        } catch (err) {
            console.error(err.userMessage);
        }
    };
}
```

## 7. MyBookingsPage Component

### ❌ BEFORE
```javascript
import { getMyBookings, cancelBooking } from '../services/bookingService.js';

function MyBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getMyBookings();
                setBookings(data);
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, []);
    
    const handleCancel = async (bookingId) => {
        try {
            await cancelBooking(bookingId);
            setBookings(prev => prev.filter(b => b._id !== bookingId));
        } catch (err) {
            console.error(err);
        }
    };
}
```

### ✅ AFTER
```javascript
import { useGetMyBookingsQuery, useCancelBookingMutation } from '../../../api/apiSlice.js';

function MyBookingsPage() {
    const { data: bookings = [], isLoading } = useGetMyBookingsQuery();
    const [cancelBooking] = useCancelBookingMutation();
    
    const handleCancel = async (bookingId) => {
        try {
            await cancelBooking(bookingId).unwrap();
            // Cache automatically updates - no manual state update needed
        } catch (err) {
            console.error(err.userMessage);
        }
    };
}
```

## 8. AddRoomPage Component

### ❌ BEFORE
```javascript
import { createRoom, updateRoom } from '../services/roomService.js';
import { reverseGeocodeAddress } from '../../../services/addressService.js';

function AddRoomPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            const result = roomId 
                ? await updateRoom(roomId, formData)
                : await createRoom(formData);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleLocationChange = async (address) => {
        try {
            const location = await reverseGeocodeAddress(lat, lng);
        } catch (err) {
            console.error(err);
        }
    };
}
```

### ✅ AFTER
```javascript
import {
    useCreateRoomMutation,
    useUpdateRoomMutation,
    useReverseGeocodeAddressQuery
} from '../../../api/apiSlice.js';

function AddRoomPage() {
    const navigate = useNavigate();
    const [createRoom] = useCreateRoomMutation();
    const [updateRoom] = useUpdateRoomMutation();
    
    // Auto-fetch reverse geocode when coordinates change
    const { data: location } = useReverseGeocodeAddressQuery(
        { latitude: lat, longitude: lng },
        { skip: !lat || !lng } // Skip if no coordinates
    );
    
    const handleSubmit = async (formData) => {
        try {
            roomId
                ? await updateRoom({ roomId, ...formData }).unwrap()
                : await createRoom(formData).unwrap();
            navigate('/dashboard');
        } catch (err) {
            console.error(err.userMessage);
        }
    };
}
```

## 9. AddEditRoomModal Component

### ❌ BEFORE
```javascript
import { createRoom, updateRoom } from '../rooms/services/roomService.js';
import { reverseGeocodeAddress } from '../services/addressService.js';

function AddEditRoomModal({ room, isOpen, onClose }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    
    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            if (room?._id) {
                await updateRoom(room._id, formData);
            } else {
                await createRoom(formData);
            }
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleLocationSelect = async (location) => {
        try {
            const geocoded = await reverseGeocodeAddress(
                location.lat,
                location.lng
            );
            setFormData(prev => ({
                ...prev,
                address: geocoded
            }));
        } catch (err) {
            console.error(err);
        }
    };
}
```

### ✅ AFTER
```javascript
import {
    useCreateRoomMutation,
    useUpdateRoomMutation,
    useReverseGeocodeAddressQuery
} from '../api/apiSlice.js';

function AddEditRoomModal({ room, isOpen, onClose }) {
    const [formData, setFormData] = useState({});
    const [createRoom] = useCreateRoomMutation();
    const [updateRoom] = useUpdateRoomMutation();
    
    // Auto-reverse geocode
    const { data: geocodeResult } = useReverseGeocodeAddressQuery(
        { latitude: formData.lat, longitude: formData.lng },
        { skip: !formData.lat || !formData.lng }
    );
    
    const handleSave = async () => {
        try {
            if (room?._id) {
                await updateRoom({ roomId: room._id, ...formData }).unwrap();
            } else {
                await createRoom(formData).unwrap();
            }
            onClose();
        } catch (err) {
            console.error(err.userMessage);
        }
    };
    
    const handleLocationSelect = (location) => {
        setFormData(prev => ({
            ...prev,
            lat: location.lat,
            lng: location.lng
            // geocodeResult will auto-update via RTK Query
        }));
    };
}
```

## 10. EditProfileModal Component

### ❌ BEFORE
```javascript
import { updateProfile } from '../features/profile/services/profileService.js';

function EditProfileModal({ user, isOpen, onClose }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const updated = await updateProfile(formData);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };
}
```

### ✅ AFTER
```javascript
import { useUpdateProfileMutation } from '../api/apiSlice.js';

function EditProfileModal({ user, isOpen, onClose }) {
    const [updateProfile, { isLoading }] = useUpdateProfileMutation();
    
    const handleSubmit = async () => {
        try {
            await updateProfile(formData).unwrap();
            onClose();
            // Cache automatically updates
        } catch (err) {
            console.error(err.userMessage);
        }
    };
}
```

## Pattern Summary

### Always Use These RTK Query Features:

1. **Destructure only what you need**
```javascript
const { data, isLoading, error } = useGetRoomsQuery();
const [createRoom, { isLoading: isCreating }] = useCreateRoomMutation();
```

2. **Use `.unwrap()` for error handling**
```javascript
try {
    await createRoom(data).unwrap();
} catch (err) {
    console.error(err.userMessage);
}
```

3. **Skip queries when needed**
```javascript
const { data } = useGetItemQuery(id, { skip: !id });
```

4. **Trust the cache**
```javascript
// Don't manually refetch - let cache invalidation handle it
// Don't store in local state if RTK Query manages it
```

5. **Use refetch() only when necessary**
```javascript
const { data, refetch } = useGetDataQuery();
// Only call refetch if invalidation tags don't cover it
```

## Testing

### Test each migration with:
- ✅ Initial load (data appears)
- ✅ Error states (show error message)
- ✅ Loading states (show spinner)
- ✅ Mutations (data updates)
- ✅ Cache (no duplicate requests)
- ✅ Refetch on focus
- ✅ Manual refetch if needed

---

Use these patterns for all remaining components!
