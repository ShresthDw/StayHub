import { Navigate, Outlet } from 'react-router-dom';
import { PageSkeleton } from './Skeletons.jsx';

const ProtectedRoute = ({ currentUser, isAuthLoading = false, requireOwner = false, requireVerifiedOwner = false }) => {
    // If auth state is still resolving and a user session exists in storage, hold with skeleton
    if (isAuthLoading && !currentUser && localStorage.getItem('userId')) {
        return <PageSkeleton />;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (requireOwner && currentUser.role !== 'owner') {
        return <Navigate to="/" replace />;
    }

    if (requireVerifiedOwner && (currentUser.role !== 'owner' || !currentUser.verified)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
