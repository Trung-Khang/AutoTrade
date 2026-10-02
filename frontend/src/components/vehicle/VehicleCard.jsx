import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatPrice, formatMileage, formatYear } from '../../utils/formatters';
import { FaCalendarAlt, FaCheckCircle, FaLock, FaTimesCircle } from 'react-icons/fa';
import './VehicleCard.css';

const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80';

const VehicleCard = ({ vehicle }) => {
  const { user, loading: authLoading } = useAuth();
  const [imgSrc, setImgSrc] = useState(vehicle?.imageUrl || vehicle?.image_url || DEFAULT_CAR_IMAGE);

  if (!vehicle) return null;

  const brand = vehicle.brand || '';
  const model = vehicle.model || '';
  const variant = vehicle.variant || '';
  const year = vehicle.manufactureYear || vehicle.manufacture_year;
  const mileage = vehicle.mileage;
  const location = vehicle.location || 'Showroom AutoTrade';
  const price = vehicle.price;
  const seatCount = vehicle.seatCount || vehicle.seat_count;
  const status = (vehicle.status || 'AVAILABLE').toUpperCase();
  const canSeeDepositFlow = !authLoading && (!user || user.role === 'CUSTOMER');

  // Xác định nhãn trạng thái kinh doanh
  let statusBadge = {
    text: 'Đang mở bán',
    className: 'status-available',
    icon: <FaCheckCircle />,
    canDeposit: true
  };

  if (status === 'HOLD' || status === 'RESERVED') {
    statusBadge = {
      text: 'Đang giữ chỗ',
      className: 'status-hold',
      icon: <FaLock />,
      canDeposit: false
    };
  } else if (status === 'SOLD') {
    statusBadge = {
      text: 'Đã bán',
      className: 'status-sold',
      icon: <FaTimesCircle />,
      canDeposit: false
    };
  }

  return (
    <div className="vehicle-card-v2">
      <Link to={`/vehicles/${vehicle.id}`} className="card-top-media">
        <img
          src={imgSrc}
          alt={`${brand} ${model}`}
          className="card-car-img"
          onError={() => setImgSrc(DEFAULT_CAR_IMAGE)}
          loading="lazy"
        />
        <span className={`card-status-badge ${statusBadge.className}`}>
          {statusBadge.icon} {statusBadge.text}
        </span>
      </Link>

      <div className="card-body">
        <Link to={`/vehicles/${vehicle.id}`} className="card-car-title-link">
          <h3 className="card-car-name">
            {brand} {model} {variant} {year ? formatYear(year) : ''}
          </h3>
        </Link>
        
        <p className="card-car-subinfo">
          {formatMileage(mileage)} · {location} {seatCount ? `· ${seatCount} chỗ` : ''}
        </p>

        <div className="card-price-row">
          <span className="card-price-val">{formatPrice(price)}</span>
          {canSeeDepositFlow && <span className="card-deposit-rate">Cọc trước 20 triệu</span>}
        </div>

        <div className="card-actions-row">
          <Link to={`/vehicles/${vehicle.id}`} className="card-btn-outline">
            Chi tiết
          </Link>
          
          {canSeeDepositFlow && statusBadge.canDeposit ? (
            <Link to={`/deposit/${vehicle.id}`} className="card-btn-deposit">
              <FaCalendarAlt /> Đặt cọc & Hẹn
            </Link>
          ) : canSeeDepositFlow ? (
            <button className="card-btn-disabled" disabled title="Xe này hiện không thể nhận cọc">
              {statusBadge.text}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
