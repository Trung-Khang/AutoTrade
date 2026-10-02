import React from 'react';
import { FaSearch, FaUndo, FaFilter } from 'react-icons/fa';
import './FilterPanel.css';

const BRANDS = ['Tất cả', 'Toyota', 'Mazda', 'Honda', 'Hyundai', 'Kia', 'Ford', 'Mitsubishi'];
const FUEL_TYPES = ['Tất cả', 'Xăng', 'Dầu', 'Hybrid', 'Điện'];
const TRANSMISSIONS = ['Tất cả', 'Tự động', 'Số sàn'];

const LOCATIONS = [
  { label: 'Tất cả khu vực', value: '' },
  { label: 'Hà Nội', value: 'Hà Nội' },
  { label: 'TP. Hồ Chí Minh', value: 'Hồ Chí Minh' },
  { label: 'Đà Nẵng', value: 'Đà Nẵng' },
  { label: 'Hải Phòng', value: 'Hải Phòng' },
  { label: 'Cần Thơ', value: 'Cần Thơ' },
  { label: 'Bình Dương', value: 'Bình Dương' },
  { label: 'Đồng Nai', value: 'Đồng Nai' },
  { label: 'Bà Rịa - Vũng Tàu', value: 'Vũng Tàu' },
  { label: 'Quảng Ninh', value: 'Quảng Ninh' },
  { label: 'Bắc Ninh', value: 'Bắc Ninh' },
  { label: 'Hải Dương', value: 'Hải Dương' },
  { label: 'Thái Nguyên', value: 'Thái Nguyên' },
  { label: 'Vĩnh Phúc', value: 'Vĩnh Phúc' },
  { label: 'Phú Thọ', value: 'Phú Thọ' },
  { label: 'Bắc Giang', value: 'Bắc Giang' },
  { label: 'Nam Định', value: 'Nam Định' },
  { label: 'Thái Bình', value: 'Thái Bình' },
  { label: 'Hưng Yên', value: 'Hưng Yên' },
  { label: 'Nghệ An', value: 'Nghệ An' },
  { label: 'Thanh Hóa', value: 'Thanh Hóa' },
  { label: 'Thừa Thiên Huế', value: 'Huế' },
  { label: 'Khánh Hòa', value: 'Khánh Hòa' },
  { label: 'Bình Định', value: 'Bình Định' },
  { label: 'Quảng Nam', value: 'Quảng Nam' },
  { label: 'Quảng Ngãi', value: 'Quảng Ngãi' },
  { label: 'Đắk Lắk', value: 'Đắk Lắk' },
  { label: 'Gia Lai', value: 'Gia Lai' },
  { label: 'Lâm Đồng', value: 'Lâm Đồng' },
  { label: 'Bình Thuận', value: 'Bình Thuận' },
  { label: 'Long An', value: 'Long An' },
  { label: 'Tiền Giang', value: 'Tiền Giang' },
  { label: 'An Giang', value: 'An Giang' },
  { label: 'Kiên Giang', value: 'Kiên Giang' },
  { label: 'Tây Ninh', value: 'Tây Ninh' },
];

const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: '', max: '' },
  { label: 'Dưới 500 triệu', min: '', max: 500000000 },
  { label: '500 - 700 triệu', min: 500000000, max: 700000000 },
  { label: '700 triệu - 1 tỷ', min: 700000000, max: 1000000000 },
  { label: 'Trên 1 tỷ', min: 1000000000, max: '' },
];

const FilterPanel = ({ filters, onFilterChange, onReset }) => {
  const handleKeywordChange = (e) => {
    onFilterChange('keyword', e.target.value);
  };

  const handleLocationChange = (e) => {
    onFilterChange('location', e.target.value);
  };

  const handleBrandChange = (e) => {
    onFilterChange('brand', e.target.value === 'Tất cả' ? '' : e.target.value);
  };

  const handleFuelChange = (e) => {
    onFilterChange('fuelType', e.target.value === 'Tất cả' ? '' : e.target.value);
  };

  const handleTransmissionChange = (e) => {
    onFilterChange('transmission', e.target.value === 'Tất cả' ? '' : e.target.value);
  };

  const handlePriceRangeChange = (e) => {
    const selected = PRICE_RANGES[Number(e.target.value)];
    if (selected) {
      onFilterChange('minPrice', selected.min);
      onFilterChange('maxPrice', selected.max);
    }
  };

  const handleSortChange = (e) => {
    onFilterChange('sort', e.target.value);
  };

  return (
    <div className="filter-panel-card">
      <div className="filter-header">
        <span className="filter-title">
          <FaFilter className="icon" /> Bộ lọc tìm kiếm
        </span>
        <button type="button" onClick={onReset} className="filter-reset-btn" title="Đặt lại bộ lọc">
          <FaUndo /> Đặt lại
        </button>
      </div>

      <div className="filter-grid-fields">
        {/* Tìm kiếm từ khóa */}
        <div className="filter-field-group keyword-field">
          <label>Từ khóa</label>
          <div className="input-search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Nhập tên xe, dòng xe, vị trí..."
              value={filters.keyword || ''}
              onChange={handleKeywordChange}
            />
          </div>
        </div>

        {/* Hãng xe */}
        <div className="filter-field-group">
          <label>Hãng xe</label>
          <select value={filters.brand || 'Tất cả'} onChange={handleBrandChange}>
            {BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Khu vực / Tỉnh thành */}
        <div className="filter-field-group">
          <label>Khu vực / Tỉnh thành</label>
          <select
            value={filters.location || ''}
            onChange={handleLocationChange}
          >
            {LOCATIONS.map((loc) => (
              <option key={loc.value || 'all'} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>

        {/* Khoảng giá */}
        <div className="filter-field-group">
          <label>Khoảng giá</label>
          <select onChange={handlePriceRangeChange} defaultValue="0">
            {PRICE_RANGES.map((r, idx) => (
              <option key={idx} value={idx}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nhiên liệu */}
        <div className="filter-field-group">
          <label>Nhiên liệu</label>
          <select value={filters.fuelType || 'Tất cả'} onChange={handleFuelChange}>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Hộp số */}
        <div className="filter-field-group">
          <label>Hộp số</label>
          <select value={filters.transmission || 'Tất cả'} onChange={handleTransmissionChange}>
            {TRANSMISSIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Sắp xếp */}
        <div className="filter-field-group">
          <label>Sắp xếp theo</label>
          <select value={filters.sort || 'id,desc'} onChange={handleSortChange}>
            <option value="id,desc">Mới nhất</option>
            <option value="price,asc">Giá thấp đến cao</option>
            <option value="price,desc">Giá cao đến thấp</option>
            <option value="manufactureYear,desc">Năm sản xuất mới nhất</option>
            <option value="mileage,asc">Số km (ODO) ít nhất</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;

