import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import appReducer from './appSlice.js';
import roomsReducer from './roomsSlice.js';
import { apiSlice } from '../api/apiSlice.js';

export const store = configureStore({
    reducer: {
        app: appReducer,
        rooms: roomsReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware)
});

// Enable refetchOnFocus and refetchOnReconnect behaviors
setupListeners(store.dispatch);
