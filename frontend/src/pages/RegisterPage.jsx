import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ username: '', fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (formData.password !== formData.confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setIsSubmitting(true);
    try {
      const result = await register(formData);
      navigate('/verify-email', { state: { email: formData.email, message: result.message, emailSent: result.emailSent } });
    } catch (err) { setError(err.message || 'Đăng ký không thành công.'); }
    finally { setIsSubmitting(false); }
  };
  return <div className="auth-page-container"><div className="auth-card">
    <div className="auth-header"><h1>Đăng ký tài khoản</h1><p>Tạo tài khoản khách hàng để đặt cọc và đặt lịch hẹn xem xe</p></div>
    {error && <div className="auth-error-alert">{error}</div>}
    <form onSubmit={submit} className="auth-form">
      {[['username', 'Tên đăng nhập *', 'text', 'VD: nguyenvana'], ['fullName', 'Họ và tên *', 'text', 'VD: Nguyễn Văn A'], ['email', 'Địa chỉ Email *', 'email', 'VD: vana@example.com'], ['phone', 'Số điện thoại *', 'tel', 'VD: 0912345678']].map(([name, label, type, placeholder]) => <div className="form-group" key={name}><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} placeholder={placeholder} value={formData[name]} onChange={handleChange} required /></div>)}
      <div className="form-group"><label htmlFor="password">Mật khẩu *</label><input id="password" name="password" type="password" minLength="8" placeholder="Tối thiểu 8 ký tự" value={formData.password} onChange={handleChange} required autoComplete="new-password" /></div>
      <div className="form-group"><label htmlFor="confirmPassword">Xác nhận mật khẩu *</label><input id="confirmPassword" name="confirmPassword" type="password" minLength="8" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={handleChange} required autoComplete="new-password" /></div>
      <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>{isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}</button>
    </form>
    <div className="auth-footer">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></div>
  </div></div>;
};
export default RegisterPage;
