import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearFilters, setTheme } from '../store/appSlice.js';
import { useLogoutMutation } from '../api/apiSlice.js';

const UserMenu = ({ currentUser, icons }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { theme } = useSelector((state) => state.app);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(clearFilters());
        dispatch(useLogoutMutation());
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
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={currentUser?.name}
            >
                {icons.user}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                    <div className="py-2 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
                        <div  className=" p-2 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 ">
                             {icons.user}
                        </div>
                        <div className="px-4 py-1 flex flex-col justify-center">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currentUser?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{currentUser?.email}</p>
                        </div>
                    </div>

                    <div className="py-2">
                        <button
                            onClick={handleEditProfile}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                            {icons.edit}
                            <span>Edit Profile</span>
                        </button>

                        <button
                            onClick={handleViewWishlist}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                            {icons.heart}
                            <span>Wishlist</span>
                        </button>

                        <button
                            onClick={handleViewMyBookings}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                            {icons.calendar}
                            <span>My Bookings</span>
                        </button>

                        {currentUser?.role === 'owner' && (
                            <>
                                <button
                                    onClick={handleViewEarnings}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                >
                                    {icons.trending}
                                    <span>View Earnings</span>
                                </button>
                                <button
                                    onClick={handleViewBookings}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                >
                                    {icons.briefcase}
                                    <span>View Bookings</span>
                                </button>
                            </>
                        )}

                        <button
                            onClick={handleThemeToggle}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                            {theme === 'dark' ? icons.sun : icons.moon}
                            <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 flex items-center gap-2">
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
