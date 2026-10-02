import React, { useState, useEffect } from 'react';
import vehicleApi from '../services/vehicleApi';
import { formatFullPrice, formatMileage } from '../utils/formatters';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaCar,
  FaTimes,
  FaCheck,
  FaWarehouse
} from 'react-icons/fa';
import './AdminVehiclePage.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80';

const AdminVehiclePage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    variant: '',
    manufactureYear: 2022,
    price: 500000000,
    mileage: 30000,
    fuelType: 'Xăng',
    transmission: 'Tự động',
    bodyType: 'Sedan',
    color: 'Trắng',
    origin: 'Lắp ráp trong nước',
    location: 'TP. Hồ Chí Minh',
    status: 'AVAILABLE',
    imageUrl: '',
    description: ''
  });

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehicleApi.getListings();
      setVehicles(res.content || []);
    } catch (err) {
      console.error('Lỗi khi tải kho xe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      brand: 'Toyota',
      model: 'Camry',
      variant: '2.5Q',
      manufactureYear: 2022,
      price: 850000000,
      mileage: 28000,
      fuelType: 'Xăng',
      transmission: 'Tự động',
      bodyType: 'Sedan',
      color: 'Đen',
      origin: 'Lắp ráp trong nước',
      location: 'TP. Hồ Chí Minh',
      status: 'AVAILABLE',
      imageUrl: DEFAULT_IMAGE,
      description: 'Xe đẹp nguyên bản, một chủ từ đầu, bảo dưỡng đầy đủ theo hãng.'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (car) => {
    setEditingVehicle(car);
    setFormData({
      brand: car.brand || '',
      model: car.model || '',
      variant: car.variant || '',
      manufactureYear: car.manufactureYear || car.manufacture_year || 2022,
      price: car.price || 0,
      mileage: car.mileage || 0,
      fuelType: car.fuelType || car.fuel_type || 'Xăng',
      transmission: car.transmission || 'Tự động',
      bodyType: car.bodyType || car.body_type || 'Sedan',
      color: car.color || 'Trắng',
      origin: car.origin || 'Lắp ráp trong nước',
      location: car.location || 'TP. Hồ Chí Minh',
      status: car.status || 'AVAILABLE',
      imageUrl: car.imageUrl || car.image_url || DEFAULT_IMAGE,
      description: car.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xoá chiếc xe "${name}" khỏi kho không?`)) {
      try {
        await vehicleApi.deleteVehicle(id);
        showToast(`Đã xoá thành công xe #${id}`);
        loadVehicles();
      } catch (err) {
        alert('Lỗi khi xoá: ' + err.message);
      }
    }
  };

  const handleStatusChange = async (carId, newStatus) => {
    try {
      await vehicleApi.updateVehicleStatus(carId, newStatus);
      showToast(`Đã cập nhật trạng thái xe #${carId} thành ${newStatus}`);
      loadVehicles();
    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await vehicleApi.updateVehicle(editingVehicle.id, formData);
        showToast(`Đã cập nhật thành công xe #${editingVehicle.id}`);
      } else {
        await vehicleApi.createVehicle(formData);
        showToast('Đã thêm xe mới thành công vào kho hàng!');
      }
      setIsModalOpen(false);
      loadVehicles();
    } catch (err) {
      alert('Không thể lưu xe: ' + err.message);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchStatus = statusFilter === 'ALL' || (v.status || 'AVAILABLE') === statusFilter;
    const kw = keyword.toLowerCase().trim();
    const matchSearch =
      !kw ||
      v.brand?.toLowerCase().includes(kw) ||
      v.model?.toLowerCase().includes(kw) ||
      v.variant?.toLowerCase().includes(kw) ||
      v.location?.toLowerCase().includes(kw);

    return matchStatus && matchSearch;
  });

  return (
    <div className="admin-page-container">
      <div className="admin-header-row">
        <div>
          <h1>
            <FaWarehouse style={{ color: '#2563eb' }} /> Quản Lý Kho Xe & Trạng Thái Mở Bán
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Quản trị viên có toàn quyền thêm xe mới, điều chỉnh thông tin, giá bán và trạng thái (AVAILABLE / HOLD / SOLD)
          </p>
        </div>
        <button onClick={handleOpenAddModal} className="admin-btn-primary">
          <FaPlus /> Thêm Xe Mới Vào Kho
        </button>
      </div>

      {toastMessage && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
          ✓ {toastMessage}
        </div>
      )}

      {/* Toolbar lọc và tìm kiếm */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '20px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '240px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', background: '#f8fafc' }}>
          <FaSearch style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Tìm theo hãng, dòng xe, phiên bản, khu vực..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'AVAILABLE', 'HOLD', 'SOLD'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: statusFilter === st ? '#2563eb' : '#e2e8f0',
                backgroundColor: statusFilter === st ? '#2563eb' : '#ffffff',
                color: statusFilter === st ? '#ffffff' : '#64748b'
              }}
            >
              {st === 'ALL' && 'Tất cả'}
              {st === 'AVAILABLE' && 'Đang mở bán'}
              {st === 'HOLD' && 'Đang giữ cọc'}
              {st === 'SOLD' && 'Đã bán'}
            </button>
          ))}
        </div>
      </div>

      {/* Bảng danh sách xe */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách kho xe...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-vehicle-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Ảnh</th>
                <th>Tên xe & Phiên bản</th>
                <th>Năm SX</th>
                <th>Giá niêm yết</th>
                <th>Số km (ODO)</th>
                <th>Trạng thái kinh doanh</th>
                <th style={{ width: '110px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((car) => {
                const currentStatus = car.status || 'AVAILABLE';
                return (
                  <tr key={car.id}>
                    <td>
                      <img
                        src={car.imageUrl || car.image_url || DEFAULT_IMAGE}
                        alt={car.model}
                        className="admin-car-thumb"
                      />
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a', fontSize: '14px' }}>
                        {car.brand} {car.model}
                      </strong>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>
                        {car.variant || ''} · {car.transmission || 'Tự động'}
                      </div>
                    </td>
                    <td>{car.manufactureYear || car.manufacture_year}</td>
                    <td>
                      <strong style={{ color: '#1e3a8a', fontSize: '14px' }}>
                        {formatFullPrice(car.price)}
                      </strong>
                    </td>
                    <td>{formatMileage(car.mileage)}</td>
                    <td>
                      <select
                        className={`status-select ${currentStatus}`}
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(car.id, e.target.value)}
                      >
                        <option value="AVAILABLE">AVAILABLE (Mở bán)</option>
                        <option value="HOLD">HOLD (Giữ cọc)</option>
                        <option value="SOLD">SOLD (Đã bán)</option>
                      </select>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button
                          onClick={() => handleOpenEditModal(car)}
                          className="admin-action-icon-btn edit"
                          title="Sửa thông tin xe"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(car.id, `${car.brand} ${car.model}`)}
                          className="admin-action-icon-btn delete"
                          title="Xoá xe"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Thêm / Sửa xe */}
      {isModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h2>{editingVehicle ? `Chỉnh sửa xe #${editingVehicle.id}` : 'Thêm xe mới vào hệ thống'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="close-modal-btn">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="admin-form-grid">
                <div className="deposit-form-group">
                  <label>Hãng xe (Brand) *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                  />
                </div>

                <div className="deposit-form-group">
                  <label>Dòng xe (Model) *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>

                <div className="deposit-form-group">
                  <label>Phiên bản (Variant)</label>
                  <input
                    type="text"
                    value={formData.variant}
                    onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                  />
                </div>

                <div className="deposit-form-group">
                  <label>Năm sản xuất *</label>
                  <input
                    type="number"
                    value={formData.manufactureYear}
                    onChange={(e) => setFormData({ ...formData, manufactureYear: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="deposit-form-group">
                  <label>Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    step="1000000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="deposit-form-group">
                  <label>Số km đã đi (ODO) *</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="deposit-form-group">
                  <label>Nhiên liệu</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  >
                    <option value="Xăng">Xăng</option>
                    <option value="Dầu (Diesel)">Dầu (Diesel)</option>
                    <option value="Điện">Điện</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="deposit-form-group">
                  <label>Hộp số</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  >
                    <option value="Tự động">Tự động</option>
                    <option value="Số sàn">Số sàn</option>
                  </select>
                </div>

                <div className="deposit-form-group">
                  <label>Trạng thái kinh doanh *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="AVAILABLE">AVAILABLE (Đang mở bán)</option>
                    <option value="HOLD">HOLD (Đang giữ cọc)</option>
                    <option value="SOLD">SOLD (Đã bán)</option>
                  </select>
                </div>

                <div className="deposit-form-group">
                  <label>Khu vực trưng bày</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="deposit-form-group" style={{ marginTop: '12px' }}>
                <label>URL hình ảnh xe</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>

              <div className="deposit-form-group">
                <label>Mô tả chi tiết tình trạng xe</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="card-btn-outline"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="admin-btn-primary">
                  <FaCheck /> {editingVehicle ? 'Lưu thay đổi' : 'Thêm xe vào kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVehiclePage;
