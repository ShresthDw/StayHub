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
import BookingsPageView from './features/bookings/pages/BookingsPage.jsx';
import MyBookingsPageView from './features/bookings/pages/MyBookingsPage.jsx';
import BookedPropertiesPageView from './features/bookings/pages/BookedPropertiesPage.jsx';
import WishlistPageView from './features/wishlist/pages/WishlistPage.jsx';
import OwnerDashboardView from './features/rooms/pages/OwnerDashboard.jsx';
import AddRoomPage from './features/rooms/pages/AddRoomPage.jsx';
import ProfilePageView from './features/profile/pages/ProfilePage.jsx';
import EditProfilePage from './features/profile/pages/EditProfilePage.jsx';
import RoomDetailsPageView from './features/rooms/pages/RoomDetailsPageView.jsx';
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


    // Initialize app on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        dispatch(setTheme(savedTheme));

        if (configData) {
            dispatch(setGeoApiKey(configData.geoApiKey || null));
            dispatch(setRazorpayKeyId(configData.razorpayKeyId || null));
        }

        if (userData) {
            dispatch(setCurrentUser(userData));
        }

        // Mark loading as complete when we have config data or when config query has errored
        // userData may be null/undefined but we still want to proceed
        if (configData !== undefined || configError) {
            dispatch(setIsLoading(false));
        }
    }, [configData, configError, userData, dispatch]);

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

            <Routes>
                <Route path="/" element={<HomePageView />} />
                <Route path="/cities/:city" element={<CityListingPageView />} />
                <Route path="/rooms/:roomId" element={<RoomDetailsPageView />} />

                <Route element={<PublicRoute currentUser={currentUser} />}>
                    <Route path="/login" element={<AuthPageView mode="login" />} />
                    <Route path="/signup" element={<AuthPageView mode="signup" />} />
                </Route>

                <Route element={<ProtectedRoute currentUser={currentUser} requireOwner={true} />}>
                    <Route path="/dashboard" element={<OwnerDashboardView />} />
                    <Route path="/add-property" element={<AddRoomPage />} />
                </Route>

                <Route element={<ProtectedRoute currentUser={currentUser} />}>
                    <Route path="/profile" element={<ProfilePageView onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />} />
                    <Route path="/profile/edit" element={<EditProfilePage />}  />
                    <Route path="/my-bookings" element={<MyBookingsPageView />} />
                    <Route path="/wishlist" element={<WishlistPageView />} />          
                </Route>

                <Route element={<ProtectedRoute currentUser={currentUser} requireOwner={true} />}>
                    <Route path="/earnings" element={<EarningsPageView />} />
                </Route>

                <Route element={<ProtectedRoute currentUser={currentUser} requireOwner={true} />}>
                    <Route path="/bookings" element={<BookingsPageView />} />
                    <Route path="/booked-properties" element={<BookedPropertiesPageView />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Footer />
        </div>
    );
};

export default App;
