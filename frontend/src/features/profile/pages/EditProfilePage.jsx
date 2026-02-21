import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import InputField from '../../../components/InputField.jsx';
import Toast from '../../../components/Toast.jsx';
import { updateProfile } from '../services/profileService.js';
import { setCurrentUser } from '../../../store/appSlice.js';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';

const EditProfilePage = () => {
    const navigate = useNavigate();
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
        if (currentUser) {
            setFormData({
                name: currentUser.name || '',
                phone: currentUser.phone || '',
                newPassword: '',
                confirmPassword: ''
            });
        }
    }, [currentUser]);

    if (!currentUser) {
        return <ProfileSkeleton />;
    }

    const showMessage = (text, type = 'success') => {
        setMessage(text);
        setMsgType(type);
        setTimeout(() => setMessage(''), 3000);
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
            setTimeout(() => navigate('/profile'), 1500);
        } catch (err) {
            showMessage(err.response?.data?.msg || 'Failed to update profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <button
                    onClick={() => navigate('/profile')}
                    className="mb-4 text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                >
                    ← Back to Profile
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Profile</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Update your personal information and password.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                {message && <div className="mb-6"><Toast message={message} type={msgType} /></div>}

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Personal Information</h3>
                        <div className="space-y-4">
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
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Change Password</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Leave blank to keep your current password.</p>
                        <div className="space-y-4">
                            <InputField
                                label="New Password"
                                name="newPassword"
                                type="password"
                                required={false}
                                placeholder="Enter new password"
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
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => navigate('/profile')}
                            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-6 py-2 text-sm font-medium text-white rounded-md ${
                                saving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            {saving ? 'Saving…' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default EditProfilePage;
