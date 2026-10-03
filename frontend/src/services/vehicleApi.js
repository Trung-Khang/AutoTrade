import apiClient from './api';

/**
 * Service quản lý kho xe khớp chuẩn 100% với TV1/TV4 Contract:
 * - Public: GET /api/v1/vehicles, GET /api/v1/vehicles/{id}
 * - Admin: POST /api/v1/admin/vehicles, PUT /api/v1/admin/vehicles/{id}, DELETE /api/v1/admin/vehicles/{id}, PATCH /api/v1/admin/vehicles/{id}/status
 * Đã gỡ bỏ toàn bộ fallback mock / local storage để sử dụng 100% dữ liệu thực từ Backend (3.812 tin đăng).
 */
export const vehicleApi = {
  /**
   * Lấy danh sách xe showroom từ Backend (hỗ trợ tìm kiếm, lọc, phân trang, sắp xếp)
   * TV3 xác nhận: 3.812 tin đăng / 191 trang
   */
  getListings: async (params = {}) => {
    const data = await apiClient.get('/vehicles', { params });
    if (data && Array.isArray(data.content)) {
      const currentPage = data.pageNo ?? data.page ?? 0;
      const totalPages = data.totalPages || 1;
      return {
        content: data.content,
        totalElements: data.totalElements ?? data.content.length,
        totalPages: totalPages,
        page: currentPage,
        size: data.pageSize ?? data.size ?? 20,
        isFirst: data.first ?? (currentPage === 0),
        isLast: data.last ?? (currentPage >= totalPages - 1),
      };
    }
    if (Array.isArray(data)) {
      return {
        content: data,
        totalElements: data.length,
        totalPages: 1,
        page: 0,
        size: data.length,
        isFirst: true,
        isLast: true,
      };
    }
    return data;
  },

  /**
   * Lấy chi tiết xe theo ID từ Backend
   */
  getListingById: async (id) => {
    return await apiClient.get(`/vehicles/${id}`);
  },

  /**
   * Thêm xe mới vào kho (Admin)
   */
  createVehicle: async (vehicleData) => {
    return await apiClient.post('/admin/vehicles', vehicleData);
  },

  /**
   * Cập nhật thông tin xe (Admin)
   */
  updateVehicle: async (id, vehicleData) => {
    return await apiClient.put(`/admin/vehicles/${id}`, vehicleData);
  },

  /**
   * Xoá xe khỏi hệ thống (Admin)
   */
  deleteVehicle: async (id) => {
    await apiClient.delete(`/admin/vehicles/${id}`);
    return true;
  },

  /**
   * Cập nhật trạng thái xe (AVAILABLE / HOLD / RESERVED / SOLD) (Admin)
   */
  updateVehicleStatus: async (id, newStatus) => {
    return await apiClient.patch(`/admin/vehicles/${id}/status`, null, {
      params: { status: newStatus }
    });
  },

  // Alias tương thích
  getVehicles: async (params = {}) => {
    const res = await vehicleApi.getListings(params);
    return res.content || [];
  },
  getVehicleById: (id) => vehicleApi.getListingById(id),
};

export default vehicleApi;
