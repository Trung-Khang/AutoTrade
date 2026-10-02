import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
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

import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/vehicles" element={<VehicleListPage />} />
              <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
              <Route path="/deposit/:id" element={<DepositPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Customer Routes */}
              <Route
                path="/customer/deposits"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
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
                path="/admin/appointments"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <StaffAppointmentPage />
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
    </AuthProvider>
  );
}

export default App;

