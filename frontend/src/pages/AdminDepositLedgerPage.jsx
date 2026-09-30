import React, { useState, useEffect } from 'react';
import depositApi from '../services/depositApi';
import vehicleApi from '../services/vehicleApi';
import { formatFullPrice } from '../utils/formatters';
import {
  FaBook,
  FaSearch,
  FaMoneyBillWave,
  FaCheckCircle,
  FaUndo,
  FaFilter,
  FaReceipt,
  FaCar
} from 'react-icons/fa';

const AdminDepositLedgerPage = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notice, setNotice] = useState('');

  const loadLedger = async () => {
    setLoading(true);
    try {
      const data = await depositApi.getAllAppointments();
      setDeposits(data || []);
    } catch (err) {
      console.error('Lỗi khi tải sổ cái cọc:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleRefund = async (deposit) => {
    if (window.confirm(`Xác nhận hoàn cọc 100% cho đơn "${deposit.depositCode}" của khách hàng ${deposit.customerName}? Xe sẽ được mở bán lại (AVAILABLE).`)) {
      try {
        await depositApi.updateDepositStatus(deposit.id, 'REFUNDED');
        if (deposit.vehicleId) {
          await vehicleApi.updateVehicleStatus(deposit.vehicleId, 'AVAILABLE');
        }
        showNotice(`Đã hoàn tất thủ tục hoàn cọc cho đơn ${deposit.depositCode}. Xe đã mở bán lại.`);
        loadLedger();
      } catch (err) {
        alert('Lỗi hoàn cọc: ' + err.message);
      }
    }
  };

  const filteredDeposits = deposits.filter((item) => {
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const kw = keyword.toLowerCase().trim();
    const matchSearch =
      !kw ||
      item.depositCode?.toLowerCase().includes(kw) ||
      item.customerName?.toLowerCase().includes(kw) ||
      item.vehicleTitle?.toLowerCase().includes(kw) ||
      item.customerPhone?.includes(kw);

    return matchStatus && matchSearch;
  });

  // Tính toán KPI thống kê sổ cái
  const totalAmount = deposits
    .filter((d) => d.status === 'DEPOSITED')
    .reduce((sum, d) => sum + (Number(d.depositAmount) || 20000000), 0);
  const totalActiveDeposits = deposits.filter((d) => d.status === 'DEPOSITED').length;
  const totalRefunded = deposits.filter((d) => d.status === 'REFUNDED').length;

  return (
    <div style={{ maxWidth: '1180px', margin: '36px auto', padding: '0 20px 60px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaBook style={{ color: '#2563eb' }} /> Sổ Cái Quản Lý Đơn Đặt Cọc (Admin Deposit Ledger)
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Theo dõi tổng doanh số tiền cọc giữ chỗ, kiểm soát trạng thái giao dịch và xử lý hoàn trả cọc
        </p>
      </div>

      {notice && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
          ✓ {notice}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FaMoneyBillWave />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Tổng tiền cọc đang giữ</div>
            <strong style={{ fontSize: '18px', color: '#1e3a8a' }}>{formatFullPrice(totalAmount)}</strong>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FaReceipt />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Số đơn cọc hợp lệ</div>
            <strong style={{ fontSize: '18px', color: '#16a34a' }}>{totalActiveDeposits} đơn</strong>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FaUndo />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Đơn đã hoàn cọc</div>
            <strong style={{ fontSize: '18px', color: '#dc2626' }}>{totalRefunded} đơn</strong>
          </div>
        </div>
      </div>

      {/* Toolbar tìm kiếm và lọc */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '20px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '240px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', background: '#f8fafc' }}>
          <FaSearch style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Tìm theo mã cọc, tên khách hàng, số điện thoại, tên xe..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'DEPOSITED', 'REFUNDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: statusFilter === st ? '#2563eb' : '#e2e8f0',
                backgroundColor: statusFilter === st ? '#2563eb' : '#ffffff',
                color: statusFilter === st ? '#ffffff' : '#64748b'
              }}
            >
              {st === 'ALL' && 'Tất cả'}
              {st === 'DEPOSITED' && 'Đang giữ cọc'}
              {st === 'REFUNDED' && 'Đã hoàn cọc'}
            </button>
          ))}
        </div>
      </div>

      {/* Bảng danh sách đơn cọc */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải sổ cái đặt cọc...</div>
      ) : filteredDeposits.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Không có đơn cọc nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>Mã đơn cọc</th>
                <th style={{ padding: '12px 16px' }}>Khách hàng</th>
                <th style={{ padding: '12px 16px' }}>Xe đặt cọc</th>
                <th style={{ padding: '12px 16px' }}>Số tiền cọc</th>
                <th style={{ padding: '12px 16px' }}>Lịch hẹn</th>
                <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeposits.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                    {item.depositCode}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <strong style={{ color: '#0f172a' }}>{item.customerName}</strong>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{item.customerPhone}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: '600' }}>
                      <FaCar style={{ color: '#2563eb' }} /> {item.vehicleTitle}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#ea580c', fontWeight: '700' }}>
                    {formatFullPrice(item.depositAmount || 20000000)}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>
                    {item.appointmentDate} ({item.appointmentTime})
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {item.status === 'DEPOSITED' ? (
                      <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                        ✓ Đang giữ cọc
                      </span>
                    ) : item.status === 'REFUNDED' ? (
                      <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                        Đã hoàn cọc
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {item.status === 'DEPOSITED' && (
                      <button
                        onClick={() => handleRefund(item)}
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Hoàn tiền cọc
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDepositLedgerPage;

