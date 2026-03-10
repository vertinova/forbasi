import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ allowedRoles, allowedTypes, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role_id) && user.user_type !== 'super_admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedTypes && !allowedTypes.includes(user.user_type)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
