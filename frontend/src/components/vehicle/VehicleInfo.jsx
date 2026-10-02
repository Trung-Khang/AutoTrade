import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaCalendarAlt,
  FaRoad,
  FaGasPump,
  FaCogs,
  FaCarSide,
  FaMapMarkerAlt,
  FaUsers,
  FaTachometerAlt,
  FaGlobeAsia,
  FaPalette,
  FaCheckCircle,
  FaLock,
  FaTimesCircle,
  FaShieldAlt,
  FaHandshake,
} from 'react-icons/fa';
import { formatFullPrice, formatMileage, formatYear } from '../../utils/formatters';
import './VehicleInfo.css';

const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80';

const VehicleInfo = ({ vehicle }) => {
  const { user, loading: authLoading } = useAuth();
  const [imgSrc, setImgSrc] = useState(
    vehicle?.imageUrl || vehicle?.image_url || DEFAULT_CAR_IMAGE
  );

  if (!vehicle) return null;

  const brand = vehicle.brand || '';
  const model = vehicle.model || '';
  const variant = vehicle.variant || '';
  const year = vehicle.manufactureYear || vehicle.manufacture_year;
  const price = vehicle.price;
  const mileage = vehicle.mileage;
  const fuelType = vehicle.fuelType || vehicle.fuel_type || 'Xăng';
  const transmission = vehicle.transmission || 'Tự động';
  const bodyType = vehicle.bodyType || vehicle.body_type || 'Sedan';
  const location = vehicle.location || 'Showroom AutoTrade';
  const color = vehicle.color || 'Chưa xác định';
  const origin = vehicle.origin || 'Chưa xác định';
  const seatCount = vehicle.seatCount || vehicle.seat_count;
  const engineSize = vehicle.engineSize || vehicle.engine_size;
  const description = vehicle.description;
  const status = (vehicle.status || 'AVAILABLE').toUpperCase();
  const canSeeDepositFlow = !authLoading && (!user || user.role === 'CUSTOMER');

  const isAvailable = status === 'AVAILABLE';
  const isHold = status === 'HOLD' || status === 'RESERVED';
  const isSold = status === 'SOLD';

  return (
    <div className="vehicle-info-container">
      <div className="vehicle-info-gallery">
        <img
          src={imgSrc}
          alt={`${brand} ${model}`}
          className="vehicle-info-main-image"
          onError={() => setImgSrc(DEFAULT_CAR_IMAGE)}
        />
        
        {/* Cam kết chất lượng showroom */}
        <div className="showroom-commitments">
          <div className="commitment-item">
            <FaShieldAlt className="commit-icon" />
            <span>Cam kết không đâm đụng, không ngập nước</span>
          </div>
          <div className="commitment-item">
            <FaCheckCircle className="commit-icon" />
            <span>Hồ sơ pháp lý minh bạch, sẵn sàng sang tên</span>
          </div>
          <div className="commitment-item">
            <FaHandshake className="commit-icon" />
            <span>Hỗ trợ lái thử xe tận nơi hoặc tại showroom</span>
          </div>
        </div>
      </div>

      <div className="vehicle-info-details">
        <div className="vehicle-info-header">
          <div className="header-badges-row">
            <span className="info-brand-badge">{brand}</span>
            {isAvailable && (
              <span className="info-status-pill status-available">
                <FaCheckCircle /> Sẵn sàng mở bán
              </span>
            )}
            {isHold && (
              <span className="info-status-pill status-hold">
                <FaLock /> Đang giữ chỗ đặt cọc
              </span>
            )}
            {isSold && (
              <span className="info-status-pill status-sold">
                <FaTimesCircle /> Đã hoàn tất bán
              </span>
            )}
          </div>

          <h1 className="info-title">
            {brand} {model} {variant} {year ? `(${formatYear(year)})` : ''}
          </h1>

          <div className="info-price-section">
            <div className="price-primary">
              <span className="price-label">Giá niêm yết:</span>
              <span className="price-value">{formatFullPrice(price)}</span>
            </div>
            {canSeeDepositFlow && (
              <div className="deposit-hint-box">
                <span className="deposit-tag">Số tiền đặt cọc giữ xe (10%):</span>
                <strong className="deposit-amount">{formatFullPrice(Math.round((price || 0) * 0.1) || 10000000)}</strong>
              </div>
            )}
          </div>

          {/* Khối Action Đặt Cọc & Lịch Hẹn */}
          {canSeeDepositFlow && <div className="detail-deposit-cta-card">
            {isAvailable ? (
              <div className="cta-active-box">
                <p className="cta-desc">
                  Xe đang có sẵn tại showroom. Quý khách có thể đặt cọc online ngay để giữ quyền ưu tiên mua và đặt lịch hẹn xem/lái thử trực tiếp.
                </p>
                <Link to={`/deposit/${vehicle.id}`} className="cta-deposit-btn">
                  <FaCalendarAlt /> Tiến hành Đặt Cọc & Đặt Lịch Hẹn Ngay
                </Link>
              </div>
            ) : isHold ? (
              <div className="cta-hold-box">
                <FaLock className="cta-status-icon" />
                <div>
                  <strong>Xe đang được giữ chỗ</strong>
                  <p>Hiện đã có khách hàng đặt cọc cho xe này. Nếu giao dịch không thành công, xe sẽ tự động mở bán lại.</p>
                </div>
              </div>
            ) : (
              <div className="cta-sold-box">
                <FaTimesCircle className="cta-status-icon" />
                <div>
                  <strong>Xe đã được bán</strong>
                  <p>Chiếc xe này đã hoàn tất thủ tục bàn giao cho chủ nhân mới.</p>
                </div>
              </div>
            )}
          </div>}
        </div>

        <div className="specs-table-container">
          <h3 className="specs-section-title">Thông số kỹ thuật chi tiết</h3>
          <div className="specs-grid-detailed">
            <div className="spec-row">
              <span className="spec-label">
                <FaCalendarAlt className="icon" /> Năm sản xuất:
              </span>
              <span className="spec-value">{year ? formatYear(year) : 'Chưa xác định'}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <FaRoad className="icon" /> Số km đã đi (ODO):
              </span>
              <span className="spec-value">{formatMileage(mileage)}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <FaGasPump className="icon" /> Nhiên liệu:
              </span>
              <span className="spec-value">{fuelType}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <FaCogs className="icon" /> Hộp số:
              </span>
              <span className="spec-value">{transmission}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <FaUsers className="icon" /> Số chỗ ngồi:
              </span>
              <span className="spec-value">{seatCount ? `${seatCount} chỗ` : '5 chỗ'}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <FaTachometerAlt className="icon" /> Động cơ:
              </span>
              <span className="spec-value">{engineSize ? `${engineSize}L` : 'Tiêu chuẩn'}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <FaGlobeAsia className="icon" /> Xuất xứ:
              </span>
              <span className="spec-value">{origin}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <FaPalette className="icon" /> Màu sắc:
              </span>
              <span className="spec-value">{color}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <FaCarSide className="icon" /> Kiểu dáng:
              </span>
              <span className="spec-value">{bodyType}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <FaMapMarkerAlt className="icon" /> Địa điểm:
              </span>
              <span className="spec-value">{location}</span>
            </div>
          </div>
        </div>

        {description && (
          <div className="vehicle-description-box">
            <h3 className="specs-section-title">Mô tả tình trạng xe</h3>
            <p className="description-text">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleInfo;
