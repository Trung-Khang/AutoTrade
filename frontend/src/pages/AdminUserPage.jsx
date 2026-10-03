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
  FaTrashAlt,
  FaEdit,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import { normalizeVietnamesePhone, validateVietnamesePhone } from '../utils/phonePolicy';
import './AdminUserPage.css';

const SHOWROOM_OPTIONS = [
  { id: 1, label: 'TP. Hồ Chí Minh' },
  { id: 2, label: 'Hà Nội' },
  { id: 3, label: 'Đà Nẵng' },
];

const AdminUserPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [toast, setToast] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [selectedShowroomId, setSelectedShowroomId] = useState('');

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

  const openCustomerEditor = (targetUser) => {
    setEditingUser(targetUser);
    setEditFullName(targetUser.fullName || '');
    setEditPhone(targetUser.phone || '');
    setToast(null);
  };

  const closeCustomerEditor = () => {
    if (!actionLoadingId) {
      setEditingUser(null);
    }
  };

  const handleUpdateCustomerProfile = async (event) => {
    event.preventDefault();
    const phoneState = validateVietnamesePhone(editPhone);
    if (!editFullName.trim()) {
      showToast('error', 'Họ tên không được để trống.');
      return;
    }
    if (phoneState.state !== 'success') {
      showToast('error', phoneState.message);
      return;
    }
    setActionLoadingId(editingUser.id);
    try {
      await userApi.updateCustomerProfile(editingUser.id, {
        fullName: editFullName.trim(),
        phone: normalizeVietnamesePhone(editPhone),
      });
      showToast('success', 'Đã cập nhật thông tin Customer @' + editingUser.username + '.');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      showToast('error', err.message || 'Cập nhật thông tin Customer thất bại.');
    } finally {
      setActionLoadingId(null);
    }
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

  const saveRoleChange = async (targetUser, newRole, showroomId = null) => {
    if (targetUser.id === currentUser?.id && newRole !== 'ADMIN') {
      alert('Bạn không thể tự hạ quyền Admin của chính mình!');
      return;
    }

    if (!window.confirm(`Đổi vai trò tài khoản "${targetUser.username}" thành "${newRole}"?`)) {
      return;
    }

    setActionLoadingId(targetUser.id);
    try {
      await userApi.updateUserRole(targetUser.id, newRole, showroomId);
      showToast('success', `Đã cập nhật vai trò tài khoản "${targetUser.username}" thành ${newRole}.`);
      setRoleChangeTarget(null);
      fetchUsers();
    } catch (err) {
      showToast('error', err.message || 'Cập nhật vai trò thất bại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Staff phải được gán showroom trước khi gửi thay đổi role lên Backend.
  const handleChangeRole = (targetUser, newRole) => {
    if (newRole === 'STAFF') {
      setRoleChangeTarget(targetUser);
      setSelectedShowroomId(targetUser.showroomId ? String(targetUser.showroomId) : '');
      setToast(null);
      return;
    }
    saveRoleChange(targetUser, newRole, null);
  };

  const submitRoleChange = (event) => {
    event.preventDefault();
    if (!selectedShowroomId) {
      showToast('error', 'Vui lòng chọn chi nhánh cho tài khoản STAFF.');
      return;
    }
    saveRoleChange(roleChangeTarget, 'STAFF', Number(selectedShowroomId));
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

      {editingUser && (
        <div className="admin-user-modal-backdrop" role="presentation" onMouseDown={closeCustomerEditor}>
          <div className="admin-user-modal" role="dialog" aria-modal="true" aria-labelledby="customer-profile-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="admin-user-modal-header">
              <div>
                <h2 id="customer-profile-title">Chỉnh sửa thông tin Customer</h2>
                <p>@{editingUser.username}</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={closeCustomerEditor} title="Đóng">
                <FaTimes />
              </button>
            </div>
            <form className="admin-user-modal-form" onSubmit={handleUpdateCustomerProfile}>
              <label>
                Họ và tên
                <input value={editFullName} onChange={(event) => setEditFullName(event.target.value)} maxLength={120} required />
              </label>
              <label>
                Số điện thoại
                <input
                  value={editPhone}
                  onChange={(event) => setEditPhone(event.target.value)}
                  className={editPhone ? (validateVietnamesePhone(editPhone).state === 'success' ? 'input-success' : 'input-error') : ''}
                  inputMode="tel"
                  maxLength={15}
                  required
                />
                <span className={'admin-phone-hint ' + validateVietnamesePhone(editPhone).state}>
                  {validateVietnamesePhone(editPhone).message}
                </span>
              </label>
              <div className="admin-user-modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={closeCustomerEditor}>Hủy</button>
                <button type="submit" className="modal-save-btn" disabled={actionLoadingId === editingUser.id}>
                  <FaSave /> {actionLoadingId === editingUser.id ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roleChangeTarget && (
        <div className="admin-user-modal-backdrop" role="presentation" onMouseDown={() => !actionLoadingId && setRoleChangeTarget(null)}>
          <div className="admin-user-modal" role="dialog" aria-modal="true" aria-labelledby="staff-showroom-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="admin-user-modal-header">
              <div>
                <h2 id="staff-showroom-title">Gán chi nhánh cho Staff</h2>
                <p>@{roleChangeTarget.username}</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setRoleChangeTarget(null)} title="Đóng"><FaTimes /></button>
            </div>
            <form className="admin-user-modal-form" onSubmit={submitRoleChange}>
              <label>
                Vai trò
                <input value="STAFF (Nhân viên)" readOnly />
              </label>
              <label>
                Chi nhánh phụ trách
                <select value={selectedShowroomId} onChange={(event) => setSelectedShowroomId(event.target.value)} required>
                  <option value="">-- Chọn chi nhánh --</option>
                  {SHOWROOM_OPTIONS.map((showroom) => <option key={showroom.id} value={showroom.id}>{showroom.label}</option>)}
                </select>
              </label>
              <div className="admin-user-modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setRoleChangeTarget(null)}>Hủy</button>
                <button type="submit" className="modal-save-btn" disabled={Boolean(actionLoadingId)}><FaSave /> Lưu phân công</button>
              </div>
            </form>
          </div>
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
                <th className="col-id">ID</th>
                <th className="col-user">Người dùng</th>
                <th className="col-contact">Liên hệ</th>
                <th className="col-role">Vai trò (RBAC)</th>
                <th className="col-verify">Xác thực</th>
                <th className="col-status">Trạng thái</th>
                <th className="col-actions">Thao tác</th>
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
                      <td className="col-id">#{u.id}</td>

                      {/* User Info */}
                      <td className="col-user">
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
                      <td className="col-contact">
                        <div className="user-contact-cell">
                          <span className="user-contact-item">
                            <FaEnvelope className="contact-icon" />
                            {u.email}
                          </span>
                          {u.phone && (
                            <span className="user-contact-item phone">
                              <FaPhone className="contact-icon" />
                              {u.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Role Dropdown */}
                      <td className="col-role">
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
                        {u.role === 'STAFF' && (
                          <small className="staff-showroom-label">
                            {SHOWROOM_OPTIONS.find((showroom) => showroom.id === Number(u.showroomId))?.label || 'Chưa phân chi nhánh'}
                          </small>
                        )}
                      </td>

                      {/* Email Verification */}
                      <td className="col-verify">
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
                      <td className="col-status">
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
                      <td className="col-actions">
                        <div className="user-action-buttons-cell">
                          {u.role === 'CUSTOMER' && (
                            <button
                              className="btn-user-edit"
                              onClick={() => openCustomerEditor(u)}
                              disabled={isBusy}
                              title="Chỉnh sửa họ tên và số điện thoại Customer"
                            >
                              <FaEdit /> Sửa
                            </button>
                          )}

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
