import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  // ✅ WAIT until loading finishes
  if (loading) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  // 🔥 IMPORTANT FIX
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const role = user.role?.toLowerCase();

  if (!role) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;