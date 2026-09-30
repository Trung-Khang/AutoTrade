import React, { useState, useEffect } from 'react';
import depositApi from '../services/depositApi';
import { formatFullPrice } from '../utils/formatters';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaCar,
  FaPhoneAlt,
  FaUserCheck,
  FaClock,
  FaClipboardList
} from 'react-icons/fa';

const StaffAppointmentPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await depositApi.getAllAppointments();
      setAppointments(data || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch hẹn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleUpdateStatus = async (depositId, newStatus) => {
    try {
      await depositApi.updateAppointmentStatus(depositId, newStatus);
      setActionNotice(`Đã cập nhật trạng thái lịch hẹn #${depositId} thành: ${newStatus}`);
      setTimeout(() => setActionNotice(''), 3000);
      loadAppointments();
    } catch (err) {
      alert('Không thể cập nhật trạng thái: ' + err.message);
    }
  };

  const filteredList = appointments.filter((item) => {
    const matchStatus =
      filterStatus === 'ALL' ||
      (item.appointmentStatus || 'SCHEDULED') === filterStatus;

    const kw = searchKeyword.toLowerCase().trim();
    const matchSearch =
      !kw ||
      item.customerName?.toLowerCase().includes(kw) ||
      item.customerPhone?.includes(kw) ||
      item.depositCode?.toLowerCase().includes(kw) ||
      item.vehicleTitle?.toLowerCase().includes(kw);

    return matchStatus && matchSearch;
  });

  return (
    <div style={{ maxWidth: '1140px', margin: '36px auto', padding: '0 20px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaClipboardList style={{ color: '#2563eb' }} /> Quản Lý Lịch Hẹn Khách Hàng (Dành Cho Nhân Viên)
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Tiếp đón khách hàng đến xem xe, kiểm tra tình trạng đặt cọc và ghi nhận kết quả lái thử
          </p>
        </div>
      </div>

      {actionNotice && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
          ✓ {actionNotice}
        </div>
      )}

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
          {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: filterStatus === st ? '#2563eb' : '#e2e8f0',
                backgroundColor: filterStatus === st ? '#2563eb' : '#ffffff',
                color: filterStatus === st ? '#ffffff' : '#64748b'
              }}
            >
              {st === 'ALL' && 'Tất cả'}
              {st === 'SCHEDULED' && 'Chờ tiếp đón'}
              {st === 'COMPLETED' && 'Đã hoàn tất'}
              {st === 'CANCELLED' && 'Đã hủy'}
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
            const appStatus = item.appointmentStatus || 'SCHEDULED';
            return (
              <div
                key={item.id}
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
                      <FaPhoneAlt style={{ fontSize: '11px', color: '#2563eb' }} /> {item.customerPhone}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                      {item.depositCode}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaCar style={{ color: '#64748b' }} /> Xe quan tâm: <strong>{item.vehicleTitle}</strong> · Tiền cọc: <strong style={{ color: '#ea580c' }}>{formatFullPrice(item.depositAmount)}</strong>
                  </div>

                  <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>
                      <FaCalendarAlt style={{ color: '#16a34a' }} /> Ngày hẹn: <strong>{item.appointmentDate}</strong> lúc <strong>{item.appointmentTime}</strong>
                    </span>
                    {item.hasTestDrive && (
                      <span style={{ color: '#2563eb', fontWeight: '600' }}>✓ Đăng ký lái thử</span>
                    )}
                  </div>

                  {item.note && (
                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px' }}>
                      Yêu cầu khách: {item.note}
                    </div>
                  )}
                </div>

                {/* Trạng thái & Nút thao tác */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    {appStatus === 'SCHEDULED' && (
                      <span style={{ color: '#2563eb', backgroundColor: '#dbeafe', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        Chờ tiếp đón
                      </span>
                    )}
                    {appStatus === 'COMPLETED' && (
                      <span style={{ color: '#16a34a', backgroundColor: '#dcfce7', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        ✓ Đã hoàn tất
                      </span>
                    )}
                    {appStatus === 'CANCELLED' && (
                      <span style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        ✕ Đã hủy
                      </span>
                    )}
                  </div>

                  {appStatus === 'SCHEDULED' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Đã tiếp đón
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'CANCELLED')}
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Hủy hẹn
                      </button>
                    </div>
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
