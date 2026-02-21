// RTK Query hooks for rooms
export {
    useGetPublicRoomsQuery,
    useGetPublicRoomsByTypeQuery,
    useGetRoomByIdQuery,
    useGetMyRoomsQuery,
    useCreateRoomMutation,
    useUpdateRoomMutation,
    useDeleteRoomMutation,
    useGetCitiesQuery,
    useGetRoomsByCityQuery
} from '../../../api/apiSlice.js';

// Direct async functions for use in event handlers (not through RTK Query)
export const createRoom = async (roomData) => {
    try {
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': localStorage.getItem('userId') || ''
            },
            body: JSON.stringify(roomData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Failed to create room');
        }
        return await response.json();
    } catch (err) {
        console.error('Create room error:', err);
        throw err;
    }
};

export const updateRoom = async (roomId, roomData) => {
    try {
        const response = await fetch(`/api/rooms/${roomId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': localStorage.getItem('userId') || ''
            },
            body: JSON.stringify(roomData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Failed to update room');
        }
        return await response.json();
    } catch (err) {
        console.error('Update room error:', err);
        throw err;
    }
};

export const deleteRoom = async (roomId) => {
    try {
        const response = await fetch(`/api/rooms/${roomId}`, {
            method: 'DELETE',
            headers: {
                'x-user-id': localStorage.getItem('userId') || ''
            }
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Failed to delete room');
        }
        return await response.json();
    } catch (err) {
        console.error('Delete room error:', err);
        throw err;
    }
};

export const getRoomById = async (roomId) => {
    try {
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) throw new Error('Failed to fetch room');
        return await response.json();
    } catch (err) {
        console.error('Get room error:', err);
        throw err;
    }
};