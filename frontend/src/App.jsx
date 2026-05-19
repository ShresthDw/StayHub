import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import { icons } from './constants.jsx';
import NavigationComponent from './components/Navigation.jsx';
import { AppSkeleton } from './components/Skeletons.jsx';
import Footer from './components/Footer.jsx';
import AuthPageView from './features/auth/pages/AuthPage.jsx';
import HomePageView from './features/rooms/pages/HomePage.jsx';
import CityListingPageView from './features/rooms/pages/CityListingPage.jsx';
import EarningsPageView from './features/bookings/pages/EarningsPage.jsx';
import MyBookingsPageView from './features/bookings/pages/MyBookingsPage.jsx';
import WishlistPageView from './features/wishlist/pages/WishlistPage.jsx';
import MyPropertiesPageView from './features/rooms/pages/MyPropertiesPage.jsx';
import AddRoomPage from './features/rooms/pages/AddRoomPage.jsx';
import ProfilePageView from './features/profile/pages/ProfilePage.jsx';
import RoomDetailsPageView from './features/rooms/pages/RoomDetailsPageView.jsx';
import NotificationsPageView from './features/notifications/pages/NotificationsPage.jsx';
import NotificationToast from './features/notifications/components/NotificationToast.jsx';
import useNotificationSocket from './features/notifications/hooks/useNotificationSocket.js';
import {
    clearFilters,
    setFilters,
    setTheme,
    setCurrentUser,
    setGeoApiKey,
    setRazorpayKeyId,
    setIsLoading
} from './store/appSlice.js';
import {
    useGetCurrentUserQuery,
    useGetAppConfigQuery,
    useLogoutMutation
} from './api/apiSlice.js';

const App = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, theme, isLoading, filters, geoApiKey, razorpayKeyId } = useSelector((state) => state.app);

    // RTK Query hooks for initialization
    const { data: configData, error: configError } = useGetAppConfigQuery();
    const { data: userData, error: userError } = useGetCurrentUserQuery();
    const [logout] = useLogoutMutation();

    // Real-time WebSocket connection & live notification toasts
    const { liveNotification, clearLiveNotification } = useNotificationSocket();

    // Initialize app on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        dispatch(setTheme(savedTheme));

        if (configData) {
            dispatch(setGeoApiKey(configData.geoApiKey || null));
            dispatch(setRazorpayKeyId(configData.razorpayKeyId || null));
        }

        const configSettled = configData !== undefined || !!configError;
        const userSettled = userData !== undefined || !!userError;

        if (userData) {
            dispatch(setCurrentUser(userData));
        } else if (userError) {
            dispatch(setCurrentUser(null));
        }

        if (configSettled && userSettled) {
            dispatch(setIsLoading(false));
        }
    }, [configData, configError, userData, userError, dispatch]);

    const handleQuickFilterSelect = (patch) => {
        dispatch(setFilters({ ...filters, ...patch }));
        navigate('/');
    };

    const handleLogout = async () => {
        try {
            await logout().unwrap();
        } catch (err) {
            console.error('Logout failed:', err);
        }
        dispatch(clearFilters());
        dispatch(setCurrentUser(null));
        navigate('/');
    };

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        dispatch(setTheme(next));
    };

    if (isLoading) {
        return <AppSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <NavigationComponent
                currentUser={currentUser}
                icons={icons}
                filters={filters}
                onQuickFilterSelect={handleQuickFilterSelect}
            />

            <NotificationToast
                notification={liveNotification}
                onClose={clearLiveNotification}
            />

            <Routes>
                <Route path="/" element={<HomePageView />} />
                <Route path="/cities/:city" element={<CityListingPageView />} />
                <Route path="/rooms/:roomId" element={<RoomDetailsPageView />} />

                <Route element={<PublicRoute currentUser={currentUser} />}>
                    <Route path="/login" element={<AuthPageView mode="login" />} />
                    <Route path="/signup" element={<AuthPageView mode="signup" />} />
                </Route>

                <Route element={<ProtectedRoute currentUser={currentUser} requireOwner={true} />}>
                    <Route path="/my-properties" element={<MyPropertiesPageView />} />
                    <Route path="/dashboard" element={<MyPropertiesPageView />} />
                    <Route path="/add-property" element={<AddRoomPage />} />
                </Route>

                <Route element={<ProtectedRoute currentUser={currentUser} />}>
                    <Route path="/profile" element={<ProfilePageView onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />} />
                    <Route path="/profile/edit" element={<Navigate to="/profile" replace />} />
                    <Route path="/notifications" element={<NotificationsPageView />} />
                    <Route path="/my-bookings" element={<MyBookingsPageView />} />
                    <Route path="/wishlist" element={<WishlistPageView />} />
                    <Route path="/earnings" element={<EarningsPageView />} />
                    <Route path="/bookings" element={<Navigate to="/earnings" replace />} />
                    <Route path="/booked-properties" element={<Navigate to="/earnings" replace />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Footer />
        </div>
    );
};

export default App;

