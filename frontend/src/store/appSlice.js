import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentUser: null,
    theme: 'light',
    geoApiKey: null,
    razorpayKeyId: null,
    isLoading: true,
    filters: { propertyType: '', amenities: [] },
    searchLocation: { address: '', lat: null, lng: null, distance: 10 },
    checkInDate: '',
    checkOutDate: ''
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setCurrentUser(state, action) {
            state.currentUser = action.payload;
        },
        setTheme(state, action) {
            state.theme = action.payload;
            localStorage.setItem('theme', action.payload);
            if (action.payload === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
        setFilters(state, action) {
            state.filters = action.payload;
        },
        setSearchLocation(state, action) {
            state.searchLocation = action.payload;
        },
        setCheckInDate(state, action) {
            state.checkInDate = action.payload;
        },
        setCheckOutDate(state, action) {
            state.checkOutDate = action.payload;
        },
        clearFilters(state) {
            state.filters = { propertyType: '', amenities: [] };
        },
        setGeoApiKey(state, action) {
            state.geoApiKey = action.payload;
        },
        setRazorpayKeyId(state, action) {
            state.razorpayKeyId = action.payload;
        },
        setIsLoading(state, action) {
            state.isLoading = action.payload;
        }
    }
});

export const {
    setCurrentUser,
    setTheme,
    setFilters,
    setSearchLocation,
    setCheckInDate,
    setCheckOutDate,
    clearFilters,
    setGeoApiKey,
    setRazorpayKeyId,
    setIsLoading
} = appSlice.actions;

export default appSlice.reducer;


