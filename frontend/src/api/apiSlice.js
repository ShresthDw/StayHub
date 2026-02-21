import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../constants.jsx';

/**
 * Base query configuration with authentication headers
 */
const baseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            headers.set('x-user-id', userId);
        }
        headers.set('Content-Type', 'application/json');
        return headers;
    }
});

/**
 * Custom base query with error handling
 */
const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    if (result.error) {
        const error = result.error;
        let normalizedMessage = '';

        if (typeof error.data === 'string') {
            normalizedMessage = error.data;
        } else if (error.data && typeof error.data === 'object') {
            normalizedMessage =
                error.data.msg ||
                error.data.message ||
                error.data.error ||
                (Array.isArray(error.data.errors) ? error.data.errors[0]?.msg : '');
        }

        if (!normalizedMessage && error.status) {
            normalizedMessage = `Request failed (${error.status})`;
        }

        if (normalizedMessage) {
            result.error.userMessage = normalizedMessage;
        }
    }

    return result;
};

/**
 * Main API slice for all endpoints
 */
export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: [
        'User',
        'Rooms',
        'Room',
        'MyRooms',
        'Bookings',
        'MyBookings',
        'BookedProperties',
        'HostEarnings',
        'Wishlist',
        'Reviews',
        'Cities',
        'Config',
        'Address'
    ],
    endpoints: (builder) => ({
        // AUTH ENDPOINTS
        login: builder.mutation({
            query: (payload) => ({
                url: '/auth/login',
                method: 'POST',
                body: payload
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data.user?.id) {
                        localStorage.setItem('userId', data.user.id);
                    }
                } catch (error) {
                    console.error('Login error:', error);
                }
            },
            invalidatesTags: ['User']
        }),

        register: builder.mutation({
            query: (payload) => ({
                url: '/auth/register',
                method: 'POST',
                body: payload
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data.user?.id) {
                        localStorage.setItem('userId', data.user.id);
                    }
                } catch (error) {
                    console.error('Register error:', error);
                }
            },
            invalidatesTags: ['User']
        }),

        getCurrentUser: builder.query({
            query: () => '/auth/me',
            transformResponse: (response) => response.user,
            providesTags: ['User']
        }),

        logout: builder.mutation({
            query: () => ({
                url: '/auth/logout',
                method: 'POST'
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    localStorage.removeItem('userId');
                    dispatch(apiSlice.util.resetApiState());
                } catch (error) {
                    console.error('Logout error:', error);
                }
            },
            invalidatesTags: ['User']
        }),

        // ============= ROOMS ENDPOINTS =============
        getPublicRooms: builder.query({
            query: ({ filters, searchLocation, checkInDate, checkOutDate, page = 1 }) => {
                const params = { isActive: 'true', page, limit: 5 };

                if (filters?.propertyType) params.propertyType = filters.propertyType;
                if (filters?.amenities?.length > 0) params.amenities = filters.amenities.join(',');
                if (checkInDate) params.checkInDate = checkInDate;
                if (checkOutDate) params.checkOutDate = checkOutDate;

                if (searchLocation?.lat && searchLocation?.lng) {
                    params.lat = searchLocation.lat;
                    params.lng = searchLocation.lng;
                    if (searchLocation.distance) params.maxDistance = searchLocation.distance;
                } else if (searchLocation?.address) {
                    params.city = searchLocation.address;
                }

                return { url: '/rooms', params };
            },
            transformResponse: (response) => ({
                rooms: response.rooms || response,
                pagination: response.pagination || null
            }),
            providesTags: (result) => result?.rooms?.length > 0 ? [{ type: 'Rooms', id: 'LIST' }, ...result.rooms.map(room => ({ type: 'Room', id: room._id }))] : [{ type: 'Rooms', id: 'LIST' }],
            serializeQueryArgs: ({ queryArgs }) => {
                const { page, ...cacheKey } = queryArgs;
                return cacheKey;
            },
            merge: (currentCache, newItems, { arg }) => {
                if (arg.page === 1) {
                    currentCache.rooms = newItems.rooms;
                } else {
                    currentCache.rooms.push(...newItems.rooms);
                }
                currentCache.pagination = newItems.pagination;
            },
            forceRefetch: ({ currentArg, previousArg }) => currentArg?.page !== previousArg?.page,
            keepUnusedDataFor: 60
        }),

        getPublicRoomsByType: builder.query({
            query: ({ propertyType, filters, searchLocation, checkInDate, checkOutDate, page = 1 }) => {
                const params = { isActive: 'true', page, limit: 5, propertyType };

                if (filters?.amenities?.length > 0) params.amenities = filters.amenities.join(',');
                if (checkInDate) params.checkInDate = checkInDate;
                if (checkOutDate) params.checkOutDate = checkOutDate;

                if (searchLocation?.lat && searchLocation?.lng) {
                    params.lat = searchLocation.lat;
                    params.lng = searchLocation.lng;
                    if (searchLocation.distance) params.maxDistance = searchLocation.distance;
                } else if (searchLocation?.address) {
                    params.city = searchLocation.address;
                }

                return { url: '/rooms', params };
            },
            transformResponse: (response) => ({
                rooms: response.rooms || response,
                pagination: response.pagination || null
            }),
            providesTags: (result, error, arg) => result?.rooms?.length > 0 ? [{ type: 'Rooms', id: `TYPE_${arg.propertyType}` }, ...result.rooms.map(room => ({ type: 'Room', id: room._id }))] : [{ type: 'Rooms', id: `TYPE_${arg.propertyType}` }],
            serializeQueryArgs: ({ queryArgs }) => {
                const { page, ...cacheKey } = queryArgs;
                return cacheKey;
            },
            merge: (currentCache, newItems, { arg }) => {
                if (arg.page === 1) {
                    currentCache.rooms = newItems.rooms;
                } else {
                    currentCache.rooms.push(...newItems.rooms);
                }
                currentCache.pagination = newItems.pagination;
            },
            forceRefetch: ({ currentArg, previousArg }) => currentArg?.page !== previousArg?.page,
            keepUnusedDataFor: 60
        }),

        getRoomById: builder.query({
            query: (roomId) => `/rooms/${roomId}`,
            providesTags: (result, error, roomId) => [{ type: 'Room', id: roomId }]
        }),

        getMyRooms: builder.query({
            query: () => '/rooms/mine',
            providesTags: ['MyRooms']
        }),

        createRoom: builder.mutation({
            query: (payload) => ({
                url: '/rooms/add',
                method: 'POST',
                body: payload
            }),
            invalidatesTags: ['MyRooms', 'Rooms']
        }),

        updateRoom: builder.mutation({
            query: ({ roomId, ...body }) => ({
                url: `/rooms/edit/${roomId}`,
                method: 'PUT',
                body
            }),
            invalidatesTags: (result, error, { roomId }) => [
                { type: 'Room', id: roomId },
                'MyRooms',
                'Rooms'
            ]
        }),

        deleteRoom: builder.mutation({
            query: (roomId) => ({
                url: `/rooms/delete/${roomId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['MyRooms', 'Rooms']
        }),

        getCities: builder.query({
            query: () => '/rooms/cities/list',
            providesTags: ['Cities']
        }),

        getRoomsByCity: builder.query({
            query: ({ cityName, checkInDate, checkOutDate }) => ({
                url: '/rooms',
                params: {
                    isActive: 'true',
                    city: cityName,
                    ...(checkInDate && { checkInDate }),
                    ...(checkOutDate && { checkOutDate })
                }
            }),
            providesTags: (result, error, arg) => [{ type: 'Rooms', id: `CITY_${arg.cityName}` }]
        }),

        // ============= BOOKINGS ENDPOINTS =============
        createRazorpayOrder: builder.mutation({
            query: (payload) => ({
                url: '/bookings/razorpay/order',
                method: 'POST',
                body: payload
            })
        }),

        verifyRazorpayPayment: builder.mutation({
            query: (payload) => ({
                url: '/bookings/razorpay/verify',
                method: 'POST',
                body: {
                    razorpay_order_id: payload.razorpay_order_id,
                    razorpay_payment_id: payload.razorpay_payment_id,
                    razorpay_signature: payload.razorpay_signature
                }
            }),
            invalidatesTags: ['MyBookings', 'BookedProperties', 'HostEarnings']
        }),

        getMyBookings: builder.query({
            query: () => '/bookings',
            providesTags: ['MyBookings']
        }),

        getBookedProperties: builder.query({
            query: () => '/bookings/booked-list',
            providesTags: ['BookedProperties']
        }),

        getHostEarnings: builder.query({
            query: () => '/bookings/host-earnings',
            providesTags: ['HostEarnings']
        }),

        cancelBooking: builder.mutation({
            query: (bookingId) => ({
                url: `/bookings/${bookingId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['MyBookings', 'BookedProperties', 'HostEarnings']
        }),

        // ============= REVIEWS ENDPOINTS =============
        submitReview: builder.mutation({
            query: ({ roomId, rating, comment }) => ({
                url: '/bookings/reviews/submit',
                method: 'POST',
                body: { roomId, rating, comment }
            }),
            invalidatesTags: ['Reviews', 'MyBookings']
        }),

        checkUserReviewStatus: builder.query({
            query: (roomId) => `/bookings/reviews/status/${roomId}`,
            providesTags: (result, error, roomId) => [{ type: 'Reviews', id: roomId }]
        }),

        // ============= PROFILE ENDPOINTS =============
        updateProfile: builder.mutation({
            query: (payload) => ({
                url: '/auth/profile',
                method: 'PUT',
                body: payload
            }),
            transformResponse: (response) => response.user,
            invalidatesTags: ['User']
        }),

        becomeOwner: builder.mutation({
            query: () => ({
                url: '/auth/become-owner',
                method: 'POST'
            }),
            transformResponse: (response) => response.user,
            invalidatesTags: ['User']
        }),

        // ============= WISHLIST ENDPOINTS =============
        getWishlist: builder.query({
            query: () => '/auth/wishlist',
            providesTags: ['Wishlist']
        }),

        toggleWishlist: builder.mutation({
            query: (roomId) => ({
                url: `/auth/wishlist/${roomId}`,
                method: 'POST'
            }),
            invalidatesTags: ['Wishlist']
        }),

        // ============= ADDRESS ENDPOINTS =============
        reverseGeocodeAddress: builder.query({
            query: ({ latitude, longitude }) => ({
                url: '/address/reverse-geocode',
                params: { lat: latitude, lng: longitude }
            }),
            providesTags: ['Address']
        }),

        // ============= CONFIG ENDPOINTS =============
        getAppConfig: builder.query({
            query: () => '/config',
            providesTags: ['Config']
        })
    })
});

// Export hooks for all endpoints
export const {
    // Auth
    useLoginMutation,
    useRegisterMutation,
    useGetCurrentUserQuery,
    useLogoutMutation,
    // Rooms
    useGetPublicRoomsQuery,
    useGetPublicRoomsByTypeQuery,
    useGetRoomByIdQuery,
    useGetMyRoomsQuery,
    useCreateRoomMutation,
    useUpdateRoomMutation,
    useDeleteRoomMutation,
    useGetCitiesQuery,
    useGetRoomsByCityQuery,
    // Bookings
    useCreateRazorpayOrderMutation,
    useVerifyRazorpayPaymentMutation,
    useGetMyBookingsQuery,
    useGetBookedPropertiesQuery,
    useGetHostEarningsQuery,
    useCancelBookingMutation,
    // Reviews
    useSubmitReviewMutation,
    useCheckUserReviewStatusQuery,
    // Profile
    useUpdateProfileMutation,
        useBecomeOwnerMutation,
    // Wishlist
    useGetWishlistQuery,
    useToggleWishlistMutation,
    // Address
    useReverseGeocodeAddressQuery,
    // Config
    useGetAppConfigQuery
} = apiSlice;
