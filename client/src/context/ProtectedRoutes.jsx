import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './UserProvider';

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackPath = "/login",
  showFallback = true,
  loadingComponent = null,
  unauthorizedComponent = null
}) => {
  const {
    isAuthenticated,
    loading,
    hasRole,
    hasPermission,
    user
  } = useUser();
  const location = useLocation();

  // Show loading state
  if (loading) {
    if (loadingComponent) {
      return loadingComponent;
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="loading-spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    if (showFallback) {
      return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }
    return null;
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    if (unauthorizedComponent) {
      return unauthorizedComponent;
    }

    if (showFallback) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Access Denied</h2>
            <p>You don't have the required role to access this page.</p>
            <p>Required: {requiredRoles.join(', ')}</p>
            <p>Your role: {user?.role || 'None'}</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Check permission-based access
  if (requiredPermissions.length > 0 && !requiredPermissions.some(permission => hasPermission(permission))) {
    if (unauthorizedComponent) {
      return unauthorizedComponent;
    }

    if (showFallback) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Insufficient Permissions</h2>
            <p>You don't have the required permissions to access this page.</p>
            <p>Required: {requiredPermissions.join(', ')}</p>
          </div>
        </div>
      );
    }
    return null;
  }

  return children;
};

// Additional specialized route components
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute
    {...props}
    requiredRoles={['admin', 'superadmin']}
    fallbackPath="/admin/login"
  >
    {children}
  </ProtectedRoute>
);

export const ModeratorRoute = ({ children, ...props }) => (
  <ProtectedRoute
    {...props}
    requiredRoles={['admin', 'moderator']}
    requiredPermissions={['moderate_content']}
  >
    {children}
  </ProtectedRoute>
);

export const PremiumRoute = ({ children, ...props }) => (
  <ProtectedRoute
    {...props}
    requiredPermissions={['premium_access']}
  >
    {children}
  </ProtectedRoute>
);

export const PublicRoute = ({ children, requireAuth = false, ...props }) => (
  <ProtectedRoute {...props} requireAuth={requireAuth}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;