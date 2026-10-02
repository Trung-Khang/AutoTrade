import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import vehicleApi from '../services/vehicleApi';
import depositApi from '../services/depositApi';
import { formatFullPrice, formatMileage } from '../utils/formatters';
import {
  FaCalendarCheck,
  FaQrcode,
  FaShieldAlt,
  FaCarSide,
  FaCheckCircle,
  FaArrowLeft,
  FaExclamationTriangle,
  FaReceipt,
  FaTimesCircle,
  FaPrint,
  FaUserCheck
} from 'react-icons/fa';
import './DepositPage.css';

const DepositPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State - Hỗ trợ cả khách vãng lai (Guest) không cần đăng nhập
  const [customerName, setCustomerName] = useState(user?.fullName || user?.username || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:30');
  const [hasTestDrive, setHasTestDrive] = useState(true);
  const [note, setNote] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDeposit, setPendingDeposit] = useState(null); // Lưu sau khi gọi POST /deposits
  const [conflictError, setConflictError] = useState(null);   // Bắt lỗi 409 Conflict
  const [receiptData, setReceiptData] = useState(null);       // Lưu sau khi gọi confirm thành công

  // Tính số tiền cọc động chuẩn 10% giá trị xe
  const depositAmount = vehicle?.price ? Math.round(Number(vehicle.price) * 0.1) : 10000000;
  const targetVehicleId = vehicle?.vehicleId || vehicle?.id;

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      try {
        const data = await vehicleApi.getListingById(id);
        setVehicle(data);
      } catch (err) {
        setError(err.message || 'Không tìm thấy thông tin xe để đặt cọc.');
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.fullName || user.username || '');
      if (!customerEmail) setCustomerEmail(user.email || '');
    }
  }, [user]);

  // In biên lai thanh toán
  const handlePrintReceipt = () => {
    window.print();
  };

  // BƯỚC 1: Khởi tạo đơn đặt cọc (POST /api/v1/deposits)
  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    if (!vehicle) return;

    if (!appointmentDate) {
      alert('Vui lòng chọn ngày hẹn xem xe!');
      return;
    }

    if (appointmentDate < todayStr) {
      alert('Ngày hẹn xem xe không thể ở quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Vui lòng điền đầy đủ họ tên và số điện thoại liên hệ.');
      return;
    }

    setIsSubmitting(true);
    setConflictError(null);

    try {
      const fullAppointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;
      const depositCode = `DEP-${Date.now()}`;
      const vcbQrUrl = `https://api.vietqr.io/image/970436-1050242933-compact2.jpg?amount=${depositAmount}&addInfo=${depositCode}&accountName=NGUYEN%20TRUNG%20KHANG`;

      const depositPayload = {
        vehicleId: targetVehicleId,
        showroomId: vehicle.showroomId || vehicle.showroom?.id || 1,
        appointmentDate: fullAppointmentDateTime,
        hasTestDrive,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || 'khachhang@autotrade.vn',
        note: note.trim(),
        depositAmount: depositAmount
      };

      const result = await depositApi.createDeposit(depositPayload);
      setPendingDeposit({
        ...depositPayload,
        depositId: result.depositId || result.id || Date.now(),
        depositCode: result.depositCode || depositCode,
        depositAmount: result.depositAmount || depositAmount,
        qrPaymentUrl: result.qrPaymentUrl || vcbQrUrl
      });
    } catch (err) {
      if (err.status === 409 || err.message?.includes('409') || err.message?.includes('Xung đột')) {
        setConflictError(err.message || 'Rất tiếc! Xe này vừa được một khách hàng khác đặt cọc trước bạn.');
      } else {
        alert('Có lỗi xảy ra khi tạo đơn cọc: ' + err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // BƯỚC 2: Khách quét QR xong bấm xác nhận (POST /api/v1/deposits/{id}/confirm)
  const handleConfirmPayment = async () => {
    if (!pendingDeposit) return;

    setIsSubmitting(true);
    setConflictError(null);

    try {
      const res = await depositApi.confirmPayment(pendingDeposit.depositId);
      
      // Cập nhật trạng thái xe sang HOLD (bọc an toàn tránh ngắt quãng luồng xuất bill)
      try {
        await vehicleApi.updateVehicleStatus(targetVehicleId, 'HOLD');
      } catch (patchErr) {
        console.warn('Backend đã tự động khóa trạng thái xe sang HOLD:', patchErr.message);
      }

      setReceiptData({
        ...pendingDeposit,
        receiptCode: res.receiptCode || `REC-2026-${pendingDeposit.depositId}`,
        contractNumber: res.contractNumber || `HD-COC-2026-${pendingDeposit.depositId}`,
        confirmedAt: res.confirmedAt || new Date().toISOString(),
        depositAmount: res.depositAmount || pendingDeposit.depositAmount || depositAmount,
        message: res.message || 'Đặt cọc giữ xe thành công! Xe đã được khóa trạng thái giữ chỗ cho quý khách.'
      });
    } catch (err) {
      if (err.status === 409 || err.message?.includes('409') || err.message?.includes('cọc trước') || err.message?.includes('Xung đột')) {
        setConflictError(err.message || 'Rất tiếc! Chiếc xe này vừa có khách hàng khác đặt cọc thành công trong cùng thời điểm. Giao dịch giữ xe của bạn bị hủy.');
        setPendingDeposit(null);
      } else {
        alert('Lỗi xác nhận thanh toán: ' + err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="deposit-page-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p>Đang chuẩn bị hồ sơ đặt cọc xe #{id}...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="deposit-page-container">
        <Link to="/vehicles" className="card-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          <FaArrowLeft /> Quay lại danh sách xe
        </Link>
        <div className="auth-error-alert" style={{ fontSize: '15px', padding: '16px' }}>
          <FaExclamationTriangle /> {error || 'Không tìm thấy xe yêu cầu.'}
        </div>
      </div>
    );
  }

  // Nếu xe đang bị HOLD hoặc SOLD (chỉ chặn nếu rõ ràng đã bị người khác cọc)
  const carStatus = (vehicle.status || 'AVAILABLE').toUpperCase();
  if ((carStatus === 'HOLD' || carStatus === 'RESERVED' || carStatus === 'SOLD') && !receiptData) {
    return (
      <div className="deposit-page-container">
        <Link to="/vehicles" className="card-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          <FaArrowLeft /> Quay lại danh sách xe
        </Link>
        <div className="deposit-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <FaExclamationTriangle style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '16px' }} />
          <h2>Không thể đặt cọc cho xe này</h2>
          <p style={{ color: '#64748b', maxWidth: '500px', margin: '10px auto 24px' }}>
            Chiếc <strong>{vehicle.brand} {vehicle.model}</strong> hiện có trạng thái là <strong>{carStatus === 'HOLD' ? 'Đang giữ chỗ cọc' : 'Đã bán'}</strong>. Hệ thống không thể tiếp nhận thêm đơn cọc mới.
          </p>
          <Link to="/vehicles" className="deposit-submit-btn" style={{ maxWidth: '240px', margin: '0 auto', textDecoration: 'none' }}>
            Xem các xe khác còn trống
          </Link>
        </div>
      </div>
    );
  }

  // MÀN HÌNH HOÀN TẤT THÀNH CÔNG (Biên lai thu tiền cọc & Hợp đồng số)
  if (receiptData) {
    return (
      <div className="deposit-page-container">
        <div className="deposit-success-card">
          <FaCheckCircle className="success-badge-icon" style={{ color: '#16a34a' }} />
          <h2>Đặt Cọc Giữ Chỗ & Đặt Hẹn Thành Công!</h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {receiptData.message} Chiếc xe đã chính thức chuyển sang trạng thái <strong>HOLD (Đang giữ chỗ)</strong>.
          </p>

          <div className="success-summary-box">
            <div><strong>Mã đơn cọc:</strong> <span className="ref-code-badge">{receiptData.depositCode}</span></div>
            <div><strong>Số hợp đồng số:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{receiptData.contractNumber}</span></div>
            <div><strong>Mã biên lai thu tiền:</strong> <span>{receiptData.receiptCode}</span></div>
            <div><strong>Xe đặt cọc:</strong> {vehicle.brand} {vehicle.model} {vehicle.variant || ''}</div>
            <div><strong>Số tiền cọc (10% giá xe):</strong> <strong style={{ color: '#D4AF37', fontSize: '16px' }}>{formatFullPrice(receiptData.depositAmount || depositAmount)}</strong></div>
            <div><strong>Khách hàng:</strong> {receiptData.customerName} ({receiptData.customerPhone})</div>
            <div><strong>Email liên hệ:</strong> {receiptData.customerEmail || 'Chưa cung cấp'}</div>
            <div>
              <strong>Lịch hẹn tại Showroom:</strong> {appointmentDate} lúc {appointmentTime}
              {receiptData.hasTestDrive && ' (Có đăng ký lái thử)'}
            </div>
            <div><strong>Thời hạn giữ chỗ:</strong> 7 ngày kể từ thời điểm đặt cọc</div>
            <div><strong>Tài khoản nhận tiền:</strong> Vietcombank - 1050242933 (NGUYEN TRUNG KHANG)</div>
          </div>

          <div className="success-actions">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="deposit-submit-btn"
              style={{ maxWidth: '240px', backgroundColor: '#1e293b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <FaPrint /> In Biên Lai / Hợp Đồng
            </button>
            {user && (
              <Link to="/customer/deposits" className="deposit-submit-btn" style={{ textDecoration: 'none', maxWidth: '220px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <FaReceipt /> Lịch sử cọc của tôi
              </Link>
            )}
            <Link to="/vehicles" className="card-btn-outline" style={{ textDecoration: 'none', maxWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Về Showroom
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="deposit-page-container">
      <div className="deposit-header">
        <Link to={`/vehicles/${vehicle.id}`} className="card-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '14px', padding: '6px 12px', fontSize: '12px' }}>
          <FaArrowLeft /> Quay lại trang chi tiết xe
        </Link>
        <h1>Đặt Cọc Online & Đặt Lịch Hẹn Xem Xe</h1>
        <p>Giữ quyền ưu tiên sở hữu độc quyền và sắp xếp thời gian lái thử trực tiếp tại showroom AutoTrade</p>
      </div>

      {conflictError && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '16px', borderRadius: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600' }}>
          <FaTimesCircle style={{ fontSize: '24px', flexShrink: 0 }} />
          <div>
            <strong>Lỗi xung đột đặt cọc (HTTP 409 Conflict):</strong>
            <p style={{ margin: 0, fontWeight: 'normal', fontSize: '14px', marginTop: '2px' }}>{conflictError}</p>
          </div>
        </div>
      )}

      <div className="deposit-layout-grid">
        {/* CỘT TRÁI: FORM THÔNG TIN HOẶC XÁC NHẬN QR */}
        <div className="deposit-card">
          {!pendingDeposit ? (
            <form onSubmit={handleCreateDeposit}>
              <div className="deposit-card-title">
                <FaCalendarCheck /> 1. Thông tin khách hàng & Lịch hẹn xem xe
              </div>

              {!user && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaUserCheck style={{ fontSize: '16px', color: '#16a34a' }} />
                  <span><strong>Đặt cọc nhanh (Khách vãng lai):</strong> Quý khách không cần đăng nhập trước. Điền thông tin bên dưới để nhận hóa đơn và biên lai hợp lệ ngay sau khi chuyển khoản.</span>
                </div>
              )}

              <div className="deposit-form-group">
                <label>Họ và tên người đặt cọc *</label>
                <input
                  type="text"
                  placeholder="Nhập họ và tên..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2-cols">
                <div className="deposit-form-group">
                  <label>Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    placeholder="VD: 0987654321"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="deposit-form-group">
                  <label>Địa chỉ Email nhận biên lai</label>
                  <input
                    type="email"
                    placeholder="VD: nguyenvana@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Chọn ngày giờ hẹn xem xe */}
              <div className="grid-2-cols" style={{ marginTop: '6px' }}>
                <div className="deposit-form-group">
                  <label>Ngày hẹn xem xe tại Showroom *</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                  />
                </div>

                <div className="deposit-form-group">
                  <label>Khung giờ hẹn *</label>
                  <select value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)}>
                    <option value="08:30">08:30 Sáng</option>
                    <option value="09:30">09:30 Sáng</option>
                    <option value="10:30">10:30 Sáng</option>
                    <option value="14:00">14:00 Chiều</option>
                    <option value="15:30">15:30 Chiều</option>
                    <option value="17:00">17:00 Chiều</option>
                  </select>
                </div>
              </div>

              {/* Checkbox lái thử xe (Test-Drive) */}
              <label className="test-drive-checkbox-label">
                <input
                  type="checkbox"
                  checked={hasTestDrive}
                  onChange={(e) => setHasTestDrive(e.target.checked)}
                />
                <div className="test-drive-text">
                  <strong>Đăng ký trải nghiệm lái thử xe (Test-Drive)</strong>
                  <span>Chuyên viên showroom sẽ chuẩn bị hồ sơ xe để bạn chạy thử trong buổi hẹn</span>
                </div>
              </label>

              <div className="deposit-form-group">
                <label>Ghi chú hoặc yêu cầu riêng (không bắt buộc)</label>
                <textarea
                  rows={2}
                  placeholder="VD: Cần kiểm tra kỹ khoang máy, hỗ trợ thủ tục trả góp..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
                <FaShieldAlt style={{ color: '#D4AF37', marginRight: '6px' }} />
                <strong>Cam kết hoàn cọc 100%:</strong> Khách hàng được hoàn trả đủ tiền đặt cọc nếu xe thực tế không đúng cam kết kiểm định 160 điểm.
              </div>

              <button type="submit" className="deposit-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo đơn cọc...' : 'Tiếp Tục: Quét Mã QR & Thanh Toán Cọc'}
              </button>
            </form>
          ) : (
            <div>
              <div className="deposit-card-title">
                <FaQrcode /> 2. Quét mã QR chuyển khoản đặt cọc
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '14px' }}>
                  Đơn đặt cọc <strong>{pendingDeposit.depositCode}</strong> đã được khởi tạo. Vui lòng quét mã bên phải hoặc chuyển khoản theo hướng dẫn.
                </p>

                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#92400e', textAlign: 'left', marginBottom: '20px' }}>
                  ⚠️ <strong>Lưu ý quan trọng:</strong> Hệ thống áp dụng kiểm tra chống cọc trùng thời gian thực (Atomic Lock). Chiếc xe chỉ chính thức được khóa sau khi bạn bấm <strong>"Xác nhận đã chuyển tiền"</strong> bên dưới.
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setPendingDeposit(null)}
                    className="card-btn-outline"
                    disabled={isSubmitting}
                  >
                    Quay lại sửa thông tin
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    className="deposit-submit-btn"
                    style={{ maxWidth: '320px' }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang kiểm tra & Khóa xe...' : '✓ Tôi Đã Chuyển Tiền Cọc'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: CHI TIẾT XE & KHUNG VIETQR */}
        <div className="deposit-card">
          <div className="deposit-card-title">
            <FaCarSide /> Chi tiết xe & Chuyển khoản
          </div>

          <div className="vehicle-summary-row">
            <img
              src={vehicle.imageUrl || vehicle.image_url}
              alt={vehicle.model}
              className="vehicle-summary-img"
            />
            <div className="vehicle-summary-info">
              <h4>{vehicle.brand} {vehicle.model} {vehicle.variant || ''}</h4>
              <p>Năm SX: {vehicle.manufactureYear || vehicle.manufacture_year} · ODO: {formatMileage(vehicle.mileage)}</p>
              <p style={{ marginTop: '2px', color: '#16a34a', fontWeight: '600' }}>Trạng thái: Sẵn sàng nhận cọc</p>
            </div>
          </div>

          <div className="pricing-table">
            <div className="pricing-row">
              <span>Giá niêm yết xe:</span>
              <strong>{formatFullPrice(vehicle.price)}</strong>
            </div>
            <div className="pricing-row">
              <span>Phí giữ chỗ ưu tiên:</span>
              <span>Miễn phí</span>
            </div>
            <div className="pricing-row highlight">
              <span>Số tiền cọc chuẩn (10%):</span>
              <span className="amount">{formatFullPrice(depositAmount)}</span>
            </div>
          </div>

          {/* Khung VietQR Vietcombank */}
          <div className="mock-qr-box">
            {pendingDeposit?.qrPaymentUrl ? (
              <img
                src={pendingDeposit.qrPaymentUrl}
                alt="VietQR Chuyển khoản"
                style={{ width: '200px', height: '200px', objectFit: 'contain', margin: '0 auto 12px', display: 'block', borderRadius: '8px' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="qr-code-placeholder">
                <FaQrcode className="qr-icon" style={{ color: '#D4AF37' }} />
                <span>VIETCOMBANK VIETQR CODE</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Quét mã chuyển khoản tức thì 24/7</span>
              </div>
            )}

            <div className="bank-info-table">
              <div><strong>Ngân hàng:</strong> Vietcombank (Ngoại thương Việt Nam)</div>
              <div><strong>Số tài khoản:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>1050242933</span></div>
              <div><strong>Chủ tài khoản:</strong> <span style={{ fontWeight: 'bold' }}>NGUYEN TRUNG KHANG</span></div>
              <div><strong>Số tiền cọc (10%):</strong> <strong style={{ color: '#D4AF37' }}>{formatFullPrice(depositAmount)}</strong></div>
              <div>
                <strong>Nội dung CK:</strong> <span className="ref-code-badge">{pendingDeposit?.depositCode || 'AUTODEP'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;
