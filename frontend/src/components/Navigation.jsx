import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useBecomeOwnerMutation } from '../features/profile/services/profileService.js';
import { setCurrentUser } from '../store/appSlice.js';
import UserMenu from './UserMenu.jsx';

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
            navigate('/dashboard');
            return;
        }

        setUpgrading(true);
        try {
            const res = await becomeOwner().unwrap();
            const updated = res || res.user || res.data || res;
            dispatch(setCurrentUser(updated));
            navigate('/dashboard');
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
                    <Link to="/" className="text-2xl font-bold text-gray-800 dark:text-gray-100 cursor-pointer">StayHub</Link>
                    <nav className="flex items-center space-x-3 relative">

                        {currentUser?.role === 'owner' ? (
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="px-4 py-2 text-sm font-medium text-white rounded-full bg-emerald-600 hover:bg-emerald-700"
                            >
                                List Property
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleHostProperty}
                                disabled={upgrading}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-full ${upgrading ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            >
                                {upgrading ? 'Enabling…' : 'Host Property'}
                            </button>
                        )}

                        {currentUser ? (
                            <UserMenu currentUser={currentUser} icons={icons} />
                        ) : (
                            <Link to="/login" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-700">Login</Link>
                        )}
                        
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Navigation;
