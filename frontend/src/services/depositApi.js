import apiClient from './api';

// Business state is owned by the backend; failures intentionally reach the UI.
export const depositApi = {
  createDeposit: (depositData) => apiClient.post('/deposits', depositData),
  confirmPayment: (depositId) => apiClient.post(`/deposits/${depositId}/confirm`),
  getReceipt: (depositId) => apiClient.get(`/deposits/${depositId}/receipt`),
  getMyDeposits: () => apiClient.get('/deposits/my'),
  getStaffAppointments: (params = {}) => apiClient.get('/staff/appointments', { params }),
  checkInAppointment: (appointmentId, data) => apiClient.put(`/staff/appointments/${appointmentId}/check-in`, data),
  getAdminAppointments: () => apiClient.get('/admin/appointments'),
  rescheduleAppointment: (id, appointmentDate, reason) =>
    apiClient.put(`/admin/appointments/${id}/reschedule`, { appointmentDate, reason }),
  cancelAppointment: (id, reason) => apiClient.post(`/admin/appointments/${id}/cancel`, null, { params: { reason } }),
  getAdminLedger: () => apiClient.get('/admin/ledger'),
  refundDeposit: (depositId, refundReason) =>
    apiClient.post(`/admin/ledger/${depositId}/refund`, null, { params: { refundReason } })
};

export default depositApi;
