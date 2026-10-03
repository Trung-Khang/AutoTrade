import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaBars,
  FaTimes,
  FaCar,
  FaUser,
  FaSignOutAlt,
  FaCalendarCheck,
  FaWarehouse,
  FaClipboardList,
  FaShieldAlt,
  FaUserTie,
  FaUsers,
  FaHeart,
} from 'react-icons/fa';
import { useFavorites } from '../../context/FavoritesContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, isStaff, isCustomer, logout } = useAuth();
  const { favoritesCount } = useFavorites();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/login');
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo - Không dùng hình ảnh cũ, dùng Typography & Car Icon */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <div className="navbar-brand-icon">
            <FaCar />
          </div>
          <div className="logo-text-group">
            <span className="logo-brand">AUTOTRADE</span>
            <span className="logo-sub">Used Car Management</span>
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
            Showroom Xe
          </NavLink>

          <NavLink
            to="/favorites"
            className={({ isActive }) => `nav-link nav-fav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Yêu thích
            {favoritesCount > 0 && <span className="nav-fav-badge">{favoritesCount}</span>}
          </NavLink>

          {/* Customer Links */}
          {isAuthenticated && (isCustomer || (!isAdmin && !isStaff)) && (
            <NavLink
              to="/customer/deposits"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Đơn cọc & Lịch hẹn
            </NavLink>
          )}

          {isAuthenticated && isCustomer && (
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Thông tin cá nhân
            </NavLink>
          )}

          {/* Staff Links */}
          {isAuthenticated && (isStaff || isAdmin) && (
            <NavLink
              to="/staff/appointments"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Quản lý lịch hẹn
            </NavLink>
          )}

          {/* Admin Links */}
          {isAuthenticated && isAdmin && (
            <>
              <NavLink
                to="/admin/vehicles"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Kho xe
              </NavLink>
              <NavLink
                to="/admin/deposits"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Sổ cái cọc
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Tài khoản
              </NavLink>
            </>
          )}

          {/* Auth Action buttons */}
          <div className="navbar-action">
            {isAuthenticated ? (
              <div className="user-profile-badge">
                <div className="user-info-text">
                  <span className="user-name">
                    {user?.fullName || user?.username}
                  </span>
                  <span className={`user-role-tag ${user?.role}`}>
                    {user?.role === 'ADMIN' && <FaShieldAlt />}
                    {user?.role === 'STAFF' && <FaUserTie />}
                    {user?.role === 'CUSTOMER' && <FaUser />}
                    {user?.role}
                  </span>
                </div>
                <button onClick={handleLogout} className="logout-btn" title="Đăng xuất">
                  <FaSignOutAlt />
                </button>
              </div>
            ) : (
              <div className="guest-auth-actions">
                <Link to="/login" className="nav-login-link" onClick={closeMenu}>
                  Đăng nhập
                </Link>
                <Link to="/register" className="nav-cta-btn" onClick={closeMenu}>
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
