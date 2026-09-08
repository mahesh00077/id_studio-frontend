import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Frontend guard for Owner-only screens. The Owner's own APIs are additionally
// protected server-side by requireOwner - this just avoids showing the routes
// to non-owners in the first place.
function OwnerRoute({ children }) {
  const { isAuthenticated, loading, isOwner } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default OwnerRoute;