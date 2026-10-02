import apiClient from './api';
import { MOCK_VEHICLES } from '../utils/mockVehicles';

const STORAGE_KEY_VEHICLES = 'autotrade_vehicles_list';

// Helper load danh sách xe
const getStoredVehicles = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VEHICLES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Không thể đọc xe từ localStorage', e);
  }
  return [...MOCK_VEHICLES];
};

// Helper lưu danh sách xe
const saveStoredVehicles = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(list));
  } catch (e) {
    console.error('Không thể lưu xe vào localStorage', e);
  }
};

/**
 * Service quản lý kho xe khớp chuẩn 100% với TV1 Contract v3.0.0:
 * - Public: GET /api/v1/vehicles, GET /api/v1/vehicles/{id}
 * - Admin: POST /api/v1/admin/vehicles, PUT /api/v1/admin/vehicles/{id}, DELETE /api/v1/admin/vehicles/{id}, PATCH /api/v1/admin/vehicles/{id}/status
 */
export const vehicleApi = {
  /**
   * Lấy danh sách xe showroom (hỗ trợ tìm kiếm, lọc, phân trang, sắp xếp)
   * Endpoint TV1: GET /api/v1/vehicles
   */
  getListings: async (params = {}) => {
    try {
      const data = await apiClient.get('/vehicles', { params });
      if (data && Array.isArray(data.content)) {
        const currentPage = data.pageNo ?? data.page ?? 0;
        const totalPages = data.totalPages || 1;
        return {
          content: data.content,
          totalElements: data.totalElements || data.content.length,
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
    } catch (error) {
      console.warn('Backend API /vehicles chưa sẵn sàng. Fallback sang Local Storage / Mock.', error.message);
      
      let list = getStoredVehicles();

      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        list = list.filter(
          (v) =>
            v.brand?.toLowerCase().includes(kw) ||
            v.model?.toLowerCase().includes(kw) ||
            v.variant?.toLowerCase().includes(kw) ||
            v.location?.toLowerCase().includes(kw)
        );
      }
      if (params.brand) {
        list = list.filter((v) => v.brand?.toLowerCase() === params.brand.toLowerCase());
      }
      if (params.status) {
        list = list.filter((v) => v.status === params.status);
      }
      if (params.minPrice) {
        list = list.filter((v) => Number(v.price) >= Number(params.minPrice));
      }
      if (params.maxPrice) {
        list = list.filter((v) => Number(v.price) <= Number(params.maxPrice));
      }
      if (params.minYear) {
        list = list.filter((v) => Number(v.manufacture_year || v.manufactureYear) >= Number(params.minYear));
      }
      if (params.maxYear) {
        list = list.filter((v) => Number(v.manufacture_year || v.manufactureYear) <= Number(params.maxYear));
      }
      if (params.fuelType) {
        list = list.filter((v) => (v.fuel_type || v.fuelType)?.toLowerCase() === params.fuelType.toLowerCase());
      }
      if (params.transmission) {
        list = list.filter((v) => (v.transmission)?.toLowerCase() === params.transmission.toLowerCase());
      }

      // Sắp xếp
      if (params.sort === 'price,asc') {
        list.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (params.sort === 'price,desc') {
        list.sort((a, b) => Number(b.price) - Number(a.price));
      }

      return {
        content: list,
        totalElements: list.length,
        totalPages: 1,
        page: 0,
        size: list.length,
      };
    }
  },

  /**
   * Lấy chi tiết xe theo ID
   * Endpoint TV1: GET /api/v1/vehicles/{id}
   */
  getListingById: async (id) => {
    try {
      const data = await apiClient.get(`/vehicles/${id}`);
      return data;
    } catch (error) {
      console.warn(`Backend API /vehicles/${id} chưa sẵn sàng. Tìm xe #${id} trong Local Storage.`, error.message);
      const list = getStoredVehicles();
      const found = list.find((v) => String(v.id) === String(id));
      if (!found) {
        throw new Error(`Không tìm thấy thông tin xe với ID #${id}`);
      }
      return found;
    }
  },

  /**
   * Thêm xe mới vào kho (Dành cho Quản trị viên / Admin)
   * Endpoint TV1: POST /api/v1/admin/vehicles
   */
  createVehicle: async (vehicleData) => {
    try {
      const response = await apiClient.post('/admin/vehicles', vehicleData);
      return response;
    } catch (error) {
      console.warn('Backend API POST /admin/vehicles chưa sẵn sàng. Tạo mới trong Local Storage.', error.message);
      const list = getStoredVehicles();
      const newCar = {
        id: Date.now(),
        vin: vehicleData.vin || `VN-${(vehicleData.brand || 'CAR').toUpperCase()}-${Date.now().toString().slice(-4)}`,
        status: 'AVAILABLE',
        listed_at: new Date().toISOString(),
        ...vehicleData,
        price: Number(vehicleData.price) || 0,
        mileage: Number(vehicleData.mileage) || 0,
        manufacture_year: Number(vehicleData.manufacture_year || vehicleData.manufactureYear) || 2022,
        manufactureYear: Number(vehicleData.manufacture_year || vehicleData.manufactureYear) || 2022,
      };
      list.unshift(newCar);
      saveStoredVehicles(list);
      return newCar;
    }
  },

  /**
   * Cập nhật thông tin xe (Dành cho Quản trị viên / Admin)
   * Endpoint TV1: PUT /api/v1/admin/vehicles/{id}
   */
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await apiClient.put(`/admin/vehicles/${id}`, vehicleData);
      return response;
    } catch (error) {
      console.warn(`Backend API PUT /admin/vehicles/${id} chưa sẵn sàng. Cập nhật trong Local Storage.`, error.message);
      const list = getStoredVehicles();
      const index = list.findIndex((v) => String(v.id) === String(id));
      if (index !== -1) {
        list[index] = { ...list[index], ...vehicleData };
        saveStoredVehicles(list);
        return list[index];
      }
      throw new Error(`Không tìm thấy xe #${id} để sửa.`);
    }
  },

  /**
   * Xoá xe khỏi hệ thống (Admin)
   * Endpoint TV1: DELETE /api/v1/admin/vehicles/{id}
   */
  deleteVehicle: async (id) => {
    try {
      await apiClient.delete(`/admin/vehicles/${id}`);
      return true;
    } catch (error) {
      console.warn(`Backend API DELETE /admin/vehicles/${id} chưa sẵn sàng. Xoá trong Local Storage.`, error.message);
      let list = getStoredVehicles();
      list = list.filter((v) => String(v.id) !== String(id));
      saveStoredVehicles(list);
      return true;
    }
  },

  /**
   * Cập nhật trạng thái xe (AVAILABLE / HOLD / RESERVED / SOLD)
   * Endpoint TV1: PATCH /api/v1/admin/vehicles/{id}/status?status=...
   */
  updateVehicleStatus: async (id, newStatus) => {
    try {
      const response = await apiClient.patch(`/admin/vehicles/${id}/status`, null, {
        params: { status: newStatus }
      });
      return response;
    } catch (error) {
      console.warn(`Backend PATCH status xe #${id} chưa sẵn sàng. Cập nhật Local Storage.`, error.message);
      const list = getStoredVehicles();
      const car = list.find((v) => String(v.id) === String(id));
      if (car) {
        car.status = newStatus;
        saveStoredVehicles(list);
        return car;
      }
      return { id, status: newStatus };
    }
  },

  // Alias tương thích
  getVehicles: async (params = {}) => {
    const res = await vehicleApi.getListings(params);
    return res.content || [];
  },
  getVehicleById: (id) => vehicleApi.getListingById(id),
};

export default vehicleApi;
