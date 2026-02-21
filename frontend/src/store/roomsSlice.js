import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // UI state only - actual data managed by RTK Query
    categoryPagination: {
        apartment: { page: 1, hasMore: true },
        house: { page: 1, hasMore: true },
        resort: { page: 1, hasMore: true },
        villa: { page: 1, hasMore: true },
        hotel: { page: 1, hasMore: true },
        cottage: { page: 1, hasMore: true },
        hostel: { page: 1, hasMore: true }
    }
};

const roomsSlice = createSlice({
    name: 'rooms',
    initialState,
    reducers: {
        resetCategoryPage: (state, action) => {
            const category = action.payload;
            if (state.categoryPagination[category]) {
                state.categoryPagination[category].page = 1;
                state.categoryPagination[category].hasMore = true;
            }
        },
        incrementCategoryPage: (state, action) => {
            const category = action.payload;
            if (state.categoryPagination[category]) {
                state.categoryPagination[category].page += 1;
            }
        },
        setCategoryHasMore: (state, action) => {
            const { category, hasMore } = action.payload;
            if (state.categoryPagination[category]) {
                state.categoryPagination[category].hasMore = hasMore;
            }
        }
    }
});

export const { resetCategoryPage, incrementCategoryPage, setCategoryHasMore } = roomsSlice.actions;
export default roomsSlice.reducer;
