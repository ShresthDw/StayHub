// RTK Query hooks for profile
export {
    useUpdateProfileMutation,
    useBecomeOwnerMutation
} from '../../../api/apiSlice.js';

// Direct async function for use in event handlers
export const updateProfile = async (profileData) => {
    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': localStorage.getItem('userId') || ''
            },
            body: JSON.stringify(profileData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Failed to update profile');
        }
        return await response.json();
    } catch (err) {
        console.error('Update profile error:', err);
        throw err;
    }
};