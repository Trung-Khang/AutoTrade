import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import depositApi from '../services/depositApi';
import { formatFullPrice } from '../utils/formatters';
import {
  FaReceipt,
  FaCalendarAlt,
  FaCar,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaShieldAlt,
  FaMapMarkerAlt
} from 'react-icons/fa';

const CustomerDepositHistoryPage = () => {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDeposits = async () => {
      setLoading(true);
      setError('');
      try {
        const list = await depositApi.getMyDeposits(user?.email);
        setDeposits(list || []);
      } catch (err) {
        setError(err.message || 'Không tải được lịch sử đặt cọc từ Backend.');
      } finally {
        setLoading(false);
      }
    };
    loadDeposits();
  }, [user]);

  const renderDepositStatus = (status) => {
    switch (status) {
      case 'DEPOSITED':
        return <span style={{ color: '#16a34a', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}><FaCheckCircle /> Đã đặt cọc</span>;
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return <span style={{ color: '#d97706', backgroundColor: '#fef3c7', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}><FaHourglassHalf /> Chờ thanh toán</span>;
      case 'CANCELLED':
        return <span style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}><FaTimesCircle /> Đã hủy cọc</span>;
      case 'REFUNDED':
        return <span style={{ color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}><FaShieldAlt /> Đã hoàn cọc</span>;
      default:
        return <span style={{ color: '#0f172a', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{status || 'Đang xử lý'}</span>;
    }
  };

  const renderAppointmentStatus = (appointmentStatus, depositStatus) => {
    if (depositStatus === 'PENDING' || depositStatus === 'PENDING_PAYMENT') {
      return <span style={{ color: '#d97706', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Chờ thanh toán cọc</span>;
    }

    switch (appointmentStatus) {
      case 'PENDING':
      case 'SCHEDULED':
      case 'CONFIRMED':
        return <span style={{ color: '#2563eb', backgroundColor: '#dbeafe', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Đã lên lịch</span>;
      case 'COMPLETED':
        return <span style={{ color: '#16a34a', backgroundColor: '#dcfce7', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Đã hoàn tất</span>;
      case 'CANCELLED':
        return <span style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Đã hủy</span>;
      case 'RESCHEDULED':
        return <span style={{ color: '#8b5cf6', backgroundColor: '#ede9fe', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Đã đổi lịch</span>;
      default:
        return appointmentStatus ? <span>{appointmentStatus}</span> : <span style={{ color: '#64748b', fontStyle: 'italic' }}>Chờ xác nhận</span>;
    }
  };

  const formatAppointmentDateTime = (dateStr, timeStr) => {
    if (!dateStr) return 'Chờ sắp xếp lịch';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = timeStr || `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return `${day}/${month}/${year} (${time})`;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '36px auto', padding: '0 20px 60px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Đơn Đặt Cọc & Lịch Hẹn Của Tôi
        </h1>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải dữ liệu đơn cọc...</div>
      ) : error ? (
        <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 16, borderRadius: 8 }}>{error}</div>
      ) : deposits.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '48px 24px', textAlign: 'center' }}>
          <FaReceipt style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '8px' }}>Chưa có đơn đặt cọc nào</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            Bạn chưa thực hiện đơn đặt cọc giữ chỗ cho chiếc xe nào tại showroom.
          </p>
          <Link to="/vehicles" style={{ display: 'inline-block', backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', textDecoration: 'none' }}>
            Khám phá xe trong showroom
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {deposits.map((item) => {
            const depositMoney = item.depositAmount ?? item.amount;
            const carName = item.vehicleTitle || (item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model}` : null) || 'Xe tại Showroom';
            const carPrice = item.vehiclePrice ?? item.vehicle?.price;
            const showroomText = item.showroomName || item.showroom?.name;
            const customerNote = item.customerNote ?? item.note;

            return (
              <div key={item.depositId || item.id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Mã đơn cọc: </span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '14px', color: '#0f172a' }}>{item.depositCode}</strong>
                  </div>
                  <div>{renderDepositStatus(item.status)}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '14px' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Xe đặt cọc</div>
                    <strong style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}><FaCar style={{ color: '#2563eb' }} /> {carName}</strong>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Giá xe: {carPrice ? formatFullPrice(carPrice) : 'Liên hệ'}</div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Số tiền đã cọc</div>
                    <strong style={{ color: '#ea580c', fontSize: '16px' }}>{depositMoney ? formatFullPrice(depositMoney) : 'Liên hệ'}</strong>
                    {item.contractNumber && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>HĐ số: <span style={{ fontFamily: 'monospace' }}>{item.contractNumber}</span></div>}
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Lịch hẹn Showroom</div>
                    <div style={{ color: '#0f172a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><FaCalendarAlt style={{ color: '#16a34a' }} /> {formatAppointmentDateTime(item.appointmentDate, item.appointmentTime)}</div>
                    {showroomText && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><FaMapMarkerAlt style={{ color: '#94a3b8' }} /> {showroomText}</div>}
                    <div style={{ marginTop: '4px' }}>Trạng thái hẹn: {renderAppointmentStatus(item.appointmentStatus, item.status)}</div>
                  </div>
                </div>

                {item.hasTestDrive && <div style={{ marginTop: '14px', backgroundColor: '#eff6ff', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#1e40af', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FaCheckCircle /> Có đăng ký lái thử xe trong buổi hẹn</div>}
                {customerNote && <div style={{ marginTop: '10px', fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>Ghi chú: "{customerNote}"</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerDepositHistoryPage;
