import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const userRole = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    // Redirect to their allowed page if role mismatch
    return <Navigate to={userRole === 'SUPER_ADMIN' ? '/admin' : '/msme'} replace />;
  }

  return children;
}
