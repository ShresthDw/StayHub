import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import InputField from '../../../components/InputField.jsx';
import Toast from '../../../components/Toast.jsx';
import BackButton from '../../../components/BackButton.jsx';
import { FormSkeleton } from '../../../components/Skeletons.jsx';
import { useLoginMutation, useRegisterMutation, useGoogleAuthMutation } from '../services/authService.js';
import { setCurrentUser } from '../../../store/appSlice.js';

const AuthPage = ({ mode }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useSelector((state) => state.app);
    const isLoginMode = mode === 'login';

    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
    const [role, setRole] = useState('guest');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(location.state?.message || '');
    const [msgType, setMsgType] = useState(location.state?.messageType || 'success');

    // RTK Query mutations
    const [loginMutation] = useLoginMutation();
    const [registerMutation] = useRegisterMutation();
    const [googleAuthMutation] = useGoogleAuthMutation();

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

    const handleGoogleSuccess = async (credentialResponse) => {
        if (!credentialResponse?.credential) {
            showMsg('No credential received from Google.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await googleAuthMutation({
                credential: credentialResponse.credential,
                role: isLoginMode ? undefined : role
            }).unwrap();

            dispatch(setCurrentUser(response.user));
            navigate('/');
        } catch (err) {
            showMsg(err?.data?.msg || err?.userMessage || 'Google Sign-In failed. Please try again.');
            console.error('Google Sign-In Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        showMsg('Google Sign-In could not be completed. Please try again or use standard login.');
    };

    if (loading) {
        return <FormSkeleton />;
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-10">
            <div className="max-w-md mx-auto">
                <BackButton to="/" label="Back to Home" className="mb-2.5" />
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/60 p-6 sm:p-8 animate-scroll-reveal">
                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">{title}</h2>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
                        {isLoginMode ? 'Welcome back. Continue your room search.' : 'Sign up as a traveler or host to get started.'}
                    </p>

                    <div className="mt-6 flex bg-gray-100 dark:bg-gray-700/70 rounded-xl p-1">
                        <Link to="/login" className={`flex-1 py-2 rounded-lg text-center text-sm font-semibold transition-all ${isLoginMode ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-700 dark:text-teal-300' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}>
                            Login
                        </Link>
                        <Link to="/signup" className={`flex-1 py-2 rounded-lg text-center text-sm font-semibold transition-all ${!isLoginMode ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-700 dark:text-teal-300' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}>
                            Signup
                        </Link>
                    </div>

                    {message && <div className="mt-4"><Toast message={message} type={msgType} /></div>}

                    {/* Google OAuth Section */}
                    <div className="mt-6">
                        <div className="flex justify-center w-full min-h-[44px]">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme={theme === 'dark' ? 'filled_black' : 'outline'}
                                size="large"
                                shape="pill"
                                text={isLoginMode ? 'signin_with' : 'signup_with'}
                                width="100%"
                            />
                        </div>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-gray-800 px-3 text-gray-500 dark:text-gray-400 font-medium">
                                    Or continue with email
                                </span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLoginMode && (
                            <>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">Register as:</p>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${role === 'guest' ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-semibold' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                                            <input type="radio" name="role" value="guest" checked={role === 'guest'} onChange={() => setRole('guest')} className="text-teal-600 focus:ring-teal-500" />
                                            <span className="text-sm">Traveler</span>
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${role === 'owner' ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-semibold' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                                            <input type="radio" name="role" value="owner" checked={role === 'owner'} onChange={() => setRole('owner')} className="text-teal-600 focus:ring-teal-500" />
                                            <span className="text-sm">Host</span>
                                        </label>
                                    </div>
                                </div>
                                <InputField label="Full Name" name="name" placeholder="Enter full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                <InputField label="Phone Number" name="phone" type="tel" required={false} placeholder="Enter phone number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </>
                        )}

                        <InputField label="Email" name="email" type="email" placeholder="Enter your email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        <InputField label="Password" name="password" type="password" placeholder={isLoginMode ? 'Enter password' : 'Create password (min 6 chars)'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />

                        <button type="submit" disabled={loading} className={`w-full py-2.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white transition-all active:scale-95 ${loading ? 'bg-teal-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-teal-600/20'}`}>
                            {loading ? 'Please wait…' : (isLoginMode ? 'Login with Email' : 'Create Account')}
                        </button>
                    </form>

                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-6">
                        {isLoginMode ? 'New to StayHub?' : 'Already have an account?'}{' '}
                        <Link to={isLoginMode ? '/signup' : '/login'} className="text-teal-700 dark:text-teal-300 font-semibold hover:underline">
                            {isLoginMode ? 'Signup here' : 'Login here'}
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
};

export default AuthPage;
