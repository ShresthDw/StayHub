import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = ({ currentUser }) => {
    if (currentUser) {
        return <Navigate to={currentUser.role === 'owner' && currentUser.verified ? '/dashboard' : '/'} replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
