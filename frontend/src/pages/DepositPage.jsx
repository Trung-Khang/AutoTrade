import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import vehicleApi from '../services/vehicleApi';
import depositApi from '../services/depositApi';
import { SHOWROOMS_DATA } from './ShowroomsPage';
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
  FaMapMarkerAlt,
  FaUserTie,
  FaPhoneAlt
} from 'react-icons/fa';
import { OfficialReceiptContent } from '../components/deposit/OfficialReceiptModal';
import './DepositPage.css';

const TIME_SLOTS = [
  { value: '08:30', label: '08:30 Sáng' },
  { value: '09:30', label: '09:30 Sáng' },
  { value: '10:30', label: '10:30 Sáng' },
  { value: '14:00', label: '14:00 Chiều' },
  { value: '15:30', label: '15:30 Chiều' },
  { value: '17:00', label: '17:00 Chiều' },
];

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getLocalDateString(d);
};

// Kiểm tra khung giờ đã trôi qua chưa (kèm buffer an toàn 15 phút)
const isSlotInPast = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return false;
  const slotDate = new Date(`${dateStr}T${timeStr}:00`);
  return slotDate.getTime() <= Date.now() + 15 * 60 * 1000;
};

const DepositPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State - Hỗ trợ cả khách vãng lai (Guest) không cần đăng nhập
  const [customerName, setCustomerName] = useState(user?.fullName || user?.username || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  
  const todayStr = useMemo(() => getLocalDateString(), []);
  const allSlotsPassedToday = useMemo(() => {
    return TIME_SLOTS.every((slot) => isSlotInPast(todayStr, slot.value));
  }, [todayStr]);

  const minSelectableDate = allSlotsPassedToday ? getTomorrowDateString() : todayStr;

  const [appointmentDate, setAppointmentDate] = useState(() => {
    return allSlotsPassedToday ? getTomorrowDateString() : todayStr;
  });

  const [appointmentTime, setAppointmentTime] = useState(() => {
    if (!allSlotsPassedToday) {
      const firstValid = TIME_SLOTS.find((s) => !isSlotInPast(todayStr, s.value));
      return firstValid ? firstValid.value : '09:30';
    }
    return '09:30';
  });

  const handleDateChange = (newDate) => {
    setAppointmentDate(newDate);
    if (newDate === todayStr) {
      if (isSlotInPast(newDate, appointmentTime)) {
        const nextValid = TIME_SLOTS.find((s) => !isSlotInPast(newDate, s.value));
        if (nextValid) {
          setAppointmentTime(nextValid.value);
        }
      }
    }
  };
  const [hasTestDrive, setHasTestDrive] = useState(true);
  const [note, setNote] = useState('');

  // Chuyên viên tư vấn showroom
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  
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

  // Tìm kiếm thông tin Showroom nơi xe đang trưng bày (lấy showroomId từ Backend DTO, không đoán mò qua location)
  const matchedShowroom = useMemo(() => {
    if (!vehicle) return null;
    const sId = vehicle.showroomId || vehicle.showroom?.id;
    if (sId) {
      const found = SHOWROOMS_DATA.find((s) => s.id === Number(sId));
      if (found) return found;
      return {
        id: Number(sId),
        name: vehicle.showroom?.name || `Showroom AutoTrade Chi nhánh #${sId}`,
        city: vehicle.showroom?.city || vehicle.location || 'Chi nhánh Showroom',
        address: vehicle.showroom?.address || vehicle.location || 'Địa chỉ đang cập nhật',
        hotline: vehicle.showroom?.hotline || '1900 8888',
        hours: '08:00 - 20:00 (Hàng ngày)'
      };
    }
    return null;
  }, [vehicle]);

  // Kiểm tra điều kiện đủ điều kiện đặt cọc (khớp chuẩn contract TV4)
  const isDepositEligible = Boolean(
    vehicle &&
    matchedShowroom != null &&
    (vehicle.depositEligible !== undefined ? vehicle.depositEligible : (vehicle.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE')
  );

  // Tự động tải danh sách nhân viên showroom khi showroom hoặc ngày giờ được chọn
  useEffect(() => {
    if (!matchedShowroom?.id) {
      setStaffList([]);
      setSelectedStaffId(null);
      return;
    }
    let isCancelled = false;

    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const fullAppointmentDateTime = appointmentDate
          ? `${appointmentDate}T${appointmentTime}:00`
          : null;
        const list = await depositApi.getShowroomStaff(matchedShowroom.id, fullAppointmentDateTime);
        if (!isCancelled) {
          const staffArr = Array.isArray(list) ? list : [];
          setStaffList(staffArr);

          // Tự động chọn chuyên viên rảnh đầu tiên
          const firstAvailable = staffArr.find((s) => s.isAvailable);
          if (firstAvailable) {
            setSelectedStaffId(firstAvailable.id);
          } else {
            setSelectedStaffId(null);
          }
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách chuyên viên tư vấn từ Backend:', err);
        if (!isCancelled) {
          setStaffList([]);
          setSelectedStaffId(null);
        }
      } finally {
        if (!isCancelled) setLoadingStaff(false);
      }
    };

    fetchStaff();
    return () => {
      isCancelled = true;
    };
  }, [matchedShowroom?.id, appointmentDate, appointmentTime]);

  // In biên lai thanh toán
  const handlePrintReceipt = () => {
    window.print();
  };

  // BƯỚC 1: Khởi tạo đơn đặt cọc (POST /api/v1/deposits)
  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Vui lòng đăng nhập tài khoản để thực hiện đặt cọc và giữ xe');
      navigate('/login', { state: { from: { pathname: location.pathname }, message: 'Vui lòng đăng nhập tài khoản để thực hiện đặt cọc và giữ xe.' } });
      return;
    }
    if (user.role !== 'CUSTOMER') {
      setError('Chỉ tài khoản CUSTOMER mới được đặt cọc.');
      return;
    }
    if (!vehicle) return;

    if (!matchedShowroom?.id) {
      alert('Xe này hiện chưa được gắn Showroom hợp lệ trong hệ thống. Không thể tạo đơn cọc.');
      return;
    }

    if (!isDepositEligible) {
      alert(`Phương tiện này hiện không đủ điều kiện đặt cọc (Trạng thái xe: ${vehicle.status || 'Chưa mở bán'}).`);
      return;
    }

    if (!appointmentDate) {
      alert('Vui lòng chọn ngày hẹn xem xe!');
      return;
    }

    if (appointmentDate < minSelectableDate) {
      alert(allSlotsPassedToday
        ? 'Các khung giờ hẹn trong ngày hôm nay đã kết thúc. Vui lòng chọn ngày từ ngày mai trở đi!'
        : 'Ngày hẹn xem xe không thể ở quá khứ. Vui lòng chọn ngày từ hôm nay trở đi!');
      return;
    }

    const fullAppointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;
    const selectedDateTime = new Date(fullAppointmentDateTime);
    if (selectedDateTime.getTime() <= Date.now()) {
      alert('Thời gian hẹn xem xe (ngày và giờ) phải ở tương lai. Vui lòng chọn khung giờ hợp lệ!');
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
      const selectedStaffObj = staffList.find((s) => s.id === selectedStaffId);

      const depositPayload = {
        vehicleId: targetVehicleId,
        showroomId: matchedShowroom.id,
        appointmentDate: fullAppointmentDateTime,
        hasTestDrive,
        assignedStaffId: selectedStaffId ? Number(selectedStaffId) : null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || user?.email || '',
        customerNote: note.trim()
      };

      const result = await depositApi.createDeposit(depositPayload);
      if (!result?.depositId || !result?.depositCode || !result?.qrPaymentUrl) {
        throw new Error('Backend không trả đủ thông tin đơn cọc. Vui lòng tải lại và kiểm tra trạng thái đơn.');
      }
      setPendingDeposit({
        ...depositPayload,
        depositId: result.depositId,
        depositCode: result.depositCode,
        depositAmount: result.depositAmount,
        qrPaymentUrl: result.qrPaymentUrl,
        appointmentDate: result.appointmentDate,
        hasTestDrive: result.hasTestDrive,
        selectedStaff: selectedStaffObj,
        matchedShowroom: matchedShowroom
      });
    } catch (err) {
      if (err.status === 409 || err.message?.includes('409') || err.message?.includes('Xung đột')) {
        setConflictError(err.message || 'Rất tiếc! Xe này vừa được một khách hàng khác đặt cọc trước bạn.');
      } else {
        alert('Có lỗi xảy ra khi tạo đơn cọc: ' + (err?.response?.data?.message || err.message));
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
      const staffObj = pendingDeposit.selectedStaff || staffList.find((s) => s.id === selectedStaffId);
      const showroomObj = pendingDeposit.matchedShowroom || matchedShowroom;
      
      setReceiptData({
        ...pendingDeposit,
        receiptCode: res.receiptCode || `REC-${Date.now().toString().slice(-8)}`,
        contractNumber: res.contractNumber || `HD-${Date.now().toString().slice(-8)}`,
        confirmedAt: res.confirmedAt || new Date().toLocaleString('vi-VN'),
        depositAmount: res.depositAmount || pendingDeposit.depositAmount || depositAmount,
        message: res.message || 'Thanh toán cọc và xác nhận lịch hẹn thành công',
        showroomName: res.showroomName || showroomObj?.name || 'Showroom AutoTrade',
        showroomAddress: res.showroomAddress || showroomObj?.address || '',
        showroomPhone: res.showroomPhone || showroomObj?.hotline || '',
        assignedStaffName: res.assignedStaffName || staffObj?.fullName || (pendingDeposit.assignedStaffId ? 'Chuyên viên tư vấn' : 'Chưa phân công'),
        assignedStaffPhone: res.assignedStaffPhone || staffObj?.phone || ''
      });
    } catch (err) {
      if (err.status === 409 || err.message?.includes('409') || err.message?.includes('cọc trước') || err.message?.includes('Xung đột')) {
        setConflictError(err.message || 'Rất tiếc! Chiếc xe này vừa có khách hàng khác đặt cọc thành công trong cùng thời điểm. Giao dịch giữ xe của bạn bị hủy.');
        setPendingDeposit(null);
      } else {
        alert('Lỗi xác nhận thanh toán: ' + (err?.response?.data?.message || err.message));
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
          <div className="no-print" style={{ textAlign: 'center' }}>
            <FaCheckCircle className="success-badge-icon" style={{ color: '#16a34a' }} />
            <h2>Đặt Cọc Giữ Chỗ & Đặt Hẹn Thành Công!</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '18px' }}>
              {receiptData.message}. Chiếc xe đã chính thức chuyển sang trạng thái <strong>HOLD (Đang giữ chỗ)</strong>.
            </p>
          </div>

          {/* KHỐI BIÊN LAI CHUẨN IN VÀ HIỂN THỊ */}
          <OfficialReceiptContent
            receiptData={{
              ...receiptData,
              vehicleTitle: receiptData.vehicleTitle || `${vehicle.brand} ${vehicle.model} ${vehicle.variant || ''} (${vehicle.manufactureYear || vehicle.manufacture_year})`,
              vehiclePrice: receiptData.vehiclePrice || vehicle.price,
              depositAmount: receiptData.depositAmount || depositAmount,
              customerName: receiptData.customerName || customerName,
              customerPhone: receiptData.customerPhone || customerPhone,
              customerEmail: receiptData.customerEmail || customerEmail,
              appointmentDateFormatted: `${appointmentDate} lúc ${appointmentTime}`,
              hasTestDrive,
              showroomName: receiptData.showroomName || matchedShowroom?.name,
              showroomAddress: receiptData.showroomAddress || matchedShowroom?.address,
              assignedStaffName: receiptData.assignedStaffName || (staffList.find((s) => s.id === selectedStaffId)?.fullName),
              assignedStaffPhone: receiptData.assignedStaffPhone || (staffList.find((s) => s.id === selectedStaffId)?.phone),
            }}
          />

          <div className="success-actions no-print">
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

      {/* THÔNG TIN SHOWROOM TRƯNG BÀY XE */}
      {matchedShowroom ? (
        <div className="showroom-location-banner">
          <div className="showroom-banner-content">
            <div className="showroom-banner-title">
              Địa điểm xe đang trưng bày: <strong>{matchedShowroom.name}</strong>
            </div>
            <div className="showroom-banner-address">
              Địa chỉ: {matchedShowroom.address}
            </div>
            <div className="showroom-banner-hotline">
              Hotline chi nhánh: <strong>{matchedShowroom.hotline}</strong> · Giờ đón tiếp: {matchedShowroom.hours}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '16px', borderRadius: '10px', marginBottom: '24px' }}>
          <strong>Lỗi xác định Showroom:</strong>
          <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
            Chiếc xe này hiện chưa được gán thông tin Showroom cụ thể trong hệ thống. Để đảm bảo tính toàn vẹn khi bàn giao xe và lái thử, chức năng đặt cọc tạm thời bị khóa cho phương tiện này.
          </p>
        </div>
      )}

      {/* CẢNH BÁO XE KHÔNG ĐỦ ĐIỀU KIỆN ĐẶT CỌC */}
      {matchedShowroom && !isDepositEligible && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '16px', borderRadius: '10px', marginBottom: '24px' }}>
          <strong>Xe không đủ điều kiện đặt cọc:</strong>
          <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
            Chiếc xe này hiện đang ở trạng thái <strong>{vehicle.status || 'Tạm ngưng mở bán'}</strong> và chưa sẵn sàng tiếp nhận đặt cọc theo quy định của hệ thống.
          </p>
        </div>
      )}

      <div className="deposit-layout-grid">
        {/* CỘT TRÁI: FORM THÔNG TIN HOẶC XÁC NHẬN QR */}
        <div className="deposit-card">
          {!pendingDeposit ? (
            <form onSubmit={handleCreateDeposit}>
              <div className="deposit-card-title">
                1. Thông tin khách hàng & Lịch hẹn xem xe
              </div>

              {error && <div className="auth-error-alert" role="alert">{error}</div>}

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
                    min={minSelectableDate}
                    value={appointmentDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    required
                  />
                </div>

                <div className="deposit-form-group">
                  <label>Khung giờ hẹn *</label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    disabled={appointmentDate === todayStr && allSlotsPassedToday}
                  >
                    {TIME_SLOTS.map((slot) => {
                      const isPast = appointmentDate === todayStr && isSlotInPast(appointmentDate, slot.value);
                      return (
                        <option key={slot.value} value={slot.value} disabled={isPast}>
                          {slot.label} {isPast ? '(Đã qua giờ)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {appointmentDate === todayStr && allSlotsPassedToday && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '6px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaTimesCircle style={{ fontSize: '16px', flexShrink: 0 }} />
                  <span>Các khung giờ hẹn hôm nay đã kết thúc (Showroom đón tiếp 08:30 - 17:30). Vui lòng chọn lịch hẹn từ ngày mai trở đi.</span>
                </div>
              )}

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

              {/* CHUYÊN VIÊN TƯ VẤN ĐÓN TIẾP TẠI SHOWROOM */}
              <div className="deposit-form-group staff-picker-container">
                <label className="staff-picker-header">
                  <span>Chuyên viên tư vấn đón tiếp tại Showroom</span>
                  <span className="staff-picker-sub">
                    {appointmentDate ? '(Kiểm tra theo lịch ngày & giờ đã chọn)' : '(Vui lòng chọn ngày hẹn để kiểm tra lịch rảnh)'}
                  </span>
                </label>

                {loadingStaff ? (
                  <div className="staff-loading-box">
                    <div className="staff-spinner"></div> Đang kiểm tra lịch làm việc của chuyên viên...
                  </div>
                ) : staffList.length === 0 ? (
                  <div className="staff-empty-box">
                    Hệ thống sẽ tự động chỉ định chuyên viên sẵn sàng tiếp đón bạn tại showroom.
                  </div>
                ) : (
                  <div className="staff-cards-grid">
                    {staffList.map((staff) => {
                      const isSelected = selectedStaffId === staff.id;
                      const isAvail = Boolean(staff.isAvailable);

                      return (
                        <div
                          key={staff.id}
                          className={`staff-select-card ${isAvail ? 'available' : 'busy'} ${isSelected ? 'active-selected' : ''}`}
                          onClick={() => {
                            if (isAvail) setSelectedStaffId(staff.id);
                          }}
                        >
                          <div className="staff-card-top">
                            <input
                              type="radio"
                              name="assignedStaffRadio"
                              checked={isSelected}
                              disabled={!isAvail}
                              onChange={() => {
                                if (isAvail) setSelectedStaffId(staff.id);
                              }}
                              className="staff-radio-input"
                            />
                            <div className="staff-avatar-circle">
                              {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'NV'}
                            </div>
                            <div className="staff-name-box">
                              <strong className="staff-name-text">{staff.fullName}</strong>
                              <span className="staff-phone-text">
                                {staff.phone}
                              </span>
                            </div>
                          </div>

                          <div className="staff-card-bottom">
                            {isAvail ? (
                              <span className="staff-status-tag available">
                                Sẵn sàng đón tiếp
                              </span>
                            ) : (
                              <span className="staff-status-tag busy">
                                Đã kín lịch
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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

              <button
                type="submit"
                className="deposit-submit-btn"
                disabled={isSubmitting || !matchedShowroom || !isDepositEligible}
                style={(!matchedShowroom || !isDepositEligible) ? { backgroundColor: '#94a3b8', cursor: 'not-allowed' } : {}}
              >
                {!matchedShowroom
                  ? 'Chức năng đặt cọc bị khóa (Thiếu Showroom)'
                  : !isDepositEligible
                  ? 'Chức năng đặt cọc bị khóa (Xe không đủ điều kiện)'
                  : isSubmitting
                  ? 'Đang tạo đơn cọc...'
                  : 'Tiếp Tục: Quét Mã QR & Thanh Toán Cọc'}
              </button>
            </form>
          ) : (
            <div>
              <div className="deposit-card-title">
                2. Quét mã QR chuyển khoản đặt cọc
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '14px' }}>
                  Đơn đặt cọc <strong>{pendingDeposit.depositCode}</strong> đã được khởi tạo. Vui lòng quét mã bên phải hoặc chuyển khoản theo hướng dẫn.
                </p>

                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#92400e', textAlign: 'left', marginBottom: '20px' }}>
                  <strong>Lưu ý quan trọng:</strong> Hệ thống áp dụng kiểm tra chống cọc trùng thời gian thực (Atomic Lock). Chiếc xe chỉ chính thức được khóa sau khi bạn bấm <strong>"Xác nhận đã chuyển tiền"</strong> bên dưới.
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
                    {isSubmitting ? 'Đang kiểm tra & Khóa xe...' : 'Tôi Đã Chuyển Tiền Cọc'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: CHI TIẾT XE & KHUNG VIETQR */}
        <div className="deposit-card">
          <div className="deposit-card-title">
            Chi tiết xe & Chuyển khoản
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
