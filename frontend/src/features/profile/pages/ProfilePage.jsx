import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ProfileSkeleton } from '../../../components/Skeletons.jsx';

const ProfilePage = ({ onLogout, theme, toggleTheme }) => {
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.app);

    if (!currentUser) {
        return <ProfileSkeleton />;
    }

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="rounded-3xl bg-white dark:bg-gray-800 p-8 shadow-xl">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage your account, theme, and access.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-700 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Name</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{currentUser.name}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-700 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{currentUser.email}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-700 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{currentUser.phone || 'Not set'}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-700 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Role</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">{currentUser.role}</p>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" onClick={() => navigate('/profile/edit')} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                        Edit profile
                    </button>
                    <button type="button" onClick={toggleTheme} className="rounded-full border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                        Switch to {theme === 'dark' ? 'light' : 'dark'} theme
                    </button>
                    <button type="button" onClick={onLogout} className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20">
                        Logout
                    </button>
                </div>
            </div>
        </main>
    );
};

export default ProfilePage;