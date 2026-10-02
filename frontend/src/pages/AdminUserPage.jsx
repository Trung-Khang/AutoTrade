import React, { useState, useEffect, useMemo } from 'react';
import { userApi } from '../services/userApi';
import { useAuth } from '../context/AuthContext';
import {
  FaUsers,
  FaUserTie,
  FaShieldAlt,
  FaUser,
  FaLock,
  FaUnlock,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelope,
  FaPhone,
  FaTrashAlt
} from 'react-icons/fa';
import './AdminUserPage.css';

const AdminUserPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [toast, setToast] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch users list
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.getUsers({
        keyword,
        role: selectedRole,
        status: selectedStatus,
      });
      setUsers(res.content || []);
    } catch {
      showToast('error', 'Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [keyword, selectedRole, selectedStatus]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // KPI Counts
  const kpis = useMemo(() => {
    const total = users.length;
    const customerCount = users.filter((u) => u.role === 'CUSTOMER').length;
    const staffCount = users.filter((u) => u.role === 'STAFF').length;
    const adminCount = users.filter((u) => u.role === 'ADMIN').length;
    const lockedCount = users.filter((u) => u.locked).length;
    return { total, customerCount, staffCount, adminCount, lockedCount };
  }, [users]);

  // Toggle Lock/Unlock Status
  const handleToggleStatus = async (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      alert('Bạn không thể tự khóa tài khoản quản trị đang đăng nhập của chính mình!');
      return;
    }

    const actionText = targetUser.locked ? 'Mở khóa' : 'Khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản "${targetUser.username}"?`)) {
      return;
    }

    setActionLoadingId(targetUser.id);
    try {
      const nextLockedState = !targetUser.locked;
      await userApi.updateUserStatus(targetUser.id, nextLockedState);
      showToast('success', `Đã ${actionText.toLowerCase()} tài khoản "${targetUser.username}" thành công.`);
      fetchUsers();
    } catch (err) {
      showToast('error', err.message || 'Thao tác không thành công.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Change Role
  const handleChangeRole = async (targetUser, newRole) => {
    if (targetUser.id === currentUser?.id && newRole !== 'ADMIN') {
      alert('Bạn không thể tự hạ quyền Admin của chính mình!');
      return;
    }

    if (!window.confirm(`Đổi vai trò tài khoản "${targetUser.username}" thành "${newRole}"?`)) {
      return;
    }

    setActionLoadingId(targetUser.id);
    try {
      await userApi.updateUserRole(targetUser.id, newRole);
      showToast('success', `Đã cập nhật vai trò tài khoản "${targetUser.username}" thành ${newRole}.`);
      fetchUsers();
    } catch (err) {
      showToast('error', err.message || 'Cập nhật vai trò thất bại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete User with Constraints Check
  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      alert('Bạn không thể tự xóa tài khoản quản trị đang đăng nhập của chính mình!');
      return;
    }

    if (!window.confirm(
      `CẢNH BÁO XÓA TÀI KHOẢN:\n\n` +
      `Bạn có chắc chắn muốn xóa tài khoản "${targetUser.username}" (${targetUser.fullName || 'Chưa cập nhật tên'})?\n\n` +
      `* Quy tắc hệ thống: Chỉ xóa được tài khoản khi người dùng này KHÔNG CÓ lịch hẹn và KHÔNG CÓ đơn đặt cọc nào.`
    )) {
      return;
    }

    setActionLoadingId(targetUser.id);
    try {
      const res = await userApi.deleteUser(targetUser.id);
      showToast('success', res.message || `Đã xóa tài khoản "${targetUser.username}" thành công.`);
      fetchUsers();
    } catch (err) {
      showToast('error', err.message || 'Không thể xóa tài khoản này.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="admin-users-container">
      {/* Page Header */}
      <div className="admin-users-header">
        <h1 className="admin-users-title">Quản lý Tài khoản & Phân quyền</h1>
        <p className="admin-users-subtitle">
          Quản trị toàn bộ danh sách người dùng, phân bổ vai trò RBAC và kiểm soát trạng thái hoạt động tài khoản
        </p>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className={`admin-toast-alert ${toast.type}`}>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="admin-users-kpi-grid">
        <div className="admin-kpi-card">
          <div className="kpi-icon-box total">
            <FaUsers />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tổng tài khoản</span>
            <span className="kpi-value">{kpis.total}</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box customer">
            <FaUser />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Khách hàng</span>
            <span className="kpi-value">{kpis.customerCount}</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box staff">
            <FaUserTie />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Nhân viên</span>
            <span className="kpi-value">{kpis.staffCount}</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box admin">
            <FaShieldAlt />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Quản trị viên</span>
            <span className="kpi-value">{kpis.adminCount}</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box locked">
            <FaLock />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tài khoản bị khóa</span>
            <span className="kpi-value">{kpis.lockedCount}</span>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="admin-users-toolbar">
        <div className="search-box-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm theo username, họ tên, email, số điện thoại..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="ALL">-- Tất cả vai trò --</option>
            <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
            <option value="STAFF">Nhân viên (STAFF)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
          </select>

          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">-- Tất cả trạng thái --</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã bị khóa</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="admin-users-table-card">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Người dùng</th>
                <th>Liên hệ</th>
                <th>Vai trò (RBAC)</th>
                <th>Xác thực</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-empty-state">
                    <p>Đang tải danh sách người dùng...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-state">
                    <p>Không tìm thấy tài khoản nào phù hợp với bộ lọc.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isBusy = actionLoadingId === u.id;

                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600, color: '#888888' }}>#{u.id}</td>

                      {/* User Info */}
                      <td>
                        <div className="user-identity-cell">
                          <div className="user-avatar-circle">
                            {(u.fullName || u.username).charAt(0).toUpperCase()}
                          </div>
                          <div className="user-text-info">
                            <span className="user-full-name">
                              {u.fullName || u.username} {isCurrent && '(Bạn)'}
                            </span>
                            <span className="user-username">@{u.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <FaEnvelope style={{ color: '#888888', fontSize: '12px' }} />
                            {u.email}
                          </span>
                          {u.phone && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666666' }}>
                              <FaPhone style={{ color: '#888888', fontSize: '12px' }} />
                              {u.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Role Dropdown */}
                      <td>
                        <select
                          className="role-inline-select"
                          value={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value)}
                          disabled={isBusy}
                        >
                          <option value="CUSTOMER">CUSTOMER (Khách hàng)</option>
                          <option value="STAFF">STAFF (Nhân viên)</option>
                          <option value="ADMIN">ADMIN (Quản trị viên)</option>
                        </select>
                      </td>

                      {/* Email Verification */}
                      <td>
                        {u.emailVerified ? (
                          <span className="verify-tag verified">
                            <FaCheckCircle style={{ marginRight: '4px' }} /> Đã xác thực
                          </span>
                        ) : (
                          <span className="verify-tag unverified">
                            <FaTimesCircle style={{ marginRight: '4px' }} /> Chưa xác thực
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        {u.locked ? (
                          <span className="status-pill locked">
                            <FaLock style={{ fontSize: '10px' }} /> Bị khóa
                          </span>
                        ) : (
                          <span className="status-pill active">
                            <FaCheckCircle style={{ fontSize: '10px' }} /> Hoạt động
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className={`btn-status-toggle ${u.locked ? 'unlock' : 'lock'}`}
                            onClick={() => handleToggleStatus(u)}
                            disabled={isBusy || isCurrent}
                            title={isCurrent ? 'Không thể tự khóa tài khoản của bạn' : (u.locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản')}
                          >
                            {u.locked ? (
                              <>
                                <FaUnlock /> Mở khóa
                              </>
                            ) : (
                              <>
                                <FaLock /> Khóa lại
                              </>
                            )}
                          </button>

                          <button
                            className="btn-user-delete"
                            onClick={() => handleDeleteUser(u)}
                            disabled={isBusy || isCurrent}
                            title={isCurrent ? 'Không thể tự xóa tài khoản của bạn' : 'Xóa tài khoản người dùng'}
                          >
                            <FaTrashAlt /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUserPage;
