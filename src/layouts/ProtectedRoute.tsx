import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const ProtectedRoute = () => {
    const token = useAuthStore((state) => state.token);
    const location = useLocation();

    if (!token || token.trim() === '') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};
