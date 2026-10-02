import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';

const CustomerOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading message="Đang kiểm tra quyền truy cập..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'CUSTOMER') {
    return <Navigate to="/vehicles" replace />;
  }

  return children;
};

export default CustomerOnlyRoute;
