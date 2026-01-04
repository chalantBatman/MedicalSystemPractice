import { Navigate } from "react-router-dom";
import { useAuth } from "./auth";

export function RequireAuth({ children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="container">
        <p className="muted">Checking session...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireRole({ roles, children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="container">
        <p className="muted">Checking session...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/login" replace />;

  return children;
}
