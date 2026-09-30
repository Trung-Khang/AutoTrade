import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard kiểm tra đăng nhập và phân quyền (Role-based Access Control)
 * @param {Array<string>} allowedRoles - Danh sách role được phép truy cập (VD: ['ADMIN', 'STAFF'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Chuyển hướng về trang đăng nhập và lưu lại trang đích để redirect sau khi login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user?.role);
    if (!hasRole) {
      // Người dùng không có quyền truy cập trang này
      return (
        <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '32px' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>403 - Không có quyền truy cập</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            Tài khoản của bạn ({user?.role}) không có quyền truy cập vào chức năng này.
          </p>
          <a
            href="/"
            style={{
              padding: '10px 20px',
              backgroundColor: '#1e293b',
              color: '#fff',
              borderRadius: '6px',
              textDecoration: 'none'
            }}
          >
            Quay về Trang chủ
          </a>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
