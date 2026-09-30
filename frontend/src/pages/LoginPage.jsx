import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { FaUserShield, FaUserTie, FaUser, FaInfoCircle } from 'react-icons/fa';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mockNotice, setMockNotice] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after login
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const res = await login(username, password);
      if (res.success) {
        if (res.isMock) {
          setMockNotice(`Đăng nhập chế độ giả lập (Mock) với vai trò: ${res.user.role}`);
        }
        // Redirect according to role if from is default
        if (from === '/') {
          if (res.user.role === 'ADMIN') {
            navigate('/admin/vehicles');
          } else if (res.user.role === 'STAFF') {
            navigate('/staff/appointments');
          } else {
            navigate('/vehicles');
          }
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demo) => {
    setUsername(demo.username);
    setPassword(demo.passwordHint);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Đăng nhập</h1>
          <p>Hệ thống Quản lý Kinh doanh Ô tô AutoTrade</p>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}
        {mockNotice && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {mockNotice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập / Email</label>
            <input
              id="username"
              type="text"
              placeholder="VD: admin, staff, customer"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký tài khoản mới</Link>
        </div>

        {/* Quick Demo Test Buttons */}
        <div className="demo-accounts-box">
          <div className="demo-title">
            <FaInfoCircle /> Tài khoản kiểm thử nhanh (Demo UI)
          </div>
          <div className="demo-buttons-grid">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                className="demo-btn"
                onClick={() => handleQuickLogin(acc)}
                title={acc.description}
              >
                {acc.role === 'ADMIN' && <FaUserShield style={{ color: '#dc2626', marginBottom: '2px' }} />}
                {acc.role === 'STAFF' && <FaUserTie style={{ color: '#2563eb', marginBottom: '2px' }} />}
                {acc.role === 'CUSTOMER' && <FaUser style={{ color: '#16a34a', marginBottom: '2px' }} />}
                <strong>{acc.username}</strong>
                <span>{acc.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
