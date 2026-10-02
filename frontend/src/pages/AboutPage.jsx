import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaCar,
  FaShieldAlt,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaHandshake,
  FaAward,
  FaTools,
  FaPhoneAlt,
  FaEnvelope,
} from 'react-icons/fa';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-container">
          <div className="about-hero-badge">
            <FaAward /> VỀ AUTOTRADE
          </div>
          <h1 className="about-hero-title">
            Hệ Thống Mua Bán Ô Tô Đã Qua Sử Dụng Thông Minh
          </h1>
          <p className="about-hero-desc">
            AutoTrade tiên phong ứng dụng công nghệ chuẩn hóa thông tin, kiểm định 160 bước khắt khe và bảo chứng pháp lý, mang đến trải nghiệm mua bán xe cũ minh bạch, tiện lợi và an tâm tuyệt đối trên toàn quốc.
          </p>
          <div className="about-hero-actions">
            <Link to="/vehicles" className="about-btn-primary">
              <FaCar /> Khám phá kho xe
            </Link>
            <Link to="/showrooms" className="about-btn-secondary">
              <FaMapMarkerAlt /> Hệ thống showroom
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="about-content-container">
        {/* Core Pillars */}
        <section className="about-section">
          <h2 className="section-title">Tại Sao Nên Chọn AutoTrade?</h2>
          <p className="section-subtitle">
            Bốn trụ cột cam kết tạo nên sự khác biệt và uy tín vững chắc của chúng tôi.
          </p>

          <div className="pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon-box">
                <FaTools />
              </div>
              <h3>Kiểm Định 160 Bước Chuẩn Quốc Tế</h3>
              <p>
                Mọi xe trước khi lên sàn đều trải qua quy trình kiểm tra chi tiết động cơ, hộp số, khung gầm và hệ thống điện. Cam kết 100% không đâm đụng, không ngập nước thủy kích.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box">
                <FaShieldAlt />
              </div>
              <h3>Pháp Lý Minh Bạch & Rõ Ràng</h3>
              <p>
                Hồ sơ gốc chính chủ, không phạt nguội, không tranh chấp, sẵn sàng công chứng sang tên ngay trong ngày với sự hỗ trợ trọn gói từ đội ngũ pháp lý.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box">
                <FaMapMarkerAlt />
              </div>
              <h3>Mạng Lưới Showroom Toàn Quốc</h3>
              <p>
                Hệ thống showroom và điểm thẩm định phủ khắp các tỉnh thành trên cả nước, hỗ trợ lái thử tận nơi và giao nhận xe an toàn tận nhà.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box">
                <FaHandshake />
              </div>
              <h3>Bảo Hành & Đặt Cọc An Toàn</h3>
              <p>
                Chính sách bảo hành động cơ & hộp số lên đến 12 tháng. Đặt cọc online giữ chỗ xe độc bản nhanh chóng, hoàn tiền 100% nếu xe không đúng cam kết.
              </p>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="about-section process-section">
          <h2 className="section-title">Quy Trình Mua Xe Tại AutoTrade</h2>
          <p className="section-subtitle">
            Đơn giản, minh bạch và tiện lợi chỉ với 4 bước tiêu chuẩn.
          </p>

          <div className="process-grid">
            <div className="process-step">
              <div className="step-number">01</div>
              <h4>Tìm & Chọn Xe</h4>
              <p>Tra cứu thông số, lịch sử ODO, kiểm định và hình ảnh thực tế chi tiết trên hệ thống.</p>
            </div>

            <div className="process-step">
              <div className="step-number">02</div>
              <h4>Đặt Cọc & Hẹn Lịch</h4>
              <p>Đặt cọc giữ chỗ độc bản trực tuyến an toàn và chọn ngày giờ lái thử thuận tiện nhất.</p>
            </div>

            <div className="process-step">
              <div className="step-number">03</div>
              <h4>Lái Thử & Thẩm Định</h4>
              <p>Trực tiếp trải nghiệm xe tại showroom hoặc yêu cầu nhân viên giao xe lái thử tận nơi.</p>
            </div>

            <div className="process-step">
              <div className="step-number">04</div>
              <h4>Bàn Giao & Hậu Mãi</h4>
              <p>Ký hợp đồng mua bán, nhận sổ bảo hành điện tử và dịch vụ hỗ trợ cứu hộ 24/7.</p>
            </div>
          </div>
        </section>

        {/* Contact Banner */}
        <section className="about-contact-banner">
          <div className="contact-banner-text">
            <h3>Sẵn Sàng Tìm Chiếc Xe Ưng Ý?</h3>
            <p>
              Đội ngũ tư vấn viên và chuyên gia thẩm định xe của AutoTrade luôn sẵn sàng hỗ trợ bạn 24/7.
            </p>
          </div>
          <div className="contact-banner-info">
            <div className="info-chip">
              <FaPhoneAlt /> Hotline: <strong>1900 8888</strong>
            </div>
            <div className="info-chip">
              <FaEnvelope /> Email: <strong>support@autotrade.vn</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
