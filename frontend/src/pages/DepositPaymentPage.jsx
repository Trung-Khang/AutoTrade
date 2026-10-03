import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaQrcode } from 'react-icons/fa';
import depositApi from '../services/depositApi';
import { formatFullPrice } from '../utils/formatters';
import './DepositPage.css';

const DepositPaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deposit, setDeposit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadPendingDeposit = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await depositApi.getPendingPayment(id);
        if (!cancelled) setDeposit(result);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không thể lấy lại đơn cọc đang chờ thanh toán.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPendingDeposit();
    return () => { cancelled = true; };
  }, [id]);

  const handleConfirmPayment = async () => {
    if (!deposit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const receipt = await depositApi.confirmPayment(deposit.depositId);
      setSuccess(receipt);
    } catch (err) {
      setError(err.message || 'Không thể xác nhận thanh toán.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="deposit-page-container" style={{ textAlign: 'center', padding: '80px 20px' }}>Đang tải đơn cọc...</div>;
  }

  if (success) {
    return (
      <div className="deposit-page-container">
        <div className="deposit-success-card" style={{ maxWidth: '760px', margin: '40px auto', textAlign: 'center' }}>
          <FaCheckCircle style={{ color: '#16a34a', fontSize: '48px', marginBottom: '12px' }} />
          <h2>Thanh toán cọc thành công</h2>
          <p style={{ color: '#64748b' }}>{success.message || 'Đơn cọc đã được xác nhận và xe đã được giữ chỗ.'}</p>
          <Link to="/customer/deposits" className="deposit-submit-btn" style={{ display: 'inline-flex', width: 'auto', textDecoration: 'none', marginTop: '12px' }}>
            Xem đơn cọc & lịch hẹn
          </Link>
        </div>
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div className="deposit-page-container" style={{ maxWidth: '760px', margin: '40px auto' }}>
        <Link to="/customer/deposits" className="card-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px', textDecoration: 'none' }}>
          <FaArrowLeft /> Quay lại đơn cọc & lịch hẹn
        </Link>
        <div className="auth-error-alert" style={{ fontSize: '15px', padding: '16px' }}>
          <FaExclamationTriangle /> {error || 'Đơn cọc không còn chờ thanh toán.'}
        </div>
      </div>
    );
  }

  return (
    <div className="deposit-page-container" style={{ maxWidth: '900px', margin: '36px auto' }}>
      <Link to="/customer/deposits" className="card-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px', textDecoration: 'none' }}>
        <FaArrowLeft /> Quay lại đơn cọc & lịch hẹn
      </Link>

      <div className="deposit-card" style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div className="deposit-card-title">Tiếp tục thanh toán đơn cọc</div>
        <div style={{ color: '#475569', marginBottom: '16px' }}>
          Mã đơn: <strong>{deposit.depositCode}</strong>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', lineHeight: '1.8' }}>
          <div><strong>Xe:</strong> {deposit.vehicleTitle || `Xe #${deposit.vehicleId}`}</div>
          <div><strong>Số tiền cọc:</strong> <span style={{ color: '#ea580c', fontWeight: 800 }}>{formatFullPrice(deposit.depositAmount)}</span></div>
          {deposit.showroomName && <div><strong>Showroom:</strong> {deposit.showroomName}{deposit.showroomAddress ? ` - ${deposit.showroomAddress}` : ''}</div>}
          {deposit.appointmentDate && <div><strong>Lịch hẹn:</strong> {new Date(deposit.appointmentDate).toLocaleString('vi-VN')}</div>}
          {deposit.assignedStaffName && <div><strong>Nhân viên:</strong> {deposit.assignedStaffName}{deposit.assignedStaffPhone ? ` (${deposit.assignedStaffPhone})` : ''}</div>}
        </div>

        {error && <div className="auth-error-alert" style={{ marginTop: '16px' }}><FaExclamationTriangle /> {error}</div>}

        <div className="mock-qr-box" style={{ marginTop: '20px' }}>
          {deposit.qrPaymentUrl ? (
            <img src={deposit.qrPaymentUrl} alt="Mã QR thanh toán cọc" style={{ width: '220px', height: '220px', objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} />
          ) : (
            <div className="qr-code-placeholder">
              <FaQrcode className="qr-icon" style={{ color: '#D4AF37' }} />
              <span>Không có mã QR cho đơn này</span>
            </div>
          )}
          <div className="bank-info-table">
            <div><strong>Ngân hàng:</strong> Vietcombank (Ngoại thương Việt Nam)</div>
            <div><strong>Số tài khoản:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>1050242933</span></div>
            <div><strong>Chủ tài khoản:</strong> <span style={{ fontWeight: 'bold' }}>NGUYEN TRUNG KHANG</span></div>
            <div><strong>Số tiền cọc:</strong> <strong style={{ color: '#D4AF37' }}>{formatFullPrice(deposit.depositAmount)}</strong></div>
            <div><strong>Nội dung CK:</strong> <span className="ref-code-badge">{deposit.depositCode}</span></div>
          </div>
        </div>

        <button type="button" className="deposit-submit-btn" onClick={handleConfirmPayment} disabled={submitting}>
          {submitting ? 'Đang xác nhận thanh toán...' : 'Tôi đã chuyển tiền cọc'}
        </button>
      </div>
    </div>
  );
};

export default DepositPaymentPage;
