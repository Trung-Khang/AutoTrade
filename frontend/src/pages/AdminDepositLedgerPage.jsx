import React, { useCallback, useEffect, useMemo, useState } from 'react';
import depositApi from '../services/depositApi';
import { formatFullPrice } from '../utils/formatters';

const dateValue = (value) => {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export default function AdminDepositLedgerPage() {
  const [appointments, setAppointments] = useState([]);
  const [ledger, setLedger] = useState({ transactions: [], totalHoldingAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [appointmentRows, ledgerData] = await Promise.all([
        depositApi.getAdminAppointments(), depositApi.getAdminLedger()
      ]);
      setAppointments(appointmentRows || []);
      setLedger(ledgerData || { transactions: [], totalHoldingAmount: 0 });
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu từ backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return appointments.filter((item) => !needle || [item.depositCode, item.customerName, item.customerPhone, item.vehicleInfo]
      .some((value) => value?.toLowerCase().includes(needle)));
  }, [appointments, keyword]);

  const handleReschedule = async (item) => {
    const proposed = prompt('Nhập ngày giờ mới (YYYY-MM-DDTHH:mm):', dateValue(item.appointmentDate));
    if (!proposed) return;
    const reason = prompt('Lý do đổi lịch (không bắt buộc):', '') ?? '';
    setBusyId(item.id);
    setError('');
    try {
      await depositApi.rescheduleAppointment(item.id, proposed, reason);
      setNotice(`Đã cập nhật lịch hẹn ${item.depositCode || `#${item.id}`}. Lý do: ${reason.trim() || 'Không cung cấp'}.`);
      await load();
    } catch (err) { setError(err.message || 'Không đổi được lịch hẹn.'); }
    finally { setBusyId(null); }
  };

  const handleCancel = async (item) => {
    const reason = prompt(`Lý do hủy lịch ${item.depositCode || `#${item.id}`} (bắt buộc):`, 'Theo yêu cầu khách hàng');
    if (reason === null) return;
    if (!reason.trim()) { setError('Vui lòng nhập lý do hủy lịch.'); return; }
    if (!window.confirm('Hủy lịch và hoàn toàn bộ tiền cọc? Xe sẽ được mở lại.')) return;
    setBusyId(item.id);
    setError('');
    try {
      await depositApi.cancelAppointment(item.id, reason.trim());
      setNotice(`Đã hủy lịch và ghi nhận hoàn cọc ${item.depositCode || `#${item.id}`}.`);
      await load();
    } catch (err) { setError(err.message || 'Không hủy được lịch hẹn.'); }
    finally { setBusyId(null); }
  };

  const transactions = ledger.transactions || [];
  const refundedCount = transactions.filter((item) => item.transactionType === 'REFUND').length;

  return <div style={{ maxWidth: 1180, margin: '36px auto', padding: '0 20px 60px' }}>
    <header style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 24, color: '#0f172a' }}>Quản lý lịch hẹn và sổ cái đặt cọc</h1>
      <p style={{ color: '#64748b' }}>Lịch hẹn lấy từ PostgreSQL dùng chung với Staff.</p>
    </header>
    {error && <div role="alert" style={{ padding: 12, marginBottom: 16, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>{error}</div>}
    {notice && <div role="status" style={{ padding: 12, marginBottom: 16, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>{notice}</div>}
    <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
      <strong>Tiền cọc đang giữ: {formatFullPrice(ledger.totalHoldingAmount || 0)}</strong>
      <span>Số bút toán: {ledger.totalTransactions || 0}</span><span>Số lần hoàn: {refundedCount}</span>
      <button type="button" onClick={load}>Tải lại</button>
    </div>

    <section>
      <h2>Lịch hẹn ({appointments.length})</h2>
      <input aria-label="Tìm lịch hẹn" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm mã cọc, khách hàng, xe..." style={{ marginBottom: 12, padding: 9, width: 'min(100%, 420px)' }} />
      {loading ? <p>Đang tải lịch hẹn...</p> : filtered.length === 0 ? <p>Không có lịch hẹn phù hợp.</p> : <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead><tr>{['Mã cọc', 'Khách hàng', 'Xe', 'Ngày giờ', 'Cọc', 'Lịch hẹn', 'Thao tác'].map((label) => <th key={label} style={{ padding: 10, borderBottom: '1px solid #cbd5e1' }}>{label}</th>)}</tr></thead>
          <tbody>{filtered.map((item) => <tr key={item.id}>
            <td style={{ padding: 10 }}>{item.depositCode || `#${item.id}`}</td>
            <td style={{ padding: 10 }}>{item.customerName}<br />{item.customerPhone}</td>
            <td style={{ padding: 10 }}>{item.vehicleInfo}</td>
            <td style={{ padding: 10 }}>{new Date(item.appointmentDate).toLocaleString()}</td>
            <td style={{ padding: 10 }}>{item.depositStatus || '-'}<br />{item.depositAmount ? formatFullPrice(item.depositAmount) : ''}</td>
            <td style={{ padding: 10 }}>{item.status}</td>
            <td style={{ padding: 10, whiteSpace: 'nowrap' }}>{item.status === 'PENDING' && <>
              <button type="button" disabled={busyId === item.id} onClick={() => handleReschedule(item)}>Đổi lịch</button>{' '}
              <button type="button" disabled={busyId === item.id || item.depositStatus !== 'DEPOSITED'} onClick={() => handleCancel(item)}>Hủy và hoàn cọc</button>
            </>}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>

    <section style={{ marginTop: 36 }}>
      <h2>Bút toán sổ cái</h2>
      {transactions.length === 0 ? <p>{loading ? 'Đang tải sổ cái...' : 'Chưa có bút toán.'}</p> : <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead><tr>{['Thời điểm', 'Mã đơn cọc', 'Loại', 'Số tiền', 'Trạng thái', 'Ghi chú'].map((label) => <th key={label} style={{ padding: 10, borderBottom: '1px solid #cbd5e1' }}>{label}</th>)}</tr></thead>
          <tbody>{transactions.map((entry) => <tr key={entry.id}>
            <td style={{ padding: 10 }}>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '-'}</td>
            <td style={{ padding: 10 }}>{appointments.find((item) => item.depositId === entry.depositId)?.depositCode || entry.depositId}</td>
            <td style={{ padding: 10 }}>{entry.transactionType}</td><td style={{ padding: 10 }}>{formatFullPrice(entry.amount)}</td>
            <td style={{ padding: 10 }}>{entry.status}</td><td style={{ padding: 10 }}>{entry.note}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
  </div>;
}
