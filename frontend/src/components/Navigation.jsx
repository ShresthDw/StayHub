import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useBecomeOwnerMutation } from '../features/profile/services/profileService.js';
import { setCurrentUser } from '../store/appSlice.js';
import UserMenu from './UserMenu.jsx';
import NotificationBell from '../features/notifications/components/NotificationBell.jsx';
import BrandLogo from './BrandLogo.jsx';

const Navigation = ({ currentUser, icons }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [upgrading, setUpgrading] = useState(false);

    const [becomeOwner] = useBecomeOwnerMutation();

    const handleHostProperty = async () => {
        if (!currentUser) {
            navigate('/login', { state: { message: 'Login to start hosting properties.', messageType: 'success' } });
            return;
        }

        if (currentUser.role === 'owner') {
            navigate('/add-property');
            return;
        }

        setUpgrading(true);
        try {
            const res = await becomeOwner().unwrap();
            const updated = res || res.user || res.data || res;
            dispatch(setCurrentUser(updated));
            navigate('/add-property');
        } catch (err) {
            console.error('Host Property Error:', err);
            alert(err.response?.data?.msg || 'Unable to enable hosting right now.');
        } finally {
            setUpgrading(false);
        }
    };

    return (
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="text-teal-700 dark:text-teal-300 cursor-pointer">
                        <BrandLogo />
                    </Link>
                    <nav className="flex items-center space-x-3 relative">

                        {currentUser?.role === 'owner' ? (
                            <button
                                type="button"
                                onClick={() => navigate('/add-property')}
                                className="px-4 py-2 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-sm transition-all flex items-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>List Property</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleHostProperty}
                                disabled={upgrading}
                                className={`px-4 py-2 text-sm font-semibold text-white rounded-full shadow-sm transition-all ${upgrading ? 'bg-teal-400' : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'}`}
                            >
                                {upgrading ? 'Enabling…' : 'Host Property'}
                            </button>
                        )}

                        {currentUser && (
                            <NotificationBell currentUser={currentUser} />
                        )}

                        {currentUser ? (
                            <UserMenu currentUser={currentUser} icons={icons} />
                        ) : (
                            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-sm transition-all">Login</Link>
                        )}
                        
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Navigation;
