import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import logoImg from '../../assets/icons/logo.svg';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <img src={logoImg} alt="Used Car Smart System Logo" className="navbar-brand-logo-img" />
          <div className="logo-text-group">
            <span className="logo-brand">USED CAR</span>
            <span className="logo-sub">Smart Decision System</span>
          </div>
        </Link>

        {/* Mobile toggle */}
        <button
          className="navbar-toggle"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation links */}
        <nav className={`navbar-nav ${isOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/vehicles"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Danh sách xe
          </NavLink>

          <div className="nav-item-disabled" title="Khả dụng từ Increment 3">
            <span className="nav-link disabled">
              Định giá tự động
              <span className="nav-tag-badge">Inc 3</span>
            </span>
          </div>

          <div className="nav-item-disabled" title="Khả dụng từ Increment 4">
            <span className="nav-link disabled">
              Gợi ý & So sánh
              <span className="nav-tag-badge">Inc 4</span>
            </span>
          </div>

          <div className="navbar-action">
            <Link to="/vehicles" className="nav-cta-btn" onClick={closeMenu}>
              Xem danh sách xe
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
