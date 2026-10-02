import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaInfoCircle, FaSave, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { normalizeVietnamesePhone, validateVietnamesePhone } from '../utils/phonePolicy';
import './ProfilePage.css';

const roleLabels = {
  CUSTOMER: 'Khách hàng',
  ADMIN: 'Quản trị viên',
};

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
  }, [user]);

  const phoneState = validateVietnamesePhone(phone);
  const canSubmit = fullName.trim().length > 0 && phoneState.state === 'success' && !saving;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);
    if (!fullName.trim()) {
      setStatus({ type: 'error', message: 'Họ tên không được để trống.' });
      return;
    }
    if (phoneState.state !== 'success') {
      setStatus({ type: 'error', message: phoneState.message });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: normalizeVietnamesePhone(phone),
      });
      setStatus({ type: 'success', message: 'Đã cập nhật thông tin cá nhân.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Không thể cập nhật thông tin lúc này.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-page">
      <div className="profile-card">
        <div className="profile-heading">
          <div className="profile-icon"><FaUser /></div>
          <div>
            <h1>Thông tin cá nhân</h1>
            <p>Quản lý họ tên và số điện thoại dùng trong tài khoản.</p>
          </div>
        </div>

        {status && (
          <div className={`profile-alert ${status.type}`} role="alert">
            {status.type === 'success' ? <FaCheckCircle /> : <FaInfoCircle />}
            <span>{status.message}</span>
          </div>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          <label>
            Tên đăng nhập
            <input value={user?.username || ''} readOnly />
          </label>
          <label>
            Email
            <input value={user?.email || ''} readOnly />
          </label>
          <label>
            Vai trò
            <input value={roleLabels[user?.role] || user?.role || ''} readOnly />
          </label>
          <label>
            Họ và tên
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              maxLength={120}
              required
            />
          </label>
          <label>
            Số điện thoại
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={phone ? (phoneState.state === 'success' ? 'input-success' : 'input-error') : ''}
              inputMode="tel"
              maxLength={15}
              required
            />
            <span className={`profile-phone-hint ${phoneState.state}`}>
              {phoneState.state === 'success' ? <FaCheckCircle /> : <FaInfoCircle />}
              {phoneState.message}
            </span>
          </label>
          <button className="profile-submit" type="submit" disabled={!canSubmit}>
            <FaSave /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ProfilePage;
