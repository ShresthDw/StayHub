import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ currentUser, requireOwner = false, requireVerifiedOwner = false }) => {
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
