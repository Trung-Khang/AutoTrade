import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaCheck, FaChevronLeft, FaChevronRight, FaEdit, FaPlus,
  FaSearch, FaTimes, FaTrash, FaWarehouse,
} from 'react-icons/fa';
import adminListingApi from '../services/adminListingApi';
import { formatFullPrice, formatMileage } from '../utils/formatters';
import './AdminVehiclePage.css';

const PAGE_SIZE = 20;
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80';
const SHOWROOM_OPTIONS = [
  { id: 1, label: 'TP. Hồ Chí Minh' },
  { id: 2, label: 'Hà Nội' },
  { id: 3, label: 'Đà Nẵng' },
];
const EMPTY_FORM = {
  brand: '', model: '', variant: '', manufactureYear: new Date().getFullYear(),
  price: '', mileage: '', fuelType: 'Gasoline', transmission: 'Automatic',
  engineSize: '', seatCount: 5, origin: 'Domestic', bodyType: 'Sedan',
  color: '', location: '', showroomId: '', imageUrl: '', status: 'AVAILABLE',
};

const toForm = (listing) => ({
  brand: listing.brand || '',
  model: listing.model || '',
  variant: listing.variant || '',
  manufactureYear: listing.manufactureYear || listing.manufacture_year || new Date().getFullYear(),
  price: listing.price ?? '',
  mileage: listing.mileage ?? '',
  fuelType: listing.fuelType || listing.fuel_type || 'Gasoline',
  transmission: listing.transmission || 'Automatic',
  engineSize: listing.engineSize || listing.engine_size || '',
  seatCount: listing.seatCount || listing.seat_count || 5,
  origin: listing.origin || 'Domestic',
  bodyType: listing.bodyType || listing.body_type || 'Sedan',
  color: listing.color || '',
  showroomId: listing.showroomId ?? '',
  location: listing.showroomId
    ? (SHOWROOM_OPTIONS.find((showroom) => showroom.id === Number(listing.showroomId))?.label || '')
    : '',
  imageUrl: listing.imageUrl || listing.image_url || '',
  status: listing.status || 'AVAILABLE',
});

const buildPageNumbers = (current, total) => {
  const pages = new Set([0, Math.max(0, total - 1)]);
  for (let page = Math.max(0, current - 2); page <= Math.min(total - 1, current + 2); page += 1) {
    pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
};

const AdminVehiclePage = () => {
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1, totalElements: 0, isFirst: true, isLast: true });
  const [page, setPage] = useState(0);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [showroomFilter, setShowroomFilter] = useState('ALL');
  const [jumpPage, setJumpPage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminListingApi.getListings({
        page, size: PAGE_SIZE, sort: 'id,desc',
        ...(keyword ? { keyword } : {}),
        ...(status !== 'ALL' ? { status } : {}),
        ...(showroomFilter !== 'ALL' && showroomFilter !== 'UNASSIGNED'
          ? { showroomId: Number(showroomFilter) }
          : {}),
        ...(showroomFilter === 'UNASSIGNED' ? { showroomUnassigned: true } : {}),
        ...(status === 'AVAILABLE' ? { depositEligible: true } : {}),
      });
      setListings(response.content);
      setPagination(response);
    } catch (err) {
      setListings([]);
      setError(err.message || 'Không thể tải danh sách tin xe.');
    } finally {
      setLoading(false);
    }
  }, [keyword, page, showroomFilter, status]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const pageNumbers = useMemo(
    () => buildPageNumbers(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages]
  );

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3000);
  };

  const changePage = (target) => {
    if (target >= 0 && target < pagination.totalPages && target !== page) {
      setPage(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(0);
    setKeyword(keywordInput.trim());
  };

  const openCreateModal = () => {
    setEditingListing(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const openEditModal = (listing) => {
    setEditingListing(listing);
    setFormData(toForm(listing));
    setIsModalOpen(true);
  };

  const setField = (field, value) => setFormData((current) => ({ ...current, [field]: value }));

  const saveListing = async (event) => {
    event.preventDefault();
    setBusyId(editingListing?.id || 'create');
    setError('');
    try {
      const payload = {
        ...formData,
        manufactureYear: Number(formData.manufactureYear),
        price: Number(formData.price),
        mileage: formData.mileage === '' ? null : Number(formData.mileage),
        engineSize: formData.engineSize === '' ? null : Number(formData.engineSize),
        seatCount: formData.seatCount === '' ? null : Number(formData.seatCount),
        showroomId: formData.showroomId === '' ? null : Number(formData.showroomId),
      };
      if (editingListing) {
        await adminListingApi.updateListing(editingListing.id, payload);
        showNotice(`Đã cập nhật tin xe #${editingListing.id}.`);
      } else {
        await adminListingApi.createListing(payload);
        showNotice('Đã thêm tin xe mới vào Kho xe và Showroom.');
        setPage(0);
      }
      setIsModalOpen(false);
      await loadListings();
    } catch (err) {
      setError(err.message || 'Không thể lưu tin xe.');
    } finally {
      setBusyId(null);
    }
  };

  const updateStatus = async (listing, nextStatus) => {
    setBusyId(listing.id);
    setError('');
    try {
      await adminListingApi.updateStatus(listing.id, nextStatus);
      showNotice(`Đã chuyển tin xe #${listing.id} sang ${nextStatus}.`);
      await loadListings();
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái tin xe.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteListing = async (listing) => {
    if (!window.confirm(`Xóa tin "${listing.brand} ${listing.model}" khỏi Kho xe và Showroom?`)) return;
    setBusyId(listing.id);
    setError('');
    try {
      await adminListingApi.deleteListing(listing.id);
      showNotice(`Đã xóa tin xe #${listing.id}.`);
      if (listings.length === 1 && page > 0) setPage(page - 1);
      else await loadListings();
    } catch (err) {
      setError(err.message || 'Không thể xóa tin xe.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header-row">
        <div>
          <h1>Quản Lý Kho Xe</h1>
        </div>
        <button type="button" onClick={openCreateModal} className="admin-btn-primary"><FaPlus /> Thêm xe</button>
      </div>

      {notice && <div className="admin-message success">{notice}</div>}
      {error && <div className="admin-message error">{error}</div>}

      <div className="admin-listing-toolbar">
        <form className="admin-search-form" onSubmit={submitSearch}>
          <FaSearch />
          <input value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} placeholder="Tìm theo hãng, dòng xe, phiên bản, khu vực..." />
          <button type="submit">Tìm</button>
        </form>
        <div className="admin-status-tabs" role="group" aria-label="Lọc trạng thái">
          {[
            ['ALL', 'Tất cả'], ['AVAILABLE', 'Đang mở bán'],
            ['HOLD', 'Đang giữ cọc'], ['SOLD', 'Đã bán'],
          ].map(([value, label]) => (
            <button type="button" key={value} className={status === value ? 'active' : ''} onClick={() => { setStatus(value); setPage(0); }}>
              {label}
            </button>
          ))}
        </div>
        <select
          className="admin-showroom-filter"
          value={showroomFilter}
          onChange={(event) => { setShowroomFilter(event.target.value); setPage(0); }}
          aria-label="Lọc theo thành phố showroom"
        >
          <option value="ALL">Tất cả thành phố</option>
          <option value="1">TP. Hồ Chí Minh</option>
          <option value="2">Hà Nội</option>
          <option value="3">Đà Nẵng</option>
          <option value="UNASSIGNED">Chưa phân chi nhánh</option>
        </select>
      </div>

      <div className="admin-table-container">
        <table className="admin-vehicle-table">
          <thead><tr><th>Ảnh</th><th>Tên xe & phiên bản</th><th>Năm SX</th><th>Giá niêm yết</th><th>ODO</th><th>Khu vực</th><th>Trạng thái kinh doanh</th><th>Thao tác</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="8" className="admin-table-state">Đang tải kho xe...</td></tr>}
            {!loading && listings.length === 0 && <tr><td colSpan="8" className="admin-table-state">Không có tin xe phù hợp.</td></tr>}
            {!loading && listings.map((listing) => {
              const currentStatus = listing.status || 'AVAILABLE';
              const isDepositEligible = listing.depositEligible === true;
              const isUnavailableForDeposit = currentStatus.toUpperCase() === 'AVAILABLE' && !isDepositEligible;
              const isBusy = busyId === listing.id;
              return (
                <tr key={listing.id}>
                  <td><img src={listing.imageUrl || listing.image_url || DEFAULT_IMAGE} alt={`${listing.brand || ''} ${listing.model || ''}`} className="admin-car-thumb" onError={(event) => { event.currentTarget.src = DEFAULT_IMAGE; }} /></td>
                  <td className="admin-listing-name"><strong>{listing.brand} {listing.model}</strong><span>{listing.variant || 'Tiêu chuẩn'} · {listing.transmission || 'Chưa xác định'}</span><small>Listing #{listing.id} · Vehicle #{listing.vehicleId}</small></td>
                  <td>{listing.manufactureYear || listing.manufacture_year || '—'}</td>
                  <td className="admin-price">{formatFullPrice(listing.price)}</td>
                  <td>{formatMileage(listing.mileage)}</td>
                  <td>{listing.location || 'Chưa xác định'}</td>
                  <td>
                    <select
                      className={`status-select ${isUnavailableForDeposit ? 'UNAVAILABLE' : currentStatus}`}
                      value={isUnavailableForDeposit ? 'UNAVAILABLE' : currentStatus}
                      disabled={isBusy || isUnavailableForDeposit}
                      title={isUnavailableForDeposit
                        ? 'Xe chưa được gán showroom vận hành nên chưa mở đặt cọc.'
                        : currentStatus === 'HOLD'
                          ? 'Xe đang có đơn giữ cọc; cần hủy lịch và hoàn cọc trước khi mở bán lại.'
                          : undefined}
                      onChange={(event) => updateStatus(listing, event.target.value)}
                    >
                      {isUnavailableForDeposit && <option value="UNAVAILABLE">Chưa mở đặt cọc</option>}
                      <option value="AVAILABLE">AVAILABLE (Mở bán)</option>
                      <option value="HOLD">HOLD (Giữ cọc)</option>
                      <option value="SOLD">SOLD (Đã bán)</option>
                    </select>
                  </td>
                  <td><div className="action-buttons-cell"><button type="button" onClick={() => openEditModal(listing)} disabled={isBusy} title="Sửa tin xe"><FaEdit /></button><button type="button" onClick={() => deleteListing(listing)} disabled={isBusy} title="Xóa tin xe"><FaTrash /></button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && pagination.totalPages > 1 && (
        <div className="admin-pagination">
          <div className="admin-pagination-buttons">
            <button type="button" disabled={pagination.isFirst} onClick={() => changePage(0)}>« Đầu</button>
            <button type="button" disabled={pagination.isFirst} onClick={() => changePage(page - 1)}><FaChevronLeft /> Trước</button>
            {pageNumbers.map((number, index) => <React.Fragment key={number}>{index > 0 && number - pageNumbers[index - 1] > 1 && <span>...</span>}<button type="button" className={number === pagination.page ? 'active' : ''} onClick={() => changePage(number)}>{number + 1}</button></React.Fragment>)}
            <button type="button" disabled={pagination.isLast} onClick={() => changePage(page + 1)}>Sau <FaChevronRight /></button>
            <button type="button" disabled={pagination.isLast} onClick={() => changePage(pagination.totalPages - 1)}>Cuối »</button>
          </div>
          <div className="admin-pagination-meta">
            <span>Trang <strong>{pagination.page + 1}</strong> / <strong>{pagination.totalPages}</strong> (Tổng cộng <strong>{pagination.totalElements.toLocaleString('vi-VN')}</strong> xe)</span>
            <form onSubmit={(event) => { event.preventDefault(); const target = Number(jumpPage); if (target >= 1 && target <= pagination.totalPages) changePage(target - 1); setJumpPage(''); }}>
              <label htmlFor="admin-jump-page">Đến trang:</label><input id="admin-jump-page" type="number" min="1" max={pagination.totalPages} value={jumpPage} onChange={(event) => setJumpPage(event.target.value)} /><button type="submit">Đi</button>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-modal-content" role="dialog" aria-modal="true" aria-labelledby="admin-listing-modal-title">
            <div className="admin-modal-header"><h2 id="admin-listing-modal-title">{editingListing ? `Chỉnh sửa tin xe #${editingListing.id}` : 'Thêm tin xe mới'}</h2><button type="button" onClick={() => setIsModalOpen(false)}><FaTimes /></button></div>
            <form onSubmit={saveListing}>
              <div className="admin-form-grid">
                <label>Hãng xe *<input value={formData.brand} onChange={(event) => setField('brand', event.target.value)} required /></label>
                <label>Dòng xe *<input value={formData.model} onChange={(event) => setField('model', event.target.value)} required /></label>
                <label>Phiên bản<input value={formData.variant} onChange={(event) => setField('variant', event.target.value)} /></label>
                <label>Năm sản xuất *<input type="number" min="1900" max="2100" value={formData.manufactureYear} onChange={(event) => setField('manufactureYear', event.target.value)} required /></label>
                <label>Giá niêm yết *<input type="number" min="1" value={formData.price} onChange={(event) => setField('price', event.target.value)} required /></label>
                <label>Số km đã đi<input type="number" min="0" value={formData.mileage} onChange={(event) => setField('mileage', event.target.value)} /></label>
                <label>Nhiên liệu<select value={formData.fuelType} onChange={(event) => setField('fuelType', event.target.value)}><option value="Gasoline">Xăng</option><option value="Diesel">Dầu Diesel</option><option value="Hybrid">Hybrid</option><option value="Electric">Điện</option></select></label>
                <label>Hộp số<select value={formData.transmission} onChange={(event) => setField('transmission', event.target.value)}><option value="Automatic">Tự động</option><option value="Manual">Số sàn</option><option value="CVT">CVT</option></select></label>
                <label>Kiểu dáng<input value={formData.bodyType} onChange={(event) => setField('bodyType', event.target.value)} /></label>
                <label>Xuất xứ<select value={formData.origin} onChange={(event) => setField('origin', event.target.value)}><option value="Domestic">Trong nước</option><option value="Imported">Nhập khẩu</option></select></label>
                <label>Số chỗ<input type="number" min="2" max="60" value={formData.seatCount} onChange={(event) => setField('seatCount', event.target.value)} /></label>
                <label>Dung tích động cơ<input type="number" min="0.1" step="0.1" value={formData.engineSize} onChange={(event) => setField('engineSize', event.target.value)} /></label>
                <label>Màu sắc<input value={formData.color} onChange={(event) => setField('color', event.target.value)} /></label>
                <label>Chi nhánh showroom *
                  <select
                    value={formData.showroomId}
                    onChange={(event) => {
                      const selectedId = event.target.value;
                      const selectedShowroom = SHOWROOM_OPTIONS.find((showroom) => String(showroom.id) === selectedId);
                      setFormData((current) => ({
                        ...current,
                        showroomId: selectedId,
                        location: selectedShowroom?.label || '',
                      }));
                    }}
                    required={!editingListing}
                  >
                    <option value="">Chưa phân chi nhánh</option>
                    {SHOWROOM_OPTIONS.map((showroom) => <option key={showroom.id} value={showroom.id}>{showroom.label}</option>)}
                  </select>
                </label>
                <label>Trạng thái<select value={formData.status} onChange={(event) => setField('status', event.target.value)}><option value="AVAILABLE">Đang mở bán</option><option value="HOLD">Đang giữ cọc</option><option value="SOLD">Đã bán</option></select></label>
                <label className="admin-form-wide">URL hình ảnh<input type="url" value={formData.imageUrl} onChange={(event) => setField('imageUrl', event.target.value)} /></label>
              </div>
              <div className="admin-modal-footer"><button type="button" className="admin-btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button><button type="submit" className="admin-btn-primary" disabled={busyId === 'create' || busyId === editingListing?.id}><FaCheck /> Lưu tin xe</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVehiclePage;
