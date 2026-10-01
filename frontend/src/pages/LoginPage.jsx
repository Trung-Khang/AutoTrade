import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setIsSubmitting(true);
    try {
      const result = await login(usernameOrEmail, password);
      if (from !== '/') navigate(from, { replace: true });
      else if (result.user.role === 'ADMIN') navigate('/admin/vehicles');
      else if (result.user.role === 'STAFF') navigate('/staff/appointments');
      else navigate('/vehicles');
    } catch (err) { setError(err.message || 'Đăng nhập không thành công.'); }
    finally { setIsSubmitting(false); }
  };

  return <div className="auth-page-container"><div className="auth-card">
    <div className="auth-header"><h1>Đăng nhập</h1><p>Hệ thống Quản lý Kinh doanh Ô tô AutoTrade</p></div>
    {error && <div className="auth-error-alert">{error}</div>}
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group"><label htmlFor="identity">Tên đăng nhập / Email</label><input id="identity" placeholder="VD: admin, staff, customer" value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)} required autoComplete="username" /></div>
      <div className="form-group"><label htmlFor="password">Mật khẩu</label><input id="password" type="password" placeholder="Nhập mật khẩu..." value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></div>
      <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
    </form>
    <div className="auth-footer"><Link to="/forgot-password" state={{ username: usernameOrEmail.includes('@') ? '' : usernameOrEmail }}>Quên mật khẩu?</Link><br />Chưa có tài khoản? <Link to="/register">Đăng ký tài khoản mới</Link></div>
  </div></div>;
};
export default LoginPage;
