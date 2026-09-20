import React, { useState } from 'react';
import {
  FaCalendarAlt,
  FaRoad,
  FaGasPump,
  FaCogs,
  FaCarSide,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaUsers,
  FaTachometerAlt,
  FaGlobeAsia,
  FaPalette,
} from 'react-icons/fa';
import { formatFullPrice, formatMileage, formatYear } from '../../utils/formatters';
import './VehicleInfo.css';

const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80';

const VehicleInfo = ({ vehicle }) => {
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
  const location = vehicle.location || 'Toàn quốc';
  const color = vehicle.color || 'Chưa xác định';
  const origin = vehicle.origin || 'Chưa xác định';
  const seatCount = vehicle.seatCount || vehicle.seat_count;
  const engineSize = vehicle.engineSize || vehicle.engine_size;
  const sourceName = vehicle.sourceName || vehicle.source_name;
  const sourceUrl = vehicle.sourceUrl || vehicle.source_url;
  const description = vehicle.description || vehicle.listedAtRaw;

  return (
    <div className="vehicle-info-container">
      <div className="vehicle-info-gallery">
        <img
          src={imgSrc}
          alt={`${brand} ${model}`}
          className="vehicle-info-main-image"
          onError={() => setImgSrc(DEFAULT_CAR_IMAGE)}
        />
      </div>

      <div className="vehicle-info-details">
        <div className="vehicle-info-header">
          <div className="header-badges-row">
            <span className="info-brand-badge">{brand}</span>
            {sourceName && <span className="info-source-tag">Nguồn: {sourceName}</span>}
          </div>

          <h1 className="info-title">
            {model} {variant} {year ? `(${formatYear(year)})` : ''}
          </h1>

          <div className="info-price-section">
            <span className="price-label">Giá rao bán:</span>
            <span className="price-value">{formatFullPrice(price)}</span>
          </div>
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
              <span className="spec-value">{seatCount ? `${seatCount} chỗ` : 'Chưa xác định'}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <FaTachometerAlt className="icon" /> Động cơ:
              </span>
              <span className="spec-value">{engineSize ? `${engineSize}L` : 'Chưa xác định'}</span>
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
                <FaMapMarkerAlt className="icon" /> Khu vực bán:
              </span>
              <span className="spec-value">{location}</span>
            </div>
          </div>
        </div>

        {description && (
          <div className="vehicle-description-box">
            <h3 className="specs-section-title">Mô tả tin đăng</h3>
            <p className="description-text">{description}</p>
          </div>
        )}

        {sourceUrl && (
          <div className="source-link-box">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary source-link-btn"
            >
              <FaExternalLinkAlt /> Xem tin đăng gốc trên {sourceName || 'Sàn giao dịch'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleInfo;
