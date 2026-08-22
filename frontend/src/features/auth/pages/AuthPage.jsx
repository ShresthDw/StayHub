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
                <section className="hidden lg:flex flex-col justify-start self-start space-y-3">
                    <div>
                        <div className="mb-3">
                            <Link to="/" className="inline-flex items-center gap-2 transition-transform duration-200 hover:opacity-90 active:scale-95">
                                <BrandLogo />
                            </Link>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-[32px] font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
                            Find your perfect stay.
                        </h1>
                        <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                            StayHub connects travelers with verified rooms, luxury villas, and comfortable apartments worldwide. Enjoy instant bookings, secure payments, and a seamless hosting experience.
                        </p>
                    </div>

                    {/* Feature Points with Monochrome / Neutral Icons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
                            <div className="h-7 w-7 rounded-md bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 border border-gray-200 dark:border-gray-600">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100">Verified Properties</h2>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">Accurate photos, vetted hosts & upfront pricing.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-2 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
                            <div className="h-7 w-7 rounded-md bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 border border-gray-200 dark:border-gray-600">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100">Instant Booking</h2>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">Fast reservation powered by Razorpay checkout.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-2 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
                            <div className="h-7 w-7 rounded-md bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 border border-gray-200 dark:border-gray-600">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100">Host Dashboard</h2>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">Track earnings, bookings & manage rooms.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-2 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
                            <div className="h-7 w-7 rounded-md bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 border border-gray-200 dark:border-gray-600">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xs font-bold text-gray-900 dark:text-gray-100">Live Updates</h2>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">Real-time status updates.</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-6" aria-hidden="true" />

                    {/* Travel image collage */}
                    <div className="relative mt-0 h-40 w-full" aria-label="StayHub travel destinations">
                        <div className="absolute -right-2 -top-4 h-28 w-28 rounded-full bg-teal-100/60 blur-2xl dark:bg-teal-900/30" />
                        <div className="absolute bottom-0 left-8 h-24 w-36 rounded-full bg-cyan-100/60 blur-2xl dark:bg-cyan-900/20" />
                        <div className="absolute right-5 top-3 z-30 h-10 w-16 text-teal-500/80 dark:text-teal-400/70" aria-hidden="true">
                            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 64 40" fill="none">
                                <path d="M4 25C16 10 28 29 43 17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
                            </svg>
                            <img src="/plane.svg" alt="" className="absolute right-0 top-0 h-5 w-5 -rotate-12 object-contain opacity-80" />
                        </div>
                        <div className="absolute left-4 top-0 z-30 text-[10px] font-semibold italic leading-tight text-gray-600 dark:text-gray-300 -rotate-6">
                            Explore<br />unique stays
                        </div>
                        <svg className="absolute left-12 top-5 z-30 h-12 w-12 rotate-[20deg] text-gray-500 dark:text-gray-400" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                            <path d="M6 8c13 0 22 5 25 17 1 5-1 9-5 12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
                            <path d="m22 35 4 3 1-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <svg className="absolute bottom-0 right-0 z-30 h-12 w-20 text-teal-500/70 dark:text-teal-400/60" viewBox="0 0 64 40" fill="none" aria-hidden="true">
                            <path d="M4 31C17 8 38 12 56 26" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
                            <path d="M56 35s5-4.3 5-9a5 5 0 1 0-10 0c0 4.7 5 9 5 9Z" stroke="currentColor" strokeWidth="1.6" />
                            <circle cx="56" cy="26" r="1.7" fill="currentColor" />
                        </svg>

                        <div className="absolute inset-x-0 bottom-1 h-24">
                            <img
                                src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=420&q=80"
                                alt="Coastal stay"
                                className="absolute bottom-1 left-[9%] z-10 h-24 w-40 -rotate-12 rounded-xl border-4 border-white object-cover shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:-rotate-6 dark:border-gray-700"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=520&q=80"
                                alt="Modern vacation home"
                                className="absolute bottom-0 left-1/2 z-30 h-32 w-52 -translate-x-1/2 rounded-xl border-4 border-white object-cover shadow-xl transition-transform duration-300 hover:-translate-y-2 hover:scale-105 hover:-translate-x-1/2 dark:border-gray-700"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=420&q=80"
                                alt="Bright holiday apartment"
                                className="absolute bottom-1 right-[9%] z-10 h-24 w-40 rotate-12 rounded-xl border-4 border-white object-cover shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:rotate-6 dark:border-gray-700"
                            />
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
