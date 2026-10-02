import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import CustomerOnlyRoute from './components/common/CustomerOnlyRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import HomePage from './pages/HomePage';
import VehicleListPage from './pages/VehicleListPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import DepositPage from './pages/DepositPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CustomerDepositHistoryPage from './pages/CustomerDepositHistoryPage';
import StaffAppointmentPage from './pages/StaffAppointmentPage';
import AdminVehiclePage from './pages/AdminVehiclePage';
import AdminDepositLedgerPage from './pages/AdminDepositLedgerPage';
import AdminUserPage from './pages/AdminUserPage';
import ShowroomsPage from './pages/ShowroomsPage';
import FaqPage from './pages/FaqPage';
import PolicyPage from './pages/PolicyPage';
import TermsPage from './pages/TermsPage';
import AboutPage from './pages/AboutPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';

import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/vehicles" element={<VehicleListPage />} />
              <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
              <Route
                path="/deposit/:id"
                element={
                  <CustomerOnlyRoute>
                    <DepositPage />
                  </CustomerOnlyRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/showrooms" element={<ShowroomsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/policy" element={<PolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/customer/favorites" element={<FavoritesPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Customer Routes */}
              <Route
                path="/customer/deposits"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <CustomerDepositHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Staff Routes */}
              <Route
                path="/staff/appointments"
                element={
                  <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <StaffAppointmentPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/vehicles"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminVehiclePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/deposits"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDepositLedgerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminUserPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;

