import React, { useState, useEffect } from 'react';
import depositApi from '../services/depositApi';
import { useAuth } from '../context/AuthContext';
import { formatFullPrice } from '../utils/formatters';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaCar,
  FaPhoneAlt,
  FaClipboardList
} from 'react-icons/fa';

const StaffAppointmentPage = () => {
  const { isAdmin } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [error, setError] = useState('');

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = isAdmin
        ? await depositApi.getAdminAppointments()
        : await depositApi.getStaffAppointments();
      setAppointments(data || []);
    } catch (err) {
      setError(err.message || 'Không tải được lịch hẹn từ Backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [isAdmin]);

  const handleCheckIn = async (item) => {
    const note = prompt('Ghi chú tiếp đón khách (staff note):', item.hasTestDrive ? 'Khách đã đến đúng giờ, hoàn thành lái thử xe hài lòng.' : 'Khách đã đến showroom xem xe.');
    if (note === null) return; // bấm Cancel

    try {
      await depositApi.checkInAppointment(item.appointmentId || item.id, {
        testDriveCompleted: item.hasTestDrive,
        staffNote: note
      });
      setActionNotice(`Đã xác nhận Check-in thành công cho lịch hẹn của khách ${item.customerName}`);
      setTimeout(() => setActionNotice(''), 3000);
      loadAppointments();
    } catch (err) {
      alert('Không thể cập nhật Check-in: ' + err.message);
    }
  };

  const filteredList = appointments.filter((item) => {
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

    const kw = searchKeyword.toLowerCase().trim();
    const matchSearch =
      !kw ||
      item.customerName?.toLowerCase().includes(kw) ||
      item.customerPhone?.includes(kw) ||
      item.depositCode?.toLowerCase().includes(kw) ||
      (item.vehicleInfo || item.vehicleTitle)?.toLowerCase().includes(kw);

    return matchStatus && matchSearch;
  });

  return (
    <div style={{ maxWidth: '1140px', margin: '36px auto', padding: '0 20px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaClipboardList style={{ color: '#D4AF37' }} /> Quản Lý Lịch Hẹn Khách Hàng
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            {isAdmin
              ? 'Theo dõi lịch hẹn khách hàng từ dữ liệu PostgreSQL dùng chung.'
              : 'Tiếp đón khách hàng đến xem xe, kiểm tra tình trạng đặt cọc và ghi nhận kết quả lái thử.'}
          </p>
        </div>
      </div>

      {actionNotice && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
          ✓ {actionNotice}
        </div>
      )}
      {error && <div role="alert" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      {/* Bộ lọc và Tìm kiếm */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '20px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
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

      {/* Danh sách lịch hẹn */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách lịch hẹn...</div>
      ) : filteredList.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Không có lịch hẹn nào phù hợp với điều kiện tìm kiếm.
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{item.customerName}</strong>
                    <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaPhoneAlt style={{ fontSize: '11px', color: '#D4AF37' }} /> {item.customerPhone}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                      {item.depositCode}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaCar style={{ color: '#64748b' }} /> Xe quan tâm: <strong>{item.vehicleInfo || item.vehicleTitle}</strong>
                  </div>

                  <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>
                      <FaCalendarAlt style={{ color: '#16a34a' }} /> Ngày giờ hẹn: <strong>{item.appointmentDate}</strong>
                    </span>
                    {item.hasTestDrive && (
                      <span style={{ color: '#D4AF37', fontWeight: '700' }}>✓ Đăng ký lái thử (Test-Drive)</span>
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

                {/* Trạng thái & Nút thao tác Check-in */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    {isPending && (
                      <span style={{ color: '#b45309', backgroundColor: '#fef3c7', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        Chờ tiếp đón
                      </span>
                    )}
                    {isCompleted && (
                      <span style={{ color: '#16a34a', backgroundColor: '#dcfce7', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        ✓ Đã đón tiếp
                      </span>
                    )}
                    {isCancelled && (
                      <span style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        ✕ Đã hủy
                      </span>
                    )}
                  </div>

                  {isPending && !isAdmin && (
                    <button
                      onClick={() => handleCheckIn(item)}
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Check-in / Đã đón tiếp
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
