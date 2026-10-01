import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import './LoginPage.css';

const VerifyEmailPage = () => {
  const location = useLocation(); const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(location.state?.emailSent === false ? '' : (location.state?.message || 'Nhập email và mã OTP gồm 6 chữ số.'));
  const [error, setError] = useState(location.state?.emailSent === false ? location.state.message : ''); const [busy, setBusy] = useState(false);
  const verify = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { const result = await apiClient.post('/auth/verify-email', { email, code }, { timeout: 50000 }); setMessage(result.message); setTimeout(() => navigate('/login'), 1000); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const resend = async () => {
    setBusy(true); setError(''); setMessage('');
    try { const result = await apiClient.post('/auth/resend-verification', { email }, { timeout: 50000 });
      if (result.emailSent) setMessage(result.message);
      else setError(result.message);
    }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <div className="auth-page-container"><div className="auth-card"><div className="auth-header"><h1>Xác minh AutoTrade</h1><p>Mã OTP có hiệu lực trong 5 phút và chỉ dùng một lần.</p></div>
    {message && <div className="auth-success-alert">{message}</div>}{error && <div className="auth-error-alert">{error}</div>}
    <form onSubmit={verify} className="auth-form"><div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div className="form-group"><label>Mã OTP</label><input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required /></div><button className="auth-submit-btn" disabled={busy}>{busy ? 'Đang xử lý...' : 'Xác minh tài khoản'}</button></form>
    <div className="auth-footer"><button type="button" className="link-button" onClick={resend} disabled={busy}>Gửi lại OTP</button><br /><Link to="/login">Quay lại đăng nhập</Link></div>
  </div></div>;
};
export default VerifyEmailPage;
