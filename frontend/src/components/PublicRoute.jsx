import { Navigate, Outlet } from 'react-router-dom';
import { PageSkeleton } from './Skeletons.jsx';

const PublicRoute = ({ currentUser, isAuthLoading = false }) => {
    if (isAuthLoading && !currentUser && localStorage.getItem('userId')) {
        return <PageSkeleton />;
    }

    if (currentUser) {
        return <Navigate to={currentUser.role === 'owner' && currentUser.verified ? '/dashboard' : '/'} replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
