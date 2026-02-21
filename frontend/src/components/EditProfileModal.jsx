import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import InputField from './InputField.jsx';
import Toast from './Toast.jsx';
import { updateProfile } from '../features/profile/services/profileService.js';
import { setCurrentUser } from '../store/appSlice.js';

const EditProfileModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const { currentUser } = useSelector((state) => state.app);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [msgType, setMsgType] = useState('success');

    useEffect(() => {
        if (isOpen && currentUser) {
            setFormData({
                name: currentUser.name || '',
                phone: currentUser.phone || '',
                newPassword: '',
                confirmPassword: ''
            });
            setMessage('');
        }
    }, [isOpen, currentUser]);

    const showMessage = (text, type = 'success') => {
        setMessage(text);
        setMsgType(type);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (formData.newPassword && formData.newPassword.length < 6) {
            showMessage('New password must be at least 6 characters.', 'error');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            showMessage('Password confirmation does not match.', 'error');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const updated = await updateProfile({
                name: formData.name,
                phone: formData.phone,
                newPassword: formData.newPassword || undefined
            });
            dispatch(setCurrentUser(updated));
            setFormData((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
            showMessage('Profile updated successfully.', 'success');
            setTimeout(() => onClose(), 1500);
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Failed to update profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Edit Profile</h2>
                {message && <div className="mb-4"><Toast message={message} type={msgType} /></div>}

                <form onSubmit={handleSave} className="space-y-4">
                    <InputField
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <InputField
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        required={false}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <InputField
                        label="Email Address"
                        name="email"
                        type="email"
                        value={currentUser?.email}
                        readOnly={true}
                    />

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Change Password</p>
                        <InputField
                            label="New Password"
                            name="newPassword"
                            type="password"
                            required={false}
                            placeholder="Leave blank to keep current"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        />
                        <InputField
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            required={false}
                            placeholder="Re-enter new password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                                saving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            {saving ? 'Saving…' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
