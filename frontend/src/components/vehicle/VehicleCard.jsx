import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatPrice, formatMileage, formatYear } from '../../utils/formatters';
import { FaCalendarAlt, FaCheckCircle, FaLock, FaTimesCircle, FaHeart } from 'react-icons/fa';
import { useFavorites } from '../../context/FavoritesContext';
import './VehicleCard.css';

const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80';

const VehicleCard = ({ vehicle }) => {
  const { user, loading: authLoading } = useAuth();
  const [imgSrc, setImgSrc] = useState(vehicle?.imageUrl || vehicle?.image_url || DEFAULT_CAR_IMAGE);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!vehicle) return null;

  const isFav = isFavorite(vehicle.id);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(vehicle);
  };

  const brand = vehicle.brand || '';
  const model = vehicle.model || '';
  const variant = vehicle.variant || '';
  const year = vehicle.manufactureYear || vehicle.manufacture_year;
  const mileage = vehicle.mileage;
  const location = vehicle.location || 'Showroom AutoTrade';
  const price = vehicle.price;
  const seatCount = vehicle.seatCount || vehicle.seat_count;
  const status = (vehicle.status || 'AVAILABLE').toUpperCase();
  const isEligible = vehicle.depositEligible ?? (status === 'AVAILABLE');
  const canSeeDepositFlow = !authLoading && (!user || user.role === 'CUSTOMER');

  // Xác định nhãn trạng thái kinh doanh
  let statusBadge = {
    text: 'Đang mở bán',
    className: 'status-available',
    icon: <FaCheckCircle />,
    canDeposit: isEligible
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
  } else if (status === 'ARCHIVED' || !isEligible) {
    statusBadge = {
      text: status === 'ARCHIVED' ? 'Tạm ngưng mở bán' : 'Chưa mở đặt cọc',
      className: 'status-sold',
      icon: <FaTimesCircle />,
      canDeposit: false
    };
  }

  return (
    <div className="vehicle-card-v2">
      <div className="card-top-media">
        <Link to={`/vehicles/${vehicle.id}`} className="card-media-link">
          <img
            src={imgSrc}
            alt={`${brand} ${model}`}
            className="card-car-img"
            onError={() => setImgSrc(DEFAULT_CAR_IMAGE)}
            loading="lazy"
          />
        </Link>
        <button
          type="button"
          className={`card-favorite-btn ${isFav ? 'favorited' : ''}`}
          onClick={handleFavoriteClick}
          title={isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          aria-label={isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        >
          <FaHeart />
        </button>
        <span className={`card-status-badge ${statusBadge.className}`}>
          {statusBadge.icon} {statusBadge.text}
        </span>
      </div>

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
