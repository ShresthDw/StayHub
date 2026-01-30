import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearFilters, setCurrentUser, setTheme } from '../store/appSlice.js';
import { useLogoutMutation } from '../api/apiSlice.js';

const UserMenu = ({ currentUser, icons }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { theme } = useSelector((state) => state.app);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const [logout] = useLogoutMutation();
    const displayName = currentUser?.name
        ? `${currentUser.name.charAt(0).toUpperCase()}${currentUser.name.slice(1)}`
        : 'User';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout().unwrap();
        } catch (err) {
            console.error('Logout failed:', err);
        }
        dispatch(clearFilters());
        dispatch(setCurrentUser(null));
        setIsOpen(false);
        navigate('/');
    };

    const handleEditProfile = () => {
        navigate('/profile');
        setIsOpen(false);
    };

    const handleViewEarnings = () => {
        navigate('/earnings');
        setIsOpen(false);
    };

    const handleViewBookings = () => {
        navigate('/bookings');
        setIsOpen(false);
    };

    const handleViewWishlist = () => {
        navigate('/wishlist');
        setIsOpen(false);
    };

    const handleViewMyBookings = () => {
        navigate('/my-bookings');
        setIsOpen(false);
    };

    const handleThemeToggle = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        dispatch(setTheme(nextTheme));
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 text-gray-700 shadow-sm hover:border-teal-300 hover:bg-teal-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-all"
                title={currentUser?.name}
            >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-900/60 dark:text-teal-200">
                    {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-24 truncate text-sm font-semibold sm:block">{displayName}</span>
            </button>

            {isOpen && (
                <div className="user-menu-panel absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-900/10 z-50 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center gap-3 bg-gradient-to-br from-teal-50 to-cyan-50 p-4 dark:from-teal-900/40 dark:to-cyan-900/30">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-lg font-bold text-white shadow-sm">
                            {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{displayName}</p>
                            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-1 p-2">
                        <button
                            onClick={handleEditProfile}
                            className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-gray-700 dark:hover:text-teal-300 transition-colors flex items-center gap-3"
                        >
                            {icons.edit}
                            <span>Edit Profile</span>
                        </button>

                        <button
                            onClick={handleViewWishlist}
                            className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-gray-700 dark:hover:text-teal-300 transition-colors flex items-center gap-3"
                        >
                            {icons.heart}
                            <span>Wishlist</span>
                        </button>

                        <button
                            onClick={handleViewMyBookings}
                            className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-gray-700 dark:hover:text-teal-300 transition-colors flex items-center gap-3"
                        >
                            {icons.calendar}
                            <span>My Bookings</span>
                        </button>

                        {currentUser?.role === 'owner' && (
                            <>
                                <button
                                    onClick={handleViewEarnings}
                                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-gray-700 dark:hover:text-teal-300 transition-colors flex items-center gap-3"
                                >
                                    {icons.trending}
                                    <span>View Earnings</span>
                                </button>
                                <button
                                    onClick={handleViewBookings}
                                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-gray-700 dark:hover:text-teal-300 transition-colors flex items-center gap-3"
                                >
                                    {icons.briefcase}
                                    <span>View Bookings</span>
                                </button>
                            </>
                        )}

                        <button
                            onClick={handleThemeToggle}
                            className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-gray-700 dark:hover:text-teal-300 transition-colors flex items-center gap-3">
                            {theme === 'dark' ? icons.sun : icons.moon}
                            <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full rounded-xl border-t border-gray-100 px-3 pb-2 pt-3 text-left text-sm text-red-600 dark:border-gray-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3">
                            {icons.logout}
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
