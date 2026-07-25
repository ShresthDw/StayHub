import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import InputField from '../../../components/InputField.jsx';
import Toast from '../../../components/Toast.jsx';
import BrandLogo from '../../../components/BrandLogo.jsx';
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

    const title = useMemo(() => (isLoginMode ? 'Welcome Back' : 'Create Your Account'), [isLoginMode]);

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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
                {/* Single Vertical Divider Line Between Left & Right Panels (Desktop) */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-700 to-transparent pointer-events-none" />

                {/* LEFT COLUMN: About StayHub Showcase (Visible only on Desktop, hidden on mobile/tablet) */}
                <section className="hidden lg:flex flex-col justify-start self-start space-y-5">
                    <div>
                        <div className="mb-3">
                            <Link to="/" className="inline-flex items-center gap-2 transition-transform duration-200 hover:opacity-90 active:scale-95">
                                <BrandLogo />
                            </Link>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-[36px] font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
                            <span className="text-teal-600 dark:text-teal-400">StayHub</span> — Find your ideal stay or host guests with ease.
                        </h1>
                        <p className="mt-2.5 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                            StayHub connects travelers with verified rooms, luxury villas, and comfortable apartments worldwide. Enjoy instant bookings, secure payments, and a seamless hosting experience.
                        </p>
                    </div>

                    {/* Feature Points with Monochrome / Neutral Icons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                        <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
                            <div className="h-9 w-9 rounded-md bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 border border-gray-200 dark:border-gray-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Verified Properties</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">Accurate photos, vetted hosts & upfront pricing.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
                            <div className="h-9 w-9 rounded-md bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 border border-gray-200 dark:border-gray-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Instant Booking</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">Fast reservation powered by Razorpay checkout.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
                            <div className="h-9 w-9 rounded-md bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 border border-gray-200 dark:border-gray-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Host Dashboard</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">Track earnings, bookings & manage rooms.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
                            <div className="h-9 w-9 rounded-md bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 border border-gray-200 dark:border-gray-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Live Updates</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">Real-time status via WebSocket alerts.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* RIGHT COLUMN: Auth Form */}
                <section className="flex flex-col justify-start max-w-md mx-auto w-full lg:max-w-none">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700/60 p-6 sm:p-8 animate-scroll-reveal relative">
                        {/* Cross Close Icon Inside the Card */}
                        <Link
                            to="/"
                            className="absolute top-5 right-5 sm:top-6 sm:right-6 p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all duration-200 active:scale-95 group"
                            title="Close"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Link>
                        <div className="text-center">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                                {isLoginMode
                                    ? 'Sign in to access your bookings and saved stays.'
                                    : 'Join StayHub today as a traveler or property host.'}
                            </p>
                        </div>

                        {/* Login / Signup Tab Switcher */}
                        <div className="mt-6 flex bg-gray-100 dark:bg-gray-700/70 rounded-lg p-1 shadow-inner">
                            <Link
                                to="/login"
                                className={`flex-1 py-2 rounded-md text-center text-sm font-semibold transition-all duration-200 ${
                                    isLoginMode
                                        ? 'bg-white dark:bg-gray-800 shadow text-teal-700 dark:text-teal-300 scale-[1.01]'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className={`flex-1 py-2 rounded-md text-center text-sm font-semibold transition-all duration-200 ${
                                    !isLoginMode
                                        ? 'bg-white dark:bg-gray-800 shadow text-teal-700 dark:text-teal-300 scale-[1.01]'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
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
                                    <span className="bg-white dark:bg-gray-800 px-3 text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                                        Or continue with email
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Email / Password Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLoginMode && (
                                <>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">
                                            Register as:
                                        </p>
                                        <div className="flex gap-3">
                                            <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-md border cursor-pointer transition-all ${
                                                role === 'guest'
                                                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-semibold shadow-sm'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value="guest"
                                                    checked={role === 'guest'}
                                                    onChange={() => setRole('guest')}
                                                    className="text-teal-600 focus:ring-teal-500"
                                                />
                                                <span className="text-sm">Traveler</span>
                                            </label>

                                            <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-md border cursor-pointer transition-all ${
                                                role === 'owner'
                                                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-semibold shadow-sm'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value="owner"
                                                    checked={role === 'owner'}
                                                    onChange={() => setRole('owner')}
                                                    className="text-teal-600 focus:ring-teal-500"
                                                />
                                                <span className="text-sm">Host</span>
                                            </label>
                                        </div>
                                    </div>

                                    <InputField
                                        label="Full Name"
                                        name="name"
                                        placeholder="e.g. John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <InputField
                                        label="Phone Number"
                                        name="phone"
                                        type="tel"
                                        required={false}
                                        placeholder="e.g. +1 555-0199"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </>
                            )}

                            <InputField
                                label="Email Address"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />

                            <InputField
                                label="Password"
                                name="password"
                                type="password"
                                placeholder={isLoginMode ? 'Enter your password' : 'Create password (min 6 characters)'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-2.5 px-4 rounded-md shadow-sm text-sm font-semibold text-white transition-all active:scale-95 ${
                                    loading
                                        ? 'bg-teal-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-teal-600/25'
                                }`}
                            >
                                {loading ? 'Please wait…' : (isLoginMode ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>

                        <p className="text-xs sm:text-sm text-center text-gray-500 dark:text-gray-400 mt-6">
                            {isLoginMode ? 'New to StayHub?' : 'Already have an account?'}{' '}
                            <Link
                                to={isLoginMode ? '/signup' : '/login'}
                                className="text-teal-700 dark:text-teal-300 font-semibold hover:underline"
                            >
                                {isLoginMode ? 'Create an account' : 'Sign in here'}
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default AuthPage;
