import React, { useCallback, useEffect, useMemo, useState } from 'react';
import depositApi from '../services/depositApi';
import { formatFullPrice } from '../utils/formatters';
import {
  FaMoneyBillWave,
  FaCalendarAlt,
  FaHistory,
  FaUndoAlt,
  FaSearch,
  FaSyncAlt,
  FaPhoneAlt,
  FaCar,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExchangeAlt,
  FaTimes,
  FaExclamationTriangle,
  FaClipboardList
} from 'react-icons/fa';
import './AdminDepositLedgerPage.css';

const formatLocalIso = (value) => {
  if (!value) return '';
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
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'ledger'

  // Modal states
  const [rescheduleModal, setRescheduleModal] = useState({ isOpen: false, item: null, newDate: '', reason: '' });
  const [cancelModal, setCancelModal] = useState({ isOpen: false, item: null, reason: 'Theo yêu cầu khách hàng' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [appointmentRows, ledgerData] = await Promise.all([
        depositApi.getAdminAppointments(),
        depositApi.getAdminLedger()
      ]);
      setAppointments(appointmentRows || []);
      setLedger(ledgerData || { transactions: [], totalHoldingAmount: 0 });
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredAppointments = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return appointments.filter((item) => {
      const matchesKeyword =
        !needle ||
        [item.depositCode, item.customerName, item.customerPhone, item.vehicleInfo]
          .some((val) => val?.toLowerCase().includes(needle));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (item.status && item.status.toUpperCase() === statusFilter.toUpperCase());

      return matchesKeyword && matchesStatus;
    });
  }, [appointments, keyword, statusFilter]);

  const transactions = ledger.transactions || [];
  const refundedCount = transactions.filter((t) => t.transactionType === 'REFUND').length;
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;

  // Open reschedule modal
  const openRescheduleModal = (item) => {
    setRescheduleModal({
      isOpen: true,
      item,
      newDate: formatLocalIso(item.appointmentDate),
      reason: ''
    });
  };

  // Submit reschedule
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    const { item, newDate, reason } = rescheduleModal;
    if (!newDate) {
      setError('Vui lòng chọn ngày giờ mới cho lịch hẹn.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await depositApi.rescheduleAppointment(item.id, newDate, reason);
      setNotice(`Đã dời lịch hẹn ${item.depositCode || `#${item.id}`} thành công.`);
      setRescheduleModal({ isOpen: false, item: null, newDate: '', reason: '' });
      await load();
    } catch (err) {
      setError(err.message || 'Không thể đổi lịch hẹn.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open cancel modal
  const openCancelModal = (item) => {
    setCancelModal({
      isOpen: true,
      item,
      reason: 'Theo yêu cầu khách hàng'
    });
  };

  // Submit cancel & refund
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    const { item, reason } = cancelModal;
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy lịch hẹn.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await depositApi.cancelAppointment(item.id, reason.trim());
      setNotice(`Đã hủy lịch hẹn và ghi nhận hoàn trả tiền cọc cho đơn ${item.depositCode || `#${item.id}`}.`);
      setCancelModal({ isOpen: false, item: null, reason: '' });
      await load();
    } catch (err) {
      setError(err.message || 'Không thể hủy lịch và hoàn cọc.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <span className="status-pill pending"><FaClock /> Chờ xử lý</span>;
      case 'DEPOSITED':
        return <span className="status-pill deposited"><FaCheckCircle /> Đã đặt cọc</span>;
      case 'COMPLETED':
      case 'CONFIRMED':
        return <span className="status-pill completed"><FaCheckCircle /> Hoàn tất</span>;
      case 'CANCELLED':
        return <span className="status-pill cancelled"><FaTimesCircle /> Đã hủy</span>;
      case 'REFUNDED':
        return <span className="status-pill refunded"><FaUndoAlt /> Đã hoàn cọc</span>;
      default:
        return <span className="status-pill unknown">{status || 'Chưa rõ'}</span>;
    }
  };

  return (
    <div className="admin-ledger-page">
      {/* Header */}
      <div className="ledger-header">
        <div className="ledger-header-title">
          <h1>Quản lý Lịch hẹn & Sổ cái Đặt cọc</h1>
          <p>Hệ thống giám sát tiền cọc bảo chứng và quản lý lịch hẹn trực tiếp giữa khách hàng & showroom.</p>
        </div>
        <button
          type="button"
          className={`ledger-refresh-btn ${loading ? 'spinning' : ''}`}
          onClick={load}
          disabled={loading}
        >
          <FaSyncAlt />
          <span>{loading ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="ledger-alert error">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="ledger-alert success">
          <FaCheckCircle />
          <span>{notice}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="ledger-stats-grid">
        <div className="stat-card holding">
          <div className="stat-icon-wrapper">
            <FaMoneyBillWave />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tiền cọc đang giữ</span>
            <span className="stat-value">{formatFullPrice(ledger.totalHoldingAmount || 0)}</span>
            <span className="stat-sub">Quỹ bảo chứng giao dịch</span>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon-wrapper">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <span className="stat-label">Lịch hẹn chờ xử lý</span>
            <span className="stat-value">{pendingCount} lịch</span>
            <span className="stat-sub">Tổng {appointments.length} lịch hẹn</span>
          </div>
        </div>

        <div className="stat-card ledger">
          <div className="stat-icon-wrapper">
            <FaHistory />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tổng bút toán sổ cái</span>
            <span className="stat-value">{ledger.totalTransactions || transactions.length}</span>
            <span className="stat-sub">Ghi nhận vào hệ thống</span>
          </div>
        </div>

        <div className="stat-card refund">
          <div className="stat-icon-wrapper">
            <FaUndoAlt />
          </div>
          <div className="stat-content">
            <span className="stat-label">Giao dịch đã hoàn tiền</span>
            <span className="stat-value">{refundedCount} lần</span>
            <span className="stat-sub">Theo yêu cầu khách / Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="ledger-tabs">
        <button
          type="button"
          className={`ledger-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <FaClipboardList />
          <span>Danh sách Lịch hẹn</span>
          <span className="tab-badge">{appointments.length}</span>
        </button>

        <button
          type="button"
          className={`ledger-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <FaHistory />
          <span>Nhật ký Sổ cái (Ledger)</span>
          <span className="tab-badge">{transactions.length}</span>
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <section>
          {/* Filter Bar */}
          <div className="ledger-filter-bar">
            <div className="search-box-wrapper">
              <FaSearch className="search-box-icon" />
              <input
                type="text"
                className="search-box-input"
                placeholder="Tìm kiếm mã cọc, khách hàng, số điện thoại, xe..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <select
              className="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái lịch</option>
              <option value="PENDING">Chờ xử lý (PENDING)</option>
              <option value="COMPLETED">Đã hoàn tất (COMPLETED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>

          {/* Table */}
          <div className="table-card">
            {loading && appointments.length === 0 ? (
              <div className="empty-state">
                <FaSyncAlt className="spinning" />
                <p>Đang tải danh sách lịch hẹn...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="empty-state">
                <FaCalendarAlt />
                <p>Không tìm thấy lịch hẹn nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-ledger-table">
                  <thead>
                    <tr>
                      <th>Mã Đơn Cọc</th>
                      <th>Khách Hàng</th>
                      <th>Xe Quan Tâm</th>
                      <th>Thời Gian Hẹn</th>
                      <th>Tiền Đặt Cọc</th>
                      <th>Trạng Thái Lịch</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="cell-code">
                            {item.depositCode || `#${item.id}`}
                          </span>
                        </td>
                        <td>
                          <div className="customer-cell">
                            <span className="customer-name">{item.customerName || 'Khách hàng'}</span>
                            <span className="customer-phone">
                              <FaPhoneAlt /> {item.customerPhone || 'Chưa cập nhật SĐT'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="vehicle-cell">
                            <FaCar />
                            <span>{item.vehicleInfo || `Xe #${item.vehicleId}`}</span>
                          </div>
                        </td>
                        <td>
                          <div className="datetime-cell">
                            <span className="datetime-date">
                              {new Date(item.appointmentDate).toLocaleDateString('vi-VN')}
                            </span>
                            <span className="datetime-time">
                              {new Date(item.appointmentDate).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="deposit-cell">
                            <span className="deposit-amount">
                              {item.depositAmount ? formatFullPrice(item.depositAmount) : 'Chưa có cọc'}
                            </span>
                            {getStatusBadge(item.depositStatus)}
                          </div>
                        </td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td>
                          <div className="action-buttons-group">
                            {item.status === 'PENDING' ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-action reschedule"
                                  onClick={() => openRescheduleModal(item)}
                                  title="Đổi sang thời gian hẹn khác"
                                >
                                  <FaExchangeAlt /> Đổi lịch
                                </button>
                                <button
                                  type="button"
                                  className="btn-action cancel"
                                  onClick={() => openCancelModal(item)}
                                  title="Hủy lịch hẹn và mở lại xe"
                                >
                                  <FaUndoAlt /> Hủy & Hoàn cọc
                                </button>
                              </>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Đã đóng</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: LEDGER */}
      {activeTab === 'ledger' && (
        <section>
          <div className="table-card">
            {transactions.length === 0 ? (
              <div className="empty-state">
                <FaHistory />
                <p>{loading ? 'Đang tải sổ cái...' : 'Chưa có bút toán nào được ghi nhận.'}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-ledger-table">
                  <thead>
                    <tr>
                      <th>Thời Điểm</th>
                      <th>Mã Đơn Cọc</th>
                      <th>Loại Giao Dịch</th>
                      <th>Số Tiền</th>
                      <th>Trạng Thái</th>
                      <th>Ghi Chú Nghiệp Vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((entry) => {
                      const matchedAppt = appointments.find((a) => a.depositId === entry.depositId);
                      const isPositive = Number(entry.amount) > 0;
                      return (
                        <tr key={entry.id}>
                          <td>
                            <div className="datetime-cell">
                              <span className="datetime-date">
                                {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('vi-VN') : '-'}
                              </span>
                              <span className="datetime-time">
                                {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString('vi-VN') : ''}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="cell-code">
                              {matchedAppt?.depositCode || entry.depositId ? `DEP-${entry.depositId}` : '-'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${
                                entry.transactionType === 'REFUND' ? 'refunded' : 'deposited'
                              }`}
                            >
                              {entry.transactionType === 'REFUND' ? 'HOÀN CỌC' : 'NHẬN CỌC'}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                color: isPositive ? '#15803d' : '#b91c1c'
                              }}
                            >
                              {isPositive ? '+' : ''}{formatFullPrice(entry.amount)}
                            </span>
                          </td>
                          <td>{getStatusBadge(entry.status)}</td>
                          <td>
                            <span style={{ color: '#475569', fontSize: '13.5px' }}>
                              {entry.note || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* MODAL: RESCHEDULE */}
      {rescheduleModal.isOpen && (
        <div className="modal-overlay" onClick={() => setRescheduleModal({ ...rescheduleModal, isOpen: false })}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đổi Lịch Hẹn Xem Xe</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setRescheduleModal({ ...rescheduleModal, isOpen: false })}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit}>
              <div className="modal-body">
                <div className="modal-info-box">
                  <strong>Khách hàng:</strong> {rescheduleModal.item?.customerName} ({rescheduleModal.item?.customerPhone})<br />
                  <strong>Phương tiện:</strong> {rescheduleModal.item?.vehicleInfo}
                </div>

                <div className="modal-field">
                  <label htmlFor="newAppointmentDate">Thời gian hẹn mới *</label>
                  <input
                    id="newAppointmentDate"
                    type="datetime-local"
                    className="modal-input"
                    value={rescheduleModal.newDate}
                    onChange={(e) => setRescheduleModal({ ...rescheduleModal, newDate: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-field">
                  <label htmlFor="rescheduleReason">Lý do điều chỉnh lịch (tùy chọn)</label>
                  <input
                    id="rescheduleReason"
                    type="text"
                    className="modal-input"
                    placeholder="VD: Khách hàng xin đổi sang ca chiều..."
                    value={rescheduleModal.reason}
                    onChange={(e) => setRescheduleModal({ ...rescheduleModal, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRescheduleModal({ ...rescheduleModal, isOpen: false })}
                  disabled={submitting}
                >
                  Đóng
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Đang cập nhật...' : 'Xác nhận đổi lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL & REFUND */}
      {cancelModal.isOpen && (
        <div className="modal-overlay" onClick={() => setCancelModal({ ...cancelModal, isOpen: false })}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hủy Lịch & Hoàn Trả Tiền Cọc</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setCancelModal({ ...cancelModal, isOpen: false })}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCancelSubmit}>
              <div className="modal-body">
                <div className="modal-info-box danger">
                  <FaExclamationTriangle style={{ marginRight: 6 }} />
                  <strong>Lưu ý:</strong> Hành động này sẽ hủy lịch hẹn, ghi nhận hoàn tiền cọc{' '}
                  <strong>{formatFullPrice(cancelModal.item?.depositAmount || 0)}</strong> vào sổ cái, và mở lại trạng thái xe thành <strong>AVAILABLE</strong>.
                </div>

                <div className="modal-field">
                  <label htmlFor="cancelReason">Lý do hủy lịch & hoàn tiền cọc *</label>
                  <textarea
                    id="cancelReason"
                    rows="3"
                    className="modal-textarea"
                    placeholder="Nhập lý do cụ thể..."
                    value={cancelModal.reason}
                    onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCancelModal({ ...cancelModal, isOpen: false })}
                  disabled={submitting}
                >
                  Bỏ qua
                </button>
                <button type="submit" className="btn-danger" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : 'Xác nhận hủy & Hoàn cọc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
