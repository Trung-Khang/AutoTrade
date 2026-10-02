import React from 'react';
import { Link } from 'react-router-dom';
import { FaCar } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-exact">
      <div className="footer-container">
        {/* Brand Block */}
        <div className="footer-brand-section">
          <div className="footer-logo">
            <div className="footer-logo-badge">
              <FaCar />
            </div>
            <span className="footer-logo-text">AUTOTRADE</span>
          </div>
          <p className="footer-brand-desc">Nền tảng mua bán ô tô cũ</p>
        </div>

        {/* 3 Columns: Sản phẩm, Hỗ trợ, Liên hệ */}
        <div className="footer-columns-grid">
          <div className="footer-nav-col">
            <h4 className="footer-col-heading">Sản phẩm</h4>
            <ul className="footer-nav-links">
              <li><Link to="/vehicles">Tìm xe</Link></li>
              <li><Link to="/vehicles">Kho xe showroom</Link></li>
              <li><Link to="/showrooms">Địa chỉ showroom</Link></li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-col-heading">Hỗ trợ</h4>
            <ul className="footer-nav-links">
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/policy">Chính sách</Link></li>
              <li><Link to="/terms">Điều khoản sử dụng</Link></li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-col-heading">Liên hệ</h4>
            <ul className="footer-nav-links">
              <li><a href="mailto:support@autotrade.vn">Email: support@autotrade.vn</a></li>
              <li><a href="tel:19008888">Hotline: 1900 8888</a></li>
              <li><Link to="/about">Giới thiệu về AutoTrade</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Divider and Copyright */}
      <div className="footer-bottom-divider">
        <div className="footer-container">
          <p className="footer-copyright-text">
            © {new Date().getFullYear()} Used Car Marketplace
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
