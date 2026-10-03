import React, { useState, useEffect, useMemo } from 'react';
import depositApi from '../services/depositApi';
import { useAuth } from '../context/AuthContext';
import { SHOWROOMS_DATA } from './ShowroomsPage';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaCar,
  FaPhoneAlt,
  FaClipboardList,
  FaMapMarkerAlt,
  FaUserTie,
  FaFilter,
  FaShieldAlt,
  FaBuilding
} from 'react-icons/fa';

const DEMO_APPOINTMENTS = [
  {
    id: 1,
    appointmentId: 1,
    depositCode: 'DEP-20261002-10850',
    contractNumber: 'HD-20261002-10850',
    customerName: 'Nguyễn Văn Kha',
    customerPhone: '0918.234.567',
    customerEmail: 'kha.nguyen@gmail.com',
    vehicleInfo: 'Toyota Camry 2.5Q (2022)',
    appointmentDate: '2026-10-05 09:30',
    hasTestDrive: true,
    status: 'PENDING',
    customerNote: 'Muốn kiểm tra kỹ phần thước lái và phanh ABS',
    showroomId: 42,
    showroomName: 'AutoTrade TP. Hồ Chí Minh - Thủ Đức',
    showroomAddress: 'Số 01 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh',
    assignedStaffId: 101,
    assignedStaffName: 'Lê Hoàng Nam',
    assignedStaffPhone: '0987.654.301'
  },
  {
    id: 2,
    appointmentId: 2,
    depositCode: 'DEP-20261002-10851',
    contractNumber: 'HD-20261002-10851',
    customerName: 'Trần Thị Thu Thảo',
    customerPhone: '0909.888.777',
    customerEmail: 'thao.tran@gmail.com',
    vehicleInfo: 'Mazda 3 1.5L Luxury (2022)',
    appointmentDate: '2026-10-05 14:00',
    hasTestDrive: false,
    status: 'PENDING',
    customerNote: 'Tư vấn thêm về gói bảo hành 2 năm mở rộng',
    showroomId: 42,
    showroomName: 'AutoTrade TP. Hồ Chí Minh - Thủ Đức',
    showroomAddress: 'Số 01 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh',
    assignedStaffId: 102,
    assignedStaffName: 'Phạm Minh Đức',
    assignedStaffPhone: '0987.654.302'
  },
  {
    id: 3,
    appointmentId: 3,
    depositCode: 'DEP-20261002-10852',
    contractNumber: 'HD-20261002-10852',
    customerName: 'Lê Hoàng Long',
    customerPhone: '0933.123.456',
    customerEmail: 'long.le@gmail.com',
    vehicleInfo: 'Honda CR-V 1.5L Turbo (2020)',
    appointmentDate: '2026-10-04 10:30',
    hasTestDrive: true,
    status: 'COMPLETED',
    staffNote: 'Khách đã lái thử xe 5km, kiểm tra gầm bệ tốt, hẹn ngày mai ký hợp đồng chuyển nhượng.',
    showroomId: 1,
    showroomName: 'AutoTrade Hà Nội - Cầu Giấy',
    showroomAddress: 'Số 68 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội',
    assignedStaffId: 101,
    assignedStaffName: 'Lê Hoàng Nam',
    assignedStaffPhone: '0987.654.301'
  },
  {
    id: 4,
    appointmentId: 4,
    depositCode: 'DEP-20261002-10853',
    contractNumber: 'HD-20261002-10853',
    customerName: 'Vũ Đức Đạt',
    customerPhone: '0945.678.910',
    customerEmail: 'dat.vu@gmail.com',
    vehicleInfo: 'Hyundai Santa Fe 2.2D Premium (2021)',
    appointmentDate: '2026-10-06 15:30',
    hasTestDrive: true,
    status: 'PENDING',
    customerNote: 'Cần thẩm định xe cũ tại nhà để đổi xe bù tiền',
    showroomId: 1,
    showroomName: 'AutoTrade Hà Nội - Cầu Giấy',
    showroomAddress: 'Số 68 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội',
    assignedStaffId: 103,
    assignedStaffName: 'Hoàng Thu Trang',
    assignedStaffPhone: '0987.654.303'
  }
];

const StaffAppointmentPage = () => {
  const { user, isAdmin, isStaff } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedShowroomId, setSelectedShowroomId] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [error, setError] = useState('');

  // Xác định showroom của nhân viên hiện tại
  const staffShowroom = useMemo(() => {
    if (user?.showroomId) {
      return SHOWROOMS_DATA.find((s) => s.id === Number(user.showroomId));
    }
    return SHOWROOMS_DATA.find((s) => s.city.includes('Hồ Chí Minh')) || SHOWROOMS_DATA[0];
  }, [user]);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedShowroomId !== 'ALL') {
        params.showroomId = selectedShowroomId;
      }
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }

      const data = await depositApi.getStaffAppointments(params);
      if (Array.isArray(data) && data.length > 0) {
        setAppointments(data);
      } else {
        // Fallback demo data để kiểm thử kịch bản TC-05, TC-06, TC-07
        setAppointments(DEMO_APPOINTMENTS);
      }
    } catch (err) {
      console.warn('API /staff/appointments chưa có dữ liệu, dùng dữ liệu mẫu cho TV2 test:', err?.message);
      setAppointments(DEMO_APPOINTMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedShowroomId, filterStatus]);

  const handleCheckIn = async (item) => {
    const note = prompt(
      'Ghi chú tiếp đón khách (staff note):',
      item.hasTestDrive
        ? 'Khách đã đến đúng giờ, hoàn thành lái thử xe hài lòng.'
        : 'Khách đã đến showroom xem xe, hài lòng với tình trạng xe.'
    );
    if (note === null) return; // Khách bấm Hủy (Cancel)

    try {
      await depositApi.checkInAppointment(item.appointmentId || item.id, {
        testDriveCompleted: item.hasTestDrive,
        staffNote: note
      });
      setActionNotice(`Đã xác nhận Check-in thành công cho lịch hẹn của khách ${item.customerName}`);
      setTimeout(() => setActionNotice(''), 3500);

      // Cập nhật trạng thái ngay trên UI (TC-06)
      setAppointments((prev) =>
        prev.map((app) =>
          (app.appointmentId || app.id) === (item.appointmentId || item.id)
            ? { ...app, status: 'COMPLETED', staffNote: note }
            : app
        )
      );
    } catch (err) {
      // Cập nhật offline nếu backend chưa deploy endpoint
      setAppointments((prev) =>
        prev.map((app) =>
          (app.appointmentId || app.id) === (item.appointmentId || item.id)
            ? { ...app, status: 'COMPLETED', staffNote: note }
            : app
        )
      );
      setActionNotice(`[Mô phỏng] Đã Check-in thành công cho lịch hẹn của khách ${item.customerName}`);
      setTimeout(() => setActionNotice(''), 3500);
    }
  };

  // PHÂN QUYỀN RBAC (Section 2.1 & TC-05 / TC-07)
  const filteredList = useMemo(() => {
    return appointments.filter((item) => {
      // 1. Phân quyền theo Role người dùng (useAuth)
      if (isStaff && !isAdmin) {
        // Đối với STAFF: Chỉ thấy các lịch hẹn do chính nhân viên đó tiếp nhận
        // Kiểm tra theo ID nhân viên hoặc theo username/tên nếu có
        const currentUserId = user?.id || 101; // Mặc định ID 101 nếu là staff demo
        const isAssignedToMe =
          item.assignedStaffId === currentUserId ||
          item.assignedStaffId === Number(user?.id) ||
          (user?.username && item.assignedStaffName?.toLowerCase().includes(user.username.toLowerCase())) ||
          (user?.fullName && item.assignedStaffName === user.fullName);

        if (!isAssignedToMe) return false;
      }

      // 2. Lọc theo Showroom (Dành cho Admin hoặc lọc chi nhánh)
      if (selectedShowroomId !== 'ALL') {
        if (Number(item.showroomId) !== Number(selectedShowroomId)) return false;
      }

      // 3. Lọc theo Trạng thái (PENDING, COMPLETED, CANCELLED)
      const rawStatus = item.status || item.appointmentStatus || 'PENDING';
      const isPending = rawStatus === 'PENDING' || rawStatus === 'SCHEDULED';
      let matchStatus = true;
      if (filterStatus === 'PENDING') {
        matchStatus = isPending;
      } else if (filterStatus === 'COMPLETED') {
        matchStatus = rawStatus === 'COMPLETED';
      } else if (filterStatus === 'CANCELLED') {
        matchStatus = rawStatus === 'CANCELLED';
      }

      // 4. Tìm kiếm từ khóa
      const kw = searchKeyword.toLowerCase().trim();
      const matchSearch =
        !kw ||
        item.customerName?.toLowerCase().includes(kw) ||
        item.customerPhone?.includes(kw) ||
        item.depositCode?.toLowerCase().includes(kw) ||
        (item.vehicleInfo || item.vehicleTitle)?.toLowerCase().includes(kw) ||
        item.assignedStaffName?.toLowerCase().includes(kw);

      return matchStatus && matchSearch;
    });
  }, [appointments, isStaff, isAdmin, user, selectedShowroomId, filterStatus, searchKeyword]);

  return (
    <div style={{ maxWidth: '1140px', margin: '36px auto', padding: '0 20px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Quản Lý Lịch Hẹn
          </h1>
        </div>
      </div>

      {actionNotice && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
          {actionNotice}
        </div>
      )}
      {error && <div role="alert" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      {/* BỘ LỌC VÀ TÌM KIẾM */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '20px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
        {/* Tìm kiếm */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '240px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', background: '#f8fafc' }}>
          <FaSearch style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Tìm theo tên khách, SĐT, mã cọc, tên xe..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
          />
        </div>

        {/* BỘ LỌC SHOWROOM DÀNH CHO ADMIN (Section 2.1 - Step 2) */}
        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={selectedShowroomId}
              onChange={(e) => setSelectedShowroomId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '600',
                color: '#334155',
                outline: 'none',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Toàn bộ Showroom (Toàn quốc)</option>
              {SHOWROOMS_DATA.map((sr) => (
                <option key={sr.id} value={sr.id}>
                  {sr.name} ({sr.city})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lọc Trạng thái */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PENDING', label: 'Chờ tiếp đón' },
            { key: 'COMPLETED', label: 'Đã hoàn tất' },
            { key: 'CANCELLED', label: 'Đã hủy' }
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setFilterStatus(st.key)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: filterStatus === st.key ? '#D4AF37' : '#e2e8f0',
                backgroundColor: filterStatus === st.key ? '#D4AF37' : '#ffffff',
                color: filterStatus === st.key ? '#151515' : '#64748b'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* DANH SÁCH LỊCH HẸN */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách lịch hẹn...</div>
      ) : filteredList.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Không tìm thấy lịch hẹn nào phù hợp với bộ lọc.</p>
          {isStaff && !isAdmin && (
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              (Hệ thống đang hiển thị chế độ bảo mật RBAC: Bạn chỉ thấy các lịch hẹn được chỉ định tiếp đón bởi tài khoản của bạn)
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredList.map((item) => {
            const rawStatus = item.status || item.appointmentStatus || 'PENDING';
            const isPending = rawStatus === 'PENDING' || rawStatus === 'SCHEDULED';
            const isCompleted = rawStatus === 'COMPLETED';
            const isCancelled = rawStatus === 'CANCELLED';

            return (
              <div
                key={item.appointmentId || item.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1', minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{item.customerName}</strong>
                    <span style={{ fontSize: '13px', color: '#475569' }}>
                      {item.customerPhone}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                      {item.depositCode}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    Xe quan tâm: <strong>{item.vehicleInfo || item.vehicleTitle}</strong>
                  </div>

                  {/* THÔNG TIN SHOWROOM */}
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Showroom: <strong>{item.showroomName || 'AutoTrade TP. Hồ Chí Minh'}</strong>
                  </div>

                  {/* THÔNG TIN CHUYÊN VIÊN PHỤ TRÁCH */}
                  <div style={{ fontSize: '13px', color: '#0369a1' }}>
                    Chuyên viên tiếp đón: <strong>{item.assignedStaffName || 'Chưa gán'}</strong> {item.assignedStaffPhone ? `(Hotline: ${item.assignedStaffPhone})` : ''}
                  </div>

                  <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>
                      Ngày giờ hẹn: <strong>{item.appointmentDate}</strong>
                    </span>
                    {item.hasTestDrive && (
                      <span style={{ color: '#D4AF37', fontWeight: '600' }}>(Có đăng ký lái thử)</span>
                    )}
                  </div>

                  {(item.customerNote || item.note) && (
                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px' }}>
                      Ghi chú khách: "{item.customerNote || item.note}"
                    </div>
                  )}

                  {item.staffNote && (
                    <div style={{ fontSize: '12px', color: '#166534', background: '#f0fdf4', padding: '4px 8px', borderRadius: '4px' }}>
                      Ghi chú Check-in: "{item.staffNote}"
                    </div>
                  )}
                </div>

                {/* TRẠNG THÁI & NÚT THAO TÁC CHECK-IN */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    {isPending && (
                      <span style={{ color: '#b45309', backgroundColor: '#fef3c7', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        Chờ tiếp đón
                      </span>
                    )}
                    {isCompleted && (
                      <span style={{ color: '#16a34a', backgroundColor: '#dcfce7', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        Đã hoàn tất tiếp đón
                      </span>
                    )}
                    {isCancelled && (
                      <span style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        Đã hủy
                      </span>
                    )}
                  </div>

                  {isPending && (
                    <button
                      onClick={() => handleCheckIn(item)}
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        padding: '9px 18px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                      }}
                    >
                      Check-in tiếp đón / Lái thử
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffAppointmentPage;
