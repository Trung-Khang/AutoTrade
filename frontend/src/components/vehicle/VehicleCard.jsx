import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, formatMileage, formatYear } from '../../utils/formatters';
import './VehicleCard.css';

const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80';

const VehicleCard = ({ vehicle }) => {
  const [imgSrc, setImgSrc] = useState(vehicle?.imageUrl || vehicle?.image_url || DEFAULT_CAR_IMAGE);

  if (!vehicle) return null;

  // Lấy giá trị linh hoạt hỗ trợ cả camelCase và snake_case từ ListingResponseDto
  const brand = vehicle.brand || '';
  const model = vehicle.model || '';
  const variant = vehicle.variant || '';
  const year = vehicle.manufactureYear || vehicle.manufacture_year;
  const mileage = vehicle.mileage;
  const location = vehicle.location || 'Toàn quốc';
  const price = vehicle.price;
  const sourceName = vehicle.sourceName || vehicle.source_name;
  const seatCount = vehicle.seatCount || vehicle.seat_count;

  // Nhãn Smart Tag mô phỏng theo Inc 1 & 2 (Inc 3 sẽ tính tự động từ R Plumber)
  let tagClass = 'tag-good';
  let tagText = 'Giá tốt';
  let diffNote = 'Thấp hơn 6% so với giá thị trường ước tính';

  if (vehicle.id % 3 === 2) {
    tagClass = 'tag-fair';
    tagText = 'Đúng giá thị trường';
    diffNote = 'Chênh lệch dưới 2% so với giá thị trường ước tính';
  } else if (vehicle.id % 3 === 0) {
    tagClass = 'tag-high';
    tagText = 'Cao hơn thị trường';
    diffNote = 'Cao hơn 7% so với giá thị trường ước tính';
  }

  return (
    <Link to={`/vehicles/${vehicle.id}`} className="vehicle-card-v2">
      <div className="card-top-media">
        <img
          src={imgSrc}
          alt={`${brand} ${model}`}
          className="card-car-img"
          onError={() => setImgSrc(DEFAULT_CAR_IMAGE)}
          loading="lazy"
        />
        {sourceName && (
          <span className="card-source-badge" title="Nguồn tin đăng">
            {sourceName}
          </span>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-car-name">
          {brand} {model} {variant} {year ? formatYear(year) : ''}
        </h3>
        
        <p className="card-car-subinfo">
          {formatMileage(mileage)} · {location} {seatCount ? `· ${seatCount} chỗ` : ''}
        </p>

        <div className="card-price-row">
          <span className="card-price-val">{formatPrice(price)}</span>
          <span className={`card-smart-tag ${tagClass}`}>{tagText}</span>
        </div>

        <p className="card-diff-explanation">{diffNote}</p>
      </div>
    </Link>
  );
};

export default VehicleCard;
