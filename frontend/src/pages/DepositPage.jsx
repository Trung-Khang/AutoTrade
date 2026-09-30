import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  FaClock
} from 'react-icons/fa';
import './DepositPage.css';

const DEFAULT_DEPOSIT_AMOUNT = 20000000; // 20,000,000 VNĐ tiền cọc chuẩn

const DepositPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [customerName, setCustomerName] = useState(user?.fullName || user?.username || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  
  // Date must be today or future
  const todayStr = new Date().toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:30');
  const [hasTestDrive, setHasTestDrive] = useState(true);
  const [note, setNote] = useState('');
  
  const [hasConfirmedPayment, setHasConfirmedPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessData, setSubmitSuccessData] = useState(null);

  // Sinh mã tham chiếu giao dịch độc nhất
  const [refCode] = useState(() => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `AUTODEP-${id}-${randomHex}`;
  });

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

  // Cập nhật thông tin khách hàng nếu đăng nhập sau khi load
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.fullName || user.username || '');
      if (!customerEmail) setCustomerEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicle) return;

    // Kiểm tra tính hợp lệ của ngày hẹn (không được ở quá khứ)
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

    if (!hasConfirmedPayment) {
      alert('Vui lòng tích xác nhận đã chuyển khoản đặt cọc theo hướng dẫn.');
      return;
    }

    setIsSubmitting(true);
    try {
      const depositPayload = {
        vehicleId: vehicle.id,
        vehicleTitle: `${vehicle.brand} ${vehicle.model} ${vehicle.variant || ''}`.trim(),
        vehiclePrice: vehicle.price,
        depositAmount: DEFAULT_DEPOSIT_AMOUNT,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || (user ? user.email : 'khachhang@autotrade.vn'),
        appointmentDate,
        appointmentTime,
        hasTestDrive,
        note: note.trim(),
        depositCode: refCode
      };

      const result = await depositApi.createDeposit(depositPayload);

      // Cập nhật trạng thái xe thành HOLD
      await vehicleApi.updateVehicleStatus(vehicle.id, 'HOLD');

      setSubmitSuccessData({
        ...depositPayload,
        id: result?.id || Date.now(),
        code: result?.depositCode || refCode
      });
    } catch (err) {
      alert('Có lỗi xảy ra khi tạo đơn đặt cọc: ' + err.message);
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

  // Nếu xe không ở trạng thái AVAILABLE
  const carStatus = (vehicle.status || 'AVAILABLE').toUpperCase();
  if (carStatus !== 'AVAILABLE' && !submitSuccessData) {
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

  // Màn hình hoàn tất đặt cọc thành công
  if (submitSuccessData) {
    return (
      <div className="deposit-page-container">
        <div className="deposit-success-card">
          <FaCheckCircle className="success-badge-icon" />
          <h2>Đặt Cọc & Đặt Hẹn Thành Công!</h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Yêu cầu giữ chỗ của bạn đã được ghi nhận vào hệ thống. Chiếc xe đã được chuyển sang trạng thái <strong>ĐANG GIỮ CHỖ (HOLD)</strong>.
          </p>

          <div className="success-summary-box">
            <div><strong>Mã tham chiếu đơn:</strong> <span className="ref-code-badge">{submitSuccessData.code}</span></div>
            <div><strong>Xe đặt cọc:</strong> {submitSuccessData.vehicleTitle}</div>
            <div><strong>Số tiền cọc:</strong> 20.000.000 VNĐ</div>
            <div><strong>Khách hàng:</strong> {submitSuccessData.customerName} ({submitSuccessData.customerPhone})</div>
            <div>
              <strong>Lịch hẹn tại Showroom:</strong> {submitSuccessData.appointmentDate} vào lúc {submitSuccessData.appointmentTime}
              {submitSuccessData.hasTestDrive && ' (Có đăng ký lái thử)'}
            </div>
            <div><strong>Trạng thái lịch hẹn:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>SCHEDULED (Đã lên lịch)</span></div>
          </div>

          <div className="success-actions">
            <Link to="/customer/deposits" className="deposit-submit-btn" style={{ textDecoration: 'none', maxWidth: '240px' }}>
              <FaReceipt /> Lịch sử cọc của tôi
            </Link>
            <Link to="/vehicles" className="card-btn-outline" style={{ textDecoration: 'none', maxWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <h1>Đặt Cọc & Đặt Lịch Hẹn Xem Xe</h1>
        <p>Giữ quyền ưu tiên sở hữu và sắp xếp thời gian lái thử trực tiếp tại showroom AutoTrade</p>
      </div>

      <div className="deposit-layout-grid">
        {/* Cột trái: Form thông tin & Hẹn lịch */}
        <div className="deposit-card">
          <form onSubmit={handleSubmit}>
            <div className="deposit-card-title">
              <FaCalendarCheck /> 1. Thông tin khách hàng & Lịch hẹn
            </div>

            <div className="deposit-form-group">
              <label>Họ và tên người đặt *</label>
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
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  placeholder="VD: 0901234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>

              <div className="deposit-form-group">
                <label>Địa chỉ Email</label>
                <input
                  type="email"
                  placeholder="VD: khachhang@email.com"
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
                <span>Nhân viên tư vấn sẽ chuẩn bị xe và giấy tờ để bạn chạy thử trong buổi hẹn</span>
              </div>
            </label>

            <div className="deposit-form-group">
              <label>Ghi chú hoặc yêu cầu riêng (không bắt buộc)</label>
              <textarea
                rows={2}
                placeholder="VD: Nhờ kiểm tra kỹ gầm xe, cần xuất hóa đơn công ty..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Điều khoản */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
              <FaShieldAlt style={{ color: '#2563eb', marginRight: '6px' }} />
              <strong>Chính sách hoàn cọc:</strong> Khách hàng được quyền hoàn trả 100% tiền đặt cọc nếu xe thực tế không đúng với cam kết chất lượng của AutoTrade hoặc không đạt kiểm định.
            </div>

            <label className="confirm-checkbox-label">
              <input
                type="checkbox"
                checked={hasConfirmedPayment}
                onChange={(e) => setHasConfirmedPayment(e.target.checked)}
                required
              />
              <span>
                Tôi xác nhận đã kiểm tra thông tin và đã thực hiện chuyển khoản <strong>20.000.000 VNĐ</strong> giữ chỗ theo mã tham chiếu bên dưới.
              </span>
            </label>

            <button type="submit" className="deposit-submit-btn" disabled={isSubmitting || !hasConfirmedPayment}>
              {isSubmitting ? 'Đang xác nhận đặt cọc...' : 'Xác Nhận Đặt Cọc & Hoàn Tất Lịch Hẹn'}
            </button>
          </form>
        </div>

        {/* Cột phải: Thông tin xe & Mock VietQR Thanh toán */}
        <div className="deposit-card">
          <div className="deposit-card-title">
            <FaCarSide /> 2. Chi tiết xe & Chuyển khoản
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
              <span>Số tiền cọc cần chuyển:</span>
              <span className="amount">20.000.000 VNĐ</span>
            </div>
          </div>

          {/* Khung VietQR giả lập */}
          <div className="mock-qr-box">
            <div className="qr-code-placeholder">
              <FaQrcode className="qr-icon" />
              <span>MOCK VIETQR CODE</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Quét mã chuyển khoản tức thì</span>
            </div>

            <div className="bank-info-table">
              <div><strong>Ngân hàng:</strong> MB Bank (Quân Đội)</div>
              <div><strong>Số tài khoản:</strong> 0987654321</div>
              <div><strong>Chủ tài khoản:</strong> CTY CP KINH DOANH AUTOTRADE</div>
              <div><strong>Số tiền:</strong> 20.000.000 VNĐ</div>
              <div>
                <strong>Nội dung CK:</strong> <span className="ref-code-badge">{refCode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;
