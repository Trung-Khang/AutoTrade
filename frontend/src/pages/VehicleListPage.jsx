import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import VehicleGrid from '../components/vehicle/VehicleGrid';
import FilterPanel from '../components/filter/FilterPanel';
import vehicleApi from '../services/vehicleApi';
import { FaCar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './VehicleListPage.css';

const VehicleListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const locationFromUrl = searchParams.get('location') || '';

  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trạng thái bộ lọc tìm kiếm
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    location: locationFromUrl,
    brand: searchParams.get('brand') || '',
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

  // Đồng bộ location từ URL query param khi người dùng bấm từ Showroom hoặc link trực tiếp
  useEffect(() => {
    const locParam = searchParams.get('location') || '';
    if (locParam !== filters.location) {
      setFilters((prev) => ({
        ...prev,
        location: locParam,
        page: 0,
      }));
    }
  }, [searchParams]);

  // Cập nhật bộ lọc
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 0,
    }));
  };

  // Đặt lại bộ lọc
  const handleResetFilters = () => {
    setSearchParams({});
    setFilters({
      keyword: '',
      location: '',
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
          <h1 className="page-title">Kho Xe Showroom AutoTrade</h1>
        </div>
        {!isLoading && !error && (
          <div className="vehicle-count-badge">
            <FaCar /> <span>{pagination.totalElements} xe trong kho</span>
            {filters.location && (
              <span
                style={{
                  marginLeft: 10,
                  padding: '3px 10px',
                  background: '#fef3c7',
                  color: '#92400e',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {filters.location}
              </span>
            )}
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

      {/* Thanh điều khiển phân trang chuyên nghiệp */}
      {!isLoading && !error && pagination.totalPages > 1 && (
        <div className="pagination-wrapper">
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn nav-btn"
              disabled={pagination.page === 0}
              onClick={() => handlePageChange(0)}
              title="Về trang đầu tiên"
            >
              « Đầu
            </button>

            <button
              type="button"
              className="pagination-btn nav-btn"
              disabled={pagination.page === 0}
              onClick={() => handlePageChange(pagination.page - 1)}
              title="Trang trước"
            >
              <FaChevronLeft /> Trước
            </button>

            {/* Danh sách các số trang thông minh */}
            <div className="pagination-numbers">
              {(() => {
                const current = pagination.page;
                const total = pagination.totalPages;
                const delta = 2; // Hiển thị 2 trang trước và sau
                const range = [];

                for (let i = Math.max(0, current - delta); i <= Math.min(total - 1, current + delta); i++) {
                  range.push(i);
                }

                return (
                  <>
                    {range[0] > 0 && (
                      <>
                        <button
                          type="button"
                          className={`page-num-btn ${current === 0 ? 'active' : ''}`}
                          onClick={() => handlePageChange(0)}
                        >
                          1
                        </button>
                        {range[0] > 1 && <span className="pagination-ellipsis">...</span>}
                      </>
                    )}

                    {range.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`page-num-btn ${current === p ? 'active' : ''}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p + 1}
                      </button>
                    ))}

                    {range[range.length - 1] < total - 1 && (
                      <>
                        {range[range.length - 1] < total - 2 && <span className="pagination-ellipsis">...</span>}
                        <button
                          type="button"
                          className={`page-num-btn ${current === total - 1 ? 'active' : ''}`}
                          onClick={() => handlePageChange(total - 1)}
                        >
                          {total}
                        </button>
                      </>
                    )}
                  </>
                );
              })()}
            </div>

            <button
              type="button"
              className="pagination-btn nav-btn"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => handlePageChange(pagination.page + 1)}
              title="Trang sau"
            >
              Sau <FaChevronRight />
            </button>

            <button
              type="button"
              className="pagination-btn nav-btn"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => handlePageChange(pagination.totalPages - 1)}
              title="Tới trang cuối cùng"
            >
              Cuối »
            </button>
          </div>

          <div className="pagination-meta">
            <span className="pagination-info">
              Trang <strong>{pagination.page + 1}</strong> / <strong>{pagination.totalPages}</strong> (Tổng cộng <strong>{pagination.totalElements.toLocaleString('vi-VN')}</strong> xe)
            </span>

            {/* Chuyển trang nhanh */}
            <form
              className="pagination-jump-form"
              onSubmit={(e) => {
                e.preventDefault();
                const target = parseInt(e.target.elements.jumpPage.value, 10);
                if (!isNaN(target) && target >= 1 && target <= pagination.totalPages) {
                  handlePageChange(target - 1);
                  e.target.reset();
                }
              }}
            >
              <span>Đến trang:</span>
              <input
                type="number"
                name="jumpPage"
                min={1}
                max={pagination.totalPages}
                placeholder={String(pagination.page + 1)}
                className="jump-input"
              />
              <button type="submit" className="jump-btn">Đi</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleListPage;
