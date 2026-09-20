import React, { useState, useEffect, useCallback } from 'react';
import VehicleGrid from '../components/vehicle/VehicleGrid';
import FilterPanel from '../components/filter/FilterPanel';
import vehicleApi from '../services/vehicleApi';
import { FaCar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './VehicleListPage.css';

const VehicleListPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trạng thái bộ lọc tìm kiếm
  const [filters, setFilters] = useState({
    keyword: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    fuelType: '',
    transmission: '',
    sort: 'id,desc',
    page: 0,
    size: 20,
  });

  // Trạng thái phân trang từ PageResponse
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 1,
    page: 0,
    size: 20,
    isFirst: true,
    isLast: true,
  });

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Lọc bỏ các params rỗng trước khi gửi lên API
      const cleanParams = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          cleanParams[key] = filters[key];
        }
      });

      const res = await vehicleApi.getListings(cleanParams);

      setVehicles(res.content || []);
      setPagination({
        totalElements: res.totalElements || (res.content ? res.content.length : 0),
        totalPages: res.totalPages || 1,
        page: res.page || 0,
        size: res.size || 20,
        isFirst: res.isFirst ?? true,
        isLast: res.isLast ?? true,
      });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách xe. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Cập nhật bộ lọc
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 0, // Reset về trang 1 khi đổi bộ lọc
    }));
  };

  // Đặt lại bộ lọc
  const handleResetFilters = () => {
    setFilters({
      keyword: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      fuelType: '',
      transmission: '',
      sort: 'id,desc',
      page: 0,
      size: 20,
    });
  };

  // Chuyển trang
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setFilters((prev) => ({
        ...prev,
        page: newPage,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="vehicle-list-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tìm kiếm & Lọc xe thị trường</h1>
          <p className="page-subtitle">
            Dữ liệu tin đăng rao bán xe ô tô cũ được đồng bộ từ các sàn trực tuyến uy tín
          </p>
        </div>
        {!isLoading && !error && (
          <div className="vehicle-count-badge">
            <FaCar /> <span>{pagination.totalElements} tin đăng tìm thấy</span>
          </div>
        )}
      </div>

      {/* Component Bộ lọc */}
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Lưới hiển thị danh sách xe */}
      <VehicleGrid
        vehicles={vehicles}
        isLoading={isLoading}
        error={error}
        onRetry={fetchListings}
      />

      {/* Thanh điều khiển phân trang */}
      {!isLoading && !error && pagination.totalPages > 1 && (
        <div className="pagination-wrapper">
          <button
            type="button"
            className="pagination-btn"
            disabled={pagination.isFirst}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            <FaChevronLeft /> Trang trước
          </button>

          <span className="pagination-info">
            Trang <strong>{pagination.page + 1}</strong> / <strong>{pagination.totalPages}</strong>
          </span>

          <button
            type="button"
            className="pagination-btn"
            disabled={pagination.isLast}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Trang sau <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default VehicleListPage;
