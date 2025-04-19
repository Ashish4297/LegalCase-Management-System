import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const location = useLocation();
  const currentUser = getCurrentUser();
  const token = localStorage.getItem('token');

  if (!token || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect clients to their default page if they try to access unauthorized routes
    if (currentUser.role === 'client') {
      return <Navigate to="/cases" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export default PrivateRoute;