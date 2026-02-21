import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import InputField from '../../../components/InputField.jsx';
import Toast from '../../../components/Toast.jsx';
import { FormSkeleton } from '../../../components/Skeletons.jsx';
import { useLoginMutation, useRegisterMutation } from '../services/authService.js';
import { setCurrentUser } from '../../../store/appSlice.js';

const AuthPage = ({ mode }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const isLoginMode = mode === 'login';

    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
    const [role, setRole] = useState('guest');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(location.state?.message || '');
    const [msgType, setMsgType] = useState(location.state?.messageType || 'success');

    // RTK Query mutations
    const [loginMutation] = useLoginMutation();
    const [registerMutation] = useRegisterMutation();

    const title = useMemo(() => (isLoginMode ? 'Login to StayHub' : 'Create Your StayHub Account'), [isLoginMode]);

    const showMsg = (text, type = 'error') => {
        setMessage(text);
        setMsgType(type);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const payload = isLoginMode
            ? { email: formData.email, password: formData.password }
            : { ...formData, role };

        try {
            const response = isLoginMode 
                ? await loginMutation(payload).unwrap()
                : await registerMutation(payload).unwrap();

            if (isLoginMode) {
                dispatch(setCurrentUser(response.user));
                navigate('/');
                return;
            }

            const info = response.user.role === 'owner' && !response.user.verified
                ? 'Host signup successful. Your account is pending verification.'
                : 'Signup successful. Please login to continue.';

            navigate('/login', { state: { message: info, messageType: 'success' } });
        } catch (err) {
            showMsg(err?.data?.msg || err?.userMessage || 'Authentication failed. Please try again.');
            console.error('Auth Page Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <FormSkeleton />;
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">{title}</h2>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
                    {isLoginMode ? 'Welcome back. Continue your room search.' : 'Sign up as a traveler or host to get started.'}
                </p>

                <div className="mt-6 flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <Link to="/login" className={`flex-1 py-2 rounded-md text-center text-sm font-medium ${isLoginMode ? 'bg-white dark:bg-gray-800 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300'}`}>
                        Login
                    </Link>
                    <Link to="/signup" className={`flex-1 py-2 rounded-md text-center text-sm font-medium ${!isLoginMode ? 'bg-white dark:bg-gray-800 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300'}`}>
                        Signup
                    </Link>
                </div>

                {message && <div className="mt-4"><Toast message={message} type={msgType} /></div>}

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {!isLoginMode && (
                        <>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Register as:</p>
                            <div className="flex space-x-4">
                                <label className="flex items-center"><input type="radio" name="role" value="guest" checked={role === 'guest'} onChange={() => setRole('guest')} className="h-4 w-4 text-indigo-600" /><span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Traveler</span></label>
                                <label className="flex items-center"><input type="radio" name="role" value="owner" checked={role === 'owner'} onChange={() => setRole('owner')} className="h-4 w-4 text-indigo-600" /><span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Host</span></label>
                            </div>
                            <InputField label="Full Name" name="name" placeholder="Enter full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            <InputField label="Phone Number" name="phone" type="tel" required={false} placeholder="Enter phone number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </>
                    )}

                    <InputField label="Email" name="email" type="email" placeholder="Enter your email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    <InputField label="Password" name="password" type="password" placeholder={isLoginMode ? 'Enter password' : 'Create password (min 6 chars)'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />

                    <button type="submit" disabled={loading} className={`w-full py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                        {loading ? 'Please wait…' : (isLoginMode ? 'Login' : 'Create Account')}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-5">
                    {isLoginMode ? 'New to StayHub?' : 'Already have an account?'}{' '}
                    <Link to={isLoginMode ? '/signup' : '/login'} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                        {isLoginMode ? 'Signup here' : 'Login here'}
                    </Link>
                </p>
            </div>
        </main>
    );
};

export default AuthPage;
