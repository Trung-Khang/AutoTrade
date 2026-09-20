import React from 'react';
import logoImg from '../../assets/icons/logo.svg';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <img src={logoImg} alt="Used Car Smart System Logo" className="footer-logo-img" />
          <div className="footer-text-group">
            <span className="footer-brand">USED CAR</span>
            <span className="footer-sub">Smart Decision System</span>
          </div>
        </div>
        <div className="footer-center">
          <p>Đồ án môn Công nghệ Phần mềm — Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)</p>
        </div>
        <div className="footer-right">
          <p>© {new Date().getFullYear()} Nhóm Đồ Án CK. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
