import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

// Tài khoản mẫu tiện dụng cho việc kiểm thử UI khi Backend chưa hoàn tất bàn giao
export const DEMO_ACCOUNTS = [
  {
    username: 'admin',
    role: 'ADMIN',
    fullName: 'Quản trị viên Hệ thống',
    email: 'admin@autotrade.vn',
    passwordHint: 'admin123',
    description: 'Toàn quyền CRUD quản lý kho xe, đổi trạng thái xe'
  },
  {
    username: 'staff',
    role: 'STAFF',
    fullName: 'Nguyễn Văn Nhân Viên',
    email: 'staff@autotrade.vn',
    passwordHint: 'staff123',
    description: 'Tiếp nhận, tra cứu và cập nhật trạng thái lịch hẹn khách hàng'
  },
  {
    username: 'customer',
    role: 'CUSTOMER',
    fullName: 'Trần Khách Hàng',
    email: 'customer@gmail.com',
    passwordHint: 'customer123',
    description: 'Xem xe, đặt cọc giữ xe, chọn lịch hẹn xem xe và theo dõi đơn cọc'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('autotrade_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('autotrade_token') || null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('autotrade_token', token);
    } else {
      localStorage.removeItem('autotrade_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('autotrade_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('autotrade_user');
    }
  }, [user]);

  // Đăng nhập kết hợp Backend thật và Mock fallback
  const login = async (username, password) => {
    setLoading(true);
    try {
      // 1. Thử gọi API backend (Spring Boot của TV1/TV3)
      const response = await apiClient.post('/auth/login', { username, password });
      const userData = {
        id: response.userId || response.id || 1,
        username: response.username || username,
        fullName: response.fullName || response.name || username,
        email: response.email || `${username}@autotrade.vn`,
        role: response.role ? response.role.toUpperCase() : 'CUSTOMER',
      };
      const authToken = response.token || response.accessToken || 'demo-jwt-token';
      setUser(userData);
      setToken(authToken);
      setLoading(false);
      return { success: true, user: userData, isMock: false };
    } catch (apiError) {
      // 2. Nếu Backend chưa chạy hoặc chưa có endpoint, fallback về mock để TV2 test UI
      console.warn('Backend Auth API chưa sẵn sàng hoặc lỗi kết nối. Chuyển sang chế độ Local Mock Auth.', apiError.message);
      
      const foundDemo = DEMO_ACCOUNTS.find(
        acc => acc.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (foundDemo) {
        const mockUser = {
          id: foundDemo.role === 'ADMIN' ? 1 : foundDemo.role === 'STAFF' ? 2 : 3,
          username: foundDemo.username,
          fullName: foundDemo.fullName,
          email: foundDemo.email,
          role: foundDemo.role
        };
        const mockToken = `mock-jwt-token-${mockUser.role.toLowerCase()}-${Date.now()}`;
        setUser(mockUser);
        setToken(mockToken);
        setLoading(false);
        return { success: true, user: mockUser, isMock: true };
      }

      // Cho phép đăng nhập bất kỳ tài khoản mới như CUSTOMER
      const generalCustomer = {
        id: Date.now(),
        username: username.trim(),
        fullName: username.trim(),
        email: `${username.trim()}@gmail.com`,
        role: 'CUSTOMER'
      };
      setUser(generalCustomer);
      setToken(`mock-token-${Date.now()}`);
      setLoading(false);
      return { success: true, user: generalCustomer, isMock: true };
    }
  };

  // Đăng ký tài khoản
  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', userData);
      setLoading(false);
      return { success: true, data: response, isMock: false };
    } catch (apiError) {
      console.warn('Backend Register API chưa sẵn sàng. Giả lập đăng ký thành công.', apiError.message);
      // Tự động tạo user
      const newUser = {
        id: Date.now(),
        username: userData.username,
        fullName: userData.fullName || userData.username,
        email: userData.email,
        phone: userData.phone,
        role: 'CUSTOMER'
      };
      setLoading(false);
      return { success: true, data: newUser, isMock: true };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('autotrade_user');
    localStorage.removeItem('autotrade_token');
  };

  const isAuthenticated = !!user;
  const isCustomer = user?.role === 'CUSTOMER';
  const isStaff = user?.role === 'STAFF';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        isCustomer,
        isStaff,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
