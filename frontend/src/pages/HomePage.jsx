import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VehicleCard from '../components/vehicle/VehicleCard';
import vehicleApi from '../services/vehicleApi';
import {
  FaSearch,
  FaArrowRight
} from 'react-icons/fa';
import './HomePage.css';

// Ảnh ô tô tiêu biểu chất lượng cao, sang trọng cho Hero
const HERO_CAR_IMAGE = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1000&auto=format&fit=crop&q=85';

const HomePage = () => {
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await vehicleApi.getListings();
        setFeaturedVehicles((res.content || []).slice(0, 4));
      } catch (err) {
        console.error('Lỗi tải xe nổi bật:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  return (
    <div className="homepage-wrapper">
      {/* 4. HERO BANNER - BỐ CỤC CHUẨN YÊU CẦU */}
      <section className="hero-banner-exact">
        <div className="hero-banner-inner">
          <div className="hero-banner-left">
            <h1 className="hero-banner-heading">
              TÌM CHIẾC XE PHÙ HỢP VỚI BẠN
            </h1>

            <div className="hero-banner-subtext">
              <p>Xe đã qua sử dụng chất lượng</p>
              <p>Minh bạch thông tin – Dễ dàng lựa chọn</p>
            </div>

            <Link to="/vehicles" className="hero-cta-btn">
              <FaSearch className="cta-search-icon" /> Tìm xe ngay
            </Link>
          </div>

          <div className="hero-banner-right">
            <div className="hero-car-frame">
              <img
                src={HERO_CAR_IMAGE}
                alt="Ô tô đã qua sử dụng chất lượng"
                className="hero-car-img-clean"
              />
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR MINIMAL */}
      <section className="stats-bar-minimal">
        <div className="stats-container">
          <div className="stat-box">
            <span className="stat-val">160+</span>
            <span className="stat-lbl">Tiêu chí kiểm định toàn diện</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">100%</span>
            <span className="stat-lbl">Hồ sơ pháp lý sẵn sàng sang tên</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">Online</span>
            <span className="stat-lbl">Đặt cọc giữ chỗ kèm mã VietQR</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">Miễn phí</span>
            <span className="stat-lbl">Đăng ký lái thử xe tại showroom</span>
          </div>
        </div>
      </section>

      {/* SHOWROOM SELECTION - GRID 4 CARD/ROW */}
      <section className="showcase-section">
        <div className="showcase-container">
          <div className="showcase-header-row">
            <div>
              <span className="section-kicker">SHOWROOM SELECTION</span>
              <h2 className="section-heading">Xe Đang Mở Bán Mới Nhất</h2>
            </div>
            <Link to="/vehicles" className="view-all-link">
              Xem tất cả xe <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="loading-placeholder">Đang tải danh sách xe showroom...</div>
          ) : (
            <div className="vehicle-grid-4">
              {featuredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROCESS - 4 STEPS MINIMAL */}
      <section className="process-minimal-section">
        <div className="showcase-container">
          <div className="process-header-center">
            <span className="section-kicker">GIAO DỊCH MINH BẠCH</span>
            <h2 className="section-heading">Quy Trình 4 Bước Đơn Giản</h2>
            <p className="section-subheading">
              Tiết kiệm thời gian, an tâm tuyệt đối với quy trình đặt cọc và tiếp đón chuyên nghiệp.
            </p>
          </div>

          <div className="process-grid-4">
            <div className="process-card">
              <span className="process-number">01</span>
              <h4>Chọn xe ưng ý</h4>
              <p>Tra cứu thông tin, hình ảnh thực tế và kiểm tra trạng thái đang mở bán.</p>
            </div>

            <div className="process-card">
              <span className="process-number">02</span>
              <h4>Đặt cọc online</h4>
              <p>Nhận mã tham chiếu giao dịch và chuyển khoản giữ chỗ ưu tiên mua xe.</p>
            </div>

            <div className="process-card">
              <span className="process-number">03</span>
              <h4>Xem xe & Lái thử</h4>
              <p>Đến showroom đúng giờ hẹn, chuyên viên tiếp đón và trải nghiệm chạy thử xe.</p>
            </div>

            <div className="process-card">
              <span className="process-number">04</span>
              <h4>Bàn giao an tâm</h4>
              <p>Ký kết hợp đồng sang tên hoặc hoàn lại 100% tiền cọc nếu xe sai cam kết.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
