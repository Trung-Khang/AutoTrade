import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import PasswordPolicyChecklist from '../components/auth/PasswordPolicyChecklist';
import { getPasswordPolicy, isPasswordCompliant } from '../utils/passwordPolicy';
import './LoginPage.css';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState('REQUEST');
  const location = useLocation();
  const [username, setUsername] = useState(location.state?.username || ''); const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState(null); const [message, setMessage] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const navigate = useNavigate();
  const passwordRules = getPasswordPolicy(newPassword);
  const passwordReady = isPasswordCompliant(newPassword) && newPassword === confirmPassword;
  const requestOtp = async (event) => { event.preventDefault(); setBusy(true); setError(''); try { const r = await apiClient.post('/auth/forgot-password', { username }, { timeout: 50000 }); setMessage(r.message); setStep('VERIFY'); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const verifyOtp = async (event) => { event.preventDefault(); setBusy(true); setError(''); try { const r = await apiClient.post('/auth/verify-reset-otp', { username, code }, { timeout: 50000 }); setResetToken(r.resetToken); setMessage(r.message); setStep('RESET'); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const reset = async (event) => { event.preventDefault(); if (!passwordReady) { setError('Mật khẩu chưa đáp ứng đầy đủ yêu cầu.'); return; } setBusy(true); setError(''); try { const r = await apiClient.post('/auth/reset-password', { resetToken, newPassword, confirmPassword }); setMessage(r.message); setTimeout(() => navigate('/login'), 1000); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  return <div className="auth-page-container"><div className="auth-card"><div className="auth-header"><h1>Đặt lại mật khẩu</h1><p>AutoTrade gửi mã OTP đến email đã đăng ký.</p></div>{message && <div className="auth-success-alert">{message}</div>}{error && <div className="auth-error-alert">{error}</div>}
    {step === 'REQUEST' && <form onSubmit={requestOtp} className="auth-form"><div className="form-group"><label>Tên đăng nhập</label><input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" /></div><button className="auth-submit-btn" disabled={busy}>Gửi OTP</button></form>}
    {step === 'VERIFY' && <form onSubmit={verifyOtp} className="auth-form"><div className="form-group"><label>Mã OTP</label><input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required /></div><button className="auth-submit-btn" disabled={busy}>Xác minh OTP</button></form>}
    {step === 'RESET' && <form onSubmit={reset} className="auth-form"><div className="form-group"><label>Mật khẩu mới</label><div className="password-input-wrap"><input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" /><button type="button" className="password-visibility-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? 'Ẩn' : 'Hiện'}</button></div><PasswordPolicyChecklist rules={passwordRules} /></div><div className="form-group"><label>Xác nhận mật khẩu mới</label><div className="password-input-wrap"><input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" /><button type="button" className="password-visibility-button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showConfirmPassword ? 'Ẩn' : 'Hiện'}</button></div>{confirmPassword && newPassword !== confirmPassword && <span className="field-error">Mật khẩu xác nhận không khớp.</span>}</div><button className="auth-submit-btn" disabled={busy || !passwordReady}>Lưu mật khẩu mới</button></form>}
    <div className="auth-footer"><Link to="/login">Quay lại đăng nhập</Link></div></div></div>;
};
export default ForgotPasswordPage;
