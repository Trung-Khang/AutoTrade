import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaTrashAlt, FaCar, FaArrowLeft, FaExclamationCircle } from 'react-icons/fa';
import { useFavorites } from '../context/FavoritesContext';
import VehicleCard from '../components/vehicle/VehicleCard';
import './FavoritesPage.css';

const FavoritesPage = () => {
  const { favorites, favoritesCount, clearFavorites } = useFavorites();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleClearAll = () => {
    clearFavorites();
    setShowConfirmClear(false);
  };

  return (
    <div className="favorites-page">
      <div className="favorites-container">
        {/* Navigation Breadcrumb */}
        <div className="favorites-breadcrumb">
          <Link to="/vehicles" className="breadcrumb-back-btn">
            <FaArrowLeft /> Xem thêm xe khác
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Xe yêu thích ({favoritesCount})</span>
        </div>

        {/* Header Section */}
        <div className="favorites-header">
          <div className="favorites-title-group">
            <div className="favorites-icon-badge">
              <FaHeart />
            </div>
            <div>
              <h1 className="favorites-title">Danh Sách Xe Yêu Thích</h1>
              <p className="favorites-subtitle">
                Các mẫu xe bạn đã lưu lại để theo dõi biến động giá, so sánh thông số và chuẩn bị đặt cọc giữ chỗ.
              </p>
            </div>
          </div>

          {favoritesCount > 0 && (
            <div className="favorites-header-actions">
              <button
                type="button"
                className="btn-clear-favorites"
                onClick={() => setShowConfirmClear(true)}
              >
                <FaTrashAlt /> Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {/* Confirm Clear Modal */}
        {showConfirmClear && (
          <div className="favorites-modal-overlay">
            <div className="favorites-modal-card">
              <div className="modal-alert-icon">
                <FaExclamationCircle />
              </div>
              <h3>Xóa toàn bộ xe yêu thích?</h3>
              <p>
                Bạn có chắc chắn muốn bỏ lưu tất cả <strong>{favoritesCount}</strong> chiếc xe khỏi danh sách yêu thích không?
              </p>
              <div className="modal-btn-row">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setShowConfirmClear(false)}
                >
                  Giữ lại
                </button>
                <button
                  type="button"
                  className="modal-btn-confirm"
                  onClick={handleClearAll}
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        {favoritesCount === 0 ? (
          <div className="favorites-empty-card">
            <div className="empty-icon-wrapper">
              <FaHeart className="empty-heart-icon" />
            </div>
            <h2 className="empty-title">Danh sách yêu thích đang trống</h2>
            <p className="empty-desc">
              Bạn chưa lưu chiếc xe nào. Hãy bấm vào biểu tượng <strong>trái tim</strong> ở các mẫu xe trong Showroom để lưu lại và xem so sánh thuận tiện hơn.
            </p>
            <Link to="/vehicles" className="empty-cta-btn">
              <FaCar /> Khám phá kho xe ngay
            </Link>
          </div>
        ) : (
          <div className="favorites-grid">
            {favorites.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
