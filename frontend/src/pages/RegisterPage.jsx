import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordPolicyChecklist from '../components/auth/PasswordPolicyChecklist';
import { getPasswordPolicy, isPasswordCompliant } from '../utils/passwordPolicy';
import { FaEye, FaEyeSlash, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import './LoginPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ username: '', fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
  const passwordRules = getPasswordPolicy(formData.password);
  const isCompliant = isPasswordCompliant(formData.password);
  const isMatching = formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordReady = isCompliant && isMatching;

  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (!passwordReady) { setError('Mật khẩu chưa đáp ứng đầy đủ yêu cầu.'); return; }
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
      
      <div className="form-group">
        <label htmlFor="password">Mật khẩu *</label>
        <div className="password-input-wrap">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập mật khẩu của bạn"
            value={formData.password}
            onChange={handleChange}
            className={formData.password ? (isCompliant ? 'input-success' : 'input-error') : ''}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            className="password-visibility-button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        <PasswordPolicyChecklist rules={passwordRules} value={formData.password} />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
        <div className="password-input-wrap">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={formData.confirmPassword ? (isMatching ? 'input-success' : 'input-error') : ''}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            className="password-visibility-button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {!formData.confirmPassword ? (
          <div className="password-hint-msg default">
            <FaInfoCircle className="hint-icon info" />
            <span>Nhập lại mật khẩu trùng khớp với mật khẩu đã tạo ở trên</span>
          </div>
        ) : isMatching ? (
          <div className="password-hint-msg success">
            <FaCheck className="hint-icon success" />
            <span>Mật khẩu xác nhận trùng khớp</span>
          </div>
        ) : (
          <div className="password-hint-msg error">
            <FaTimes className="hint-icon error" />
            <span>Mật khẩu xác nhận không khớp</span>
          </div>
        )}
      </div>

      <button type="submit" className="auth-submit-btn" disabled={isSubmitting || !passwordReady}>{isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}</button>
    </form>
    <div className="auth-footer">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></div>
  </div></div>;
};

export default RegisterPage;

