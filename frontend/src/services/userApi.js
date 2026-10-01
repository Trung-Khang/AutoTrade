import apiClient from './api';

const STORAGE_KEY_ADMIN_USERS = 'autotrade_admin_users_list';

// Dữ liệu mẫu đồng bộ với PostgreSQL app_users
const INITIAL_USERS = [
  {
    id: 1,
    username: 'admin',
    fullName: 'Quản trị viên Hệ thống',
    email: 'admin@autotrade.vn',
    phone: '0901234567',
    role: 'ADMIN',
    active: true,
    emailVerified: true,
    locked: false,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 2,
    username: 'staff',
    fullName: 'Nhân viên Showroom',
    email: 'staff@autotrade.vn',
    phone: '0902345678',
    role: 'STAFF',
    active: true,
    emailVerified: true,
    locked: false,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 3,
    username: 'customer',
    fullName: 'Khách hàng Demo',
    email: 'customer@autotrade.vn',
    phone: '0903456789',
    role: 'CUSTOMER',
    active: true,
    emailVerified: true,
    locked: false,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 11,
    username: 'trungkhang',
    fullName: 'Nguyễn Trung Khang',
    email: 'nguyentrungkhang3001@gmail.com',
    phone: '0912345678',
    role: 'CUSTOMER',
    active: true,
    emailVerified: true,
    locked: false,
    createdAt: '2026-10-01T15:08:42Z'
  },
  {
    id: 12,
    username: 'ngochuy',
    fullName: 'Hoàng Ngọc Huy',
    email: 'huyhoang.260806@gmail.com',
    phone: '0922008156',
    role: 'CUSTOMER',
    active: true,
    emailVerified: true,
    locked: false,
    createdAt: '2026-10-01T15:14:27Z'
  },
  {
    id: 13,
    username: 'trongson',
    fullName: 'Trọng Sơn',
    email: '24133023@student.hcmute.edu.vn',
    phone: '0934567890',
    role: 'CUSTOMER',
    active: true,
    emailVerified: true,
    locked: false,
    createdAt: '2026-10-01T15:49:34Z'
  }
];

const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_USERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Không thể đọc danh sách người dùng từ localStorage', e);
  }
  return [...INITIAL_USERS];
};

const saveStoredUsers = (users) => {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Không thể lưu danh sách người dùng vào localStorage', e);
  }
};

export const userApi = {
  /**
   * Lấy danh sách tài khoản cho Admin (kèm tìm kiếm, lọc vai trò, trạng thái khóa, phân trang)
   * Target endpoint Backend: GET /api/v1/admin/users
   */
  getUsers: async (params = {}) => {
    try {
      const data = await apiClient.get('/admin/users', { params });
      if (data && Array.isArray(data.content)) {
        return {
          content: data.content,
          totalElements: data.totalElements || data.content.length,
          totalPages: data.totalPages || 1,
          page: data.page ?? 0,
          size: data.size ?? 20,
        };
      }
      if (Array.isArray(data)) {
        return {
          content: data,
          totalElements: data.length,
          totalPages: 1,
          page: 0,
          size: data.length,
        };
      }
    } catch {
      // Backend chưa có endpoint -> Fallback Mock Engine
    }

    let list = getStoredUsers();
    const { keyword, role, status } = params;

    if (keyword && keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.fullName && u.fullName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q))
      );
    }

    if (role && role !== 'ALL') {
      list = list.filter((u) => u.role === role);
    }

    if (status && status !== 'ALL') {
      if (status === 'LOCKED') {
        list = list.filter((u) => u.locked === true);
      } else if (status === 'ACTIVE') {
        list = list.filter((u) => u.locked === false);
      }
    }

    return {
      content: list,
      totalElements: list.length,
      totalPages: 1,
      page: 0,
      size: list.length,
    };
  },

  /**
   * Đổi trạng thái khóa/mở khóa tài khoản
   * Target endpoint Backend: PATCH /api/v1/admin/users/{id}/status
   */
  updateUserStatus: async (userId, locked) => {
    try {
      const updated = await apiClient.patch(`/admin/users/${userId}/status`, null, {
        params: { locked },
      });
      return updated;
    } catch {
      // Fallback local
    }

    const list = getStoredUsers();
    const idx = list.findIndex((u) => u.id === Number(userId));
    if (idx !== -1) {
      list[idx].locked = locked;
      saveStoredUsers(list);
      return list[idx];
    }
    throw new Error('Không tìm thấy tài khoản người dùng.');
  },

  /**
   * Đổi vai trò tài khoản (CUSTOMER <-> STAFF <-> ADMIN)
   * Target endpoint Backend: PATCH /api/v1/admin/users/{id}/role
   */
  updateUserRole: async (userId, role) => {
    try {
      const updated = await apiClient.patch(`/admin/users/${userId}/role`, null, {
        params: { role },
      });
      return updated;
    } catch {
      // Fallback local
    }

    const list = getStoredUsers();
    const idx = list.findIndex((u) => u.id === Number(userId));
    if (idx !== -1) {
      list[idx].role = role;
      saveStoredUsers(list);
      return list[idx];
    }
    throw new Error('Không tìm thấy tài khoản người dùng.');
  },
};

export default userApi;
