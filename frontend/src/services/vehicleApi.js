import apiClient from './api';
import { MOCK_VEHICLES } from '../utils/mockVehicles';

/**
 * Service giao tiếp với Listing REST API của Spring Boot Backend (TV1 bàn giao).
 * Endpoint chính thức:
 *   - GET /api/v1/listings : Danh sách, tìm kiếm, lọc đa tiêu chí, phân trang & sắp xếp
 *   - GET /api/v1/listings/{id} : Chi tiết tin đăng dạng phẳng ListingResponseDto
 */
export const vehicleApi = {
  /**
   * Lấy danh sách tin đăng rao bán xe (hỗ trợ tìm kiếm, lọc, phân trang, sắp xếp)
   * @param {Object} params - Query params (keyword, brand, model, minPrice, maxPrice, minYear, maxYear, fuelType, transmission, location, page, size, sort...)
   * @returns {Promise<Object>} Đối tượng phân trang: { content: Array, totalElements, totalPages, page, size }
   */
  getListings: async (params = {}) => {
    try {
      // Gọi API chính thức từ Backend TV1: GET /api/v1/listings
      const data = await apiClient.get('/listings', { params });
      
      // Xử lý dữ liệu trả về từ Spring Data PageResponse
      if (data && Array.isArray(data.content)) {
        return {
          content: data.content,
          totalElements: data.totalElements || data.content.length,
          totalPages: data.totalPages || 1,
          page: data.page || 0,
          size: data.size || 20,
          isFirst: data.first ?? true,
          isLast: data.last ?? true,
        };
      }

      // Nếu backend trả về mảng trực tiếp
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
      console.warn('Backend API chưa sẵn sàng hoặc kết nối lỗi. Đang fallback sang Mock Data.', error.message);
      
      // Giả lập xử lý lọc trên Mock Data ở local để test giao diện
      let filtered = [...MOCK_VEHICLES];
      
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.brand?.toLowerCase().includes(kw) ||
            v.model?.toLowerCase().includes(kw) ||
            v.variant?.toLowerCase().includes(kw) ||
            v.location?.toLowerCase().includes(kw)
        );
      }
      if (params.brand) {
        filtered = filtered.filter((v) => v.brand?.toLowerCase() === params.brand.toLowerCase());
      }
      if (params.minPrice) {
        filtered = filtered.filter((v) => Number(v.price) >= Number(params.minPrice));
      }
      if (params.maxPrice) {
        filtered = filtered.filter((v) => Number(v.price) <= Number(params.maxPrice));
      }
      if (params.minYear) {
        filtered = filtered.filter((v) => Number(v.manufacture_year || v.manufactureYear) >= Number(params.minYear));
      }
      if (params.maxYear) {
        filtered = filtered.filter((v) => Number(v.manufacture_year || v.manufactureYear) <= Number(params.maxYear));
      }
      if (params.fuelType) {
        filtered = filtered.filter((v) => (v.fuel_type || v.fuelType)?.toLowerCase() === params.fuelType.toLowerCase());
      }
      if (params.transmission) {
        filtered = filtered.filter((v) => (v.transmission)?.toLowerCase() === params.transmission.toLowerCase());
      }

      // Giả lập sắp xếp
      if (params.sort === 'price,asc') {
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (params.sort === 'price,desc') {
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
      }

      await new Promise((resolve) => setTimeout(resolve, 250));

      return {
        content: filtered,
        totalElements: filtered.length,
        totalPages: 1,
        page: 0,
        size: filtered.length,
        isFirst: true,
        isLast: true,
      };
    }
  },

  /**
   * Lấy chi tiết tin đăng theo ID
   * @param {string|number} id - ID của tin đăng
   * @returns {Promise<Object>} ListingResponseDto
   */
  getListingById: async (id) => {
    try {
      // Gọi API chính thức từ Backend TV1: GET /api/v1/listings/{id}
      const data = await apiClient.get(`/listings/${id}`);
      return data;
    } catch (error) {
      console.warn(`Backend API chưa sẵn sàng hoặc không tìm thấy tin #${id}. Đang fallback sang Mock Data.`, error.message);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const found = MOCK_VEHICLES.find((v) => String(v.id) === String(id));
      if (!found) {
        throw new Error(`Không tìm thấy tin đăng xe với ID #${id}`);
      }
      return found;
    }
  },

  // Alias tương thích ngược cho Inc 1
  getVehicles: async (params = {}) => {
    const res = await vehicleApi.getListings(params);
    return res.content || [];
  },
  getVehicleById: (id) => vehicleApi.getListingById(id),
};

export default vehicleApi;
