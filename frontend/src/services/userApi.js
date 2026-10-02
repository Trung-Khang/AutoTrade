import apiClient from './api';

export const userApi = {
  /**
   * Lấy danh sách tài khoản cho Admin (kèm tìm kiếm, lọc vai trò, trạng thái khóa, phân trang)
   * Target endpoint Backend: GET /api/v1/admin/users
   */
  getUsers: async (params = {}) => {
    const data = await apiClient.get('/admin/users', { params });
    if (data && Array.isArray(data.content)) {
      return {
        content: data.content,
        totalElements: data.totalElements ?? data.content.length,
        totalPages: data.totalPages ?? 1,
        page: data.page ?? 0,
        size: data.size ?? 20,
      };
    }
    if (Array.isArray(data)) {
      return { content: data, totalElements: data.length, totalPages: 1, page: 0, size: data.length };
    }
    throw new Error('Backend trả về dữ liệu tài khoản không hợp lệ.');
  },

  /**
   * Đổi trạng thái khóa/mở khóa tài khoản
   * Target endpoint Backend: PATCH /api/v1/admin/users/{id}/status
   */
  updateUserStatus: async (userId, locked) => {
    return apiClient.patch(`/admin/users/${userId}/status`, null, { params: { locked } });
  },

  /**
   * Đổi vai trò tài khoản (CUSTOMER <-> STAFF <-> ADMIN)
   * Target endpoint Backend: PATCH /api/v1/admin/users/{id}/role
   */
  updateUserRole: async (userId, role) => {
    return apiClient.patch(`/admin/users/${userId}/role`, null, { params: { role } });
  },

  /**
   * Xóa tài khoản người dùng (chỉ được xóa khi không có lịch hẹn hoặc đơn cọc)
   * Target endpoint Backend: DELETE /api/v1/admin/users/{id}
   */
  deleteUser: async (userId) => {
    try {
      const result = await apiClient.delete(`/admin/users/${userId}`);
      return result;
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw err;
    }
  },
};

export default userApi;
