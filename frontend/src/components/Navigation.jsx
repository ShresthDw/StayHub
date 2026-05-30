import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useBecomeOwnerMutation } from '../features/profile/services/profileService.js';
import { setCurrentUser } from '../store/appSlice.js';
import UserMenu from './UserMenu.jsx';
import NotificationBell from '../features/notifications/components/NotificationBell.jsx';
import BrandLogo from './BrandLogo.jsx';

const Navigation = ({ currentUser, icons }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [upgrading, setUpgrading] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const isHomePage = location.pathname === '/';
    const isTransparent = isHomePage && !isScrolled;

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [becomeOwner] = useBecomeOwnerMutation();

    const handleHostProperty = async () => {
        if (!currentUser) {
            navigate('/login', { state: { message: 'Login to start hosting properties.', messageType: 'success' } });
            return;
        }

        if (currentUser.role === 'owner') {
            navigate('/my-properties');
            return;
        }

        setUpgrading(true);
        try {
            const res = await becomeOwner().unwrap();
            const updated = res || res.user || res.data || res;
            dispatch(setCurrentUser(updated));
            navigate('/my-properties');
        } catch (err) {
            console.error('Host Property Error:', err);
            alert(err.response?.data?.msg || 'Unable to enable hosting right now.');
        } finally {
            setUpgrading(false);
        }
    };

    return (
        <header
            className={`sticky top-0 z-40 transition-all duration-300 ease-in-out ${
                isTransparent
                    ? 'bg-transparent text-white border-b border-transparent shadow-none'
                    : 'bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 shadow-sm'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-11 sm:h-12">
                    <Link to="/" className="cursor-pointer transition-transform duration-200 active:scale-95">
                        <BrandLogo isTransparent={isTransparent} />
                    </Link>
                    <nav className="flex items-center space-x-2 relative">

                        {currentUser?.role === 'owner' ? (
                            <button
                                type="button"
                                onClick={() => navigate('/my-properties')}
                                className={`h-8 px-3.5 text-xs font-semibold rounded-full transition-all duration-200 inline-flex items-center justify-center gap-1.5 active:scale-95 ${
                                    isTransparent
                                        ? 'bg-transparent text-white border border-white/80 hover:bg-white/15'
                                        : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-sm'
                                }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>List Property</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleHostProperty}
                                disabled={upgrading}
                                className={`h-8 px-3.5 text-xs font-semibold rounded-full transition-all duration-200 inline-flex items-center justify-center active:scale-95 ${
                                    upgrading
                                        ? 'bg-teal-400 text-white'
                                        : isTransparent
                                        ? 'bg-transparent text-white border border-white/80 hover:bg-white/15'
                                        : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-sm'
                                }`}
                            >
                                {upgrading ? 'Enabling…' : 'Host Property'}
                            </button>
                        )}

                        {currentUser && (
                            <NotificationBell currentUser={currentUser} isTransparent={isTransparent} />
                        )}

                        {currentUser ? (
                            <UserMenu currentUser={currentUser} icons={icons} isTransparent={isTransparent} />
                        ) : (
                            <Link
                                to="/login"
                                className={`h-8 px-3.5 text-xs font-semibold rounded-full transition-all duration-200 inline-flex items-center justify-center active:scale-95 ${
                                    isTransparent
                                        ? 'bg-transparent text-white border border-white/80 hover:bg-white/15'
                                        : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-sm'
                                }`}
                            >
                                Login
                            </Link>
                        )}
                        
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Navigation;
