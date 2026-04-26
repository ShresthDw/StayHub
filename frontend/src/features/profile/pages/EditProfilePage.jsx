import { Navigate } from 'react-router-dom';

/**
 * EditProfilePage has been consolidated into the unified ProfilePage (/profile).
 * This component redirects any remaining references to /profile.
 */
const EditProfilePage = () => {
    return <Navigate to="/profile" replace />;
};

export default EditProfilePage;
