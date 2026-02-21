# RTK Query Implementation Guide

## Overview
RTK Query has been fully integrated into the StayHub24 application. This document explains the new architecture and provides examples for using RTK Query throughout the codebase.

## Architecture Changes

### Before (Service + Redux Thunks)
```
Component → Service (axios) → Redux Thunk → Redux Store → Component
```

### After (RTK Query)
```
Component → RTK Query Hook → Cache & Store → Component
```

## Key Files

### 1. **API Slice** (`src/api/apiSlice.js`)
The central location for all API endpoints. Includes:
- Auth endpoints (login, register, logout, getCurrentUser)
- Room endpoints (getPublicRooms, createRoom, updateRoom, etc.)
- Booking endpoints (create orders, verify payments, get bookings)
- Review endpoints
- Profile endpoints
- Wishlist endpoints
- Address endpoints
- Config endpoints

### 2. **Store Configuration** (`src/store/index.js`)
- Configured RTK Query reducer and middleware
- Enables automatic cache management and refetch on window focus/reconnect

### 3. **Redux Slices** (`src/store/appSlice.js`, `src/store/roomsSlice.js`)
- **appSlice**: Manages UI state (filters, search location, theme, current user)
- **roomsSlice**: Manages pagination metadata for infinite scroll

### 4. **Updated Services**
All service files now re-export RTK Query hooks instead of functions:
- `authService.js` → exports auth hooks
- `roomService.js` → exports room hooks
- `bookingService.js` → exports booking hooks
- etc.

## Using RTK Query Hooks

### Query Hooks (GET requests - automatic caching)

```javascript
import { useGetPublicRoomsQuery, useGetCurrentUserQuery } from '../api/apiSlice.js';

function MyComponent() {
    // Simple query - automatically fetches and caches
    const { data: user, isLoading, error } = useGetCurrentUserQuery();
    
    // Query with parameters
    const { data: rooms, isLoading } = useGetPublicRoomsQuery({
        filters: { propertyType: 'apartment' },
        searchLocation: { address: 'NYC', lat: null, lng: null },
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-05',
        page: 1
    });
    
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    
    return <div>{/* render data */}</div>;
}
```

### Mutation Hooks (POST, PUT, DELETE - for mutations)

```javascript
import { useLoginMutation, useCreateRoomMutation } from '../api/apiSlice.js';

function MyComponent() {
    // Mutation hook returns [trigger, result]
    const [login, { isLoading, error }] = useLoginMutation();
    
    const handleLogin = async (credentials) => {
        try {
            const result = await login(credentials).unwrap();
            console.log('Login successful:', result);
        } catch (err) {
            console.error('Login failed:', err);
        }
    };
    
    return (
        <button onClick={() => handleLogin({email: 'user@example.com', password: 'pass'})}>
            {isLoading ? 'Logging in...' : 'Login'}
        </button>
    );
}
```

## Caching & Cache Invalidation

RTK Query automatically caches responses based on endpoint and parameters.

### Automatic Cache Invalidation
Mutations can specify `invalidatesTags` to automatically refresh related queries:

```javascript
// In apiSlice.js
updateRoom: builder.mutation({
    query: ({ roomId, ...body }) => ({
        url: `/rooms/edit/${roomId}`,
        method: 'PUT',
        body
    }),
    invalidatesTags: (result, error, { roomId }) => [
        { type: 'Room', id: roomId },    // Refresh this specific room
        'MyRooms',                       // Refresh my rooms list
        'Rooms'                          // Refresh all rooms
    ]
})
```

### Manual Cache Invalidation
If needed, you can manually invalidate cache:

```javascript
import { useDispatch } from 'react-redux';
import { apiSlice } from '../api/apiSlice.js';

function MyComponent() {
    const dispatch = useDispatch();
    
    const handleRefresh = () => {
        // Invalidate specific tag
        dispatch(apiSlice.util.invalidateTags(['Rooms']));
        
        // Or reset entire API state
        dispatch(apiSlice.util.resetApiState());
    };
    
    return <button onClick={handleRefresh}>Refresh</button>;
}
```

## Migration Examples

### Example 1: Login Component

**Before:**
```javascript
import { login } from '../services/authService.js';

function LoginForm() {
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        setLoading(true);
        try {
            const data = await login(formData);
            // Manual state update needed
        } finally {
            setLoading(false);
        }
    };
}
```

**After:**
```javascript
import { useLoginMutation } from '../api/apiSlice.js';

function LoginForm() {
    const [login, { isLoading }] = useLoginMutation();
    
    const handleSubmit = async (e) => {
        try {
            await login(formData).unwrap();
            // RTK Query automatically manages cache and state
        } catch (err) {
            console.error(err);
        }
    };
}
```

### Example 2: Room List with Infinite Scroll

**Before:**
```javascript
import { getPublicRoomsByType } from '../services/roomService.js';
import { fetchMoreRoomsByCategory } from '../store/roomsSlice.js';

function RoomList() {
    const { publicRooms, categoryPagination } = useSelector(state => state.rooms);
    const dispatch = useDispatch();
    
    const handleLoadMore = () => {
        dispatch(fetchMoreRoomsByCategory(propertyType));
    };
}
```

**After:**
```javascript
import { useGetPublicRoomsByTypeQuery } from '../api/apiSlice.js';
import { useDispatch, useSelector } from 'react-redux';
import { incrementCategoryPage } from '../store/roomsSlice.js';

function RoomList({ propertyType }) {
    const { filters, searchLocation, checkInDate, checkOutDate } = useSelector(state => state.app);
    const { categoryPagination } = useSelector(state => state.rooms);
    const dispatch = useDispatch();
    const page = categoryPagination[propertyType].page;
    
    const { data, isLoading } = useGetPublicRoomsByTypeQuery({
        propertyType,
        filters,
        searchLocation,
        checkInDate,
        checkOutDate,
        page
    });
    
    const handleLoadMore = () => {
        dispatch(incrementCategoryPage(propertyType));
    };
}
```

### Example 3: Profile Update

**Before:**
```javascript
import { updateProfile } from '../services/profileService.js';

function EditProfile() {
    const [loading, setLoading] = useState(false);
    
    const handleSave = async () => {
        setLoading(true);
        try {
            const updated = await updateProfile(formData);
            // Manual refetch needed
        } finally {
            setLoading(false);
        }
    };
}
```

**After:**
```javascript
import { useUpdateProfileMutation } from '../api/apiSlice.js';

function EditProfile() {
    const [updateProfile, { isLoading }] = useUpdateProfileMutation();
    
    const handleSave = async () => {
        try {
            await updateProfile(formData).unwrap();
            // Cache automatically invalidates related queries (User tag)
        } catch (err) {
            console.error(err);
        }
    };
}
```

## Available Hooks

### Auth Hooks
- `useLoginMutation()` - POST /auth/login
- `useRegisterMutation()` - POST /auth/register
- `useGetCurrentUserQuery()` - GET /auth/me
- `useLogoutMutation()` - POST /auth/logout

### Room Hooks
- `useGetPublicRoomsQuery(args)` - GET /rooms (paginated)
- `useGetPublicRoomsByTypeQuery(args)` - GET /rooms (by type)
- `useGetRoomByIdQuery(roomId)` - GET /rooms/:roomId
- `useGetMyRoomsQuery()` - GET /rooms/mine
- `useCreateRoomMutation()` - POST /rooms/add
- `useUpdateRoomMutation()` - PUT /rooms/edit/:roomId
- `useDeleteRoomMutation()` - DELETE /rooms/delete/:roomId
- `useGetCitiesQuery()` - GET /rooms/cities/list
- `useGetRoomsByCityQuery(args)` - GET /rooms/city/:city

### Booking Hooks
- `useCreateRazorpayOrderMutation()` - POST /bookings/razorpay/order
- `useVerifyRazorpayPaymentMutation()` - POST /bookings/razorpay/verify
- `useGetMyBookingsQuery()` - GET /bookings
- `useGetBookedPropertiesQuery()` - GET /bookings/booked-list
- `useGetHostEarningsQuery()` - GET /bookings/host-earnings
- `useCancelBookingMutation()` - DELETE /bookings/:bookingId

### Review Hooks
- `useSubmitReviewMutation()` - POST /bookings/reviews/submit
- `useCheckUserReviewStatusQuery(roomId)` - GET /bookings/reviews/status/:roomId

### Profile Hooks
- `useUpdateProfileMutation()` - PUT /auth/profile
- `useBecomOwnerMutation()` - POST /auth/become-owner

### Wishlist Hooks
- `useGetWishlistQuery()` - GET /auth/wishlist
- `useToggleWishlistMutation()` - POST /auth/wishlist/:roomId

### Address Hooks
- `useReverseGeocodeAddressQuery(args)` - GET /address/reverse-geocode

### Config Hooks
- `useGetAppConfigQuery()` - GET /config

## Best Practices

1. **Use hooks directly in components** - Let RTK Query manage state and caching
2. **Don't duplicate data** - Don't store API responses in Redux if RTK Query handles it
3. **Use tags for cache invalidation** - Specify `provideTags` and `invalidatesTags`
4. **Keep UI state in Redux** - Filters, pagination metadata, theme, etc.
5. **Handle errors properly** - Check `error` in query results or use try-catch with mutations
6. **Skip queries when needed** - Use `skip: boolean` option to conditionally fetch
7. **Refetch manually if needed** - Call refetch function returned by hooks

```javascript
const { data, refetch } = useGetMyBookingsQuery();

const handleRefresh = () => {
    refetch(); // Manually refetch this query
};
```

## Migration Checklist

- [x] Create main API slice with all endpoints
- [x] Update store configuration with RTK Query
- [x] Update Redux slices for UI state only
- [x] Export hooks from service files
- [x] Update App.jsx with RTK Query initialization
- [ ] Update HomePage.jsx to use RTK Query hooks
- [ ] Update all page components to use hooks
- [ ] Update all modal components to use hooks
- [ ] Remove unused service imports and functions
- [ ] Test all features with RTK Query

## Troubleshooting

### Query not refetching?
- Check that you're using the correct `skip` condition
- Verify `provideTags` and `invalidatesTags` are set correctly
- Use `refetch()` function manually if needed

### Cache not invalidating?
- Ensure mutation has `invalidatesTags` configured
- Tag names must match exactly in `provideTags` and `invalidatesTags`
- Use `useDispatch` and `apiSlice.util.invalidateTags()` for manual invalidation

### Authentication headers not working?
- Check that `prepareHeaders` in baseQuery is setting headers correctly
- Verify auth token is in localStorage or cookie
- Check Network tab in DevTools to see actual headers sent

### Error handling?
RTK Query errors come in `error.status` and `error.data`:
```javascript
const { data, error } = useGetRoomsQuery();
if (error) {
    console.log(error.status);      // HTTP status code
    console.log(error.data);        // Response body
    console.log(error.userMessage); // Custom error message
}
```

## Next Steps

1. Update remaining components to use RTK Query hooks
2. Remove all remaining async thunks
3. Remove httpClient usage from components
4. Test all features thoroughly
5. Monitor Redux DevTools for proper state management
