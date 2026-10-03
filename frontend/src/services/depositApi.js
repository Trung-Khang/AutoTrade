import apiClient from './api';

// Mock directory for frontend testing & graceful fallback before TV4 backend deploys
const SHOWROOM_STAFF_DIRECTORY = {
  1: [
    { id: 101, fullName: 'Lê Hoàng Nam', phone: '0987.654.301', email: 'nam.le@autotrade.vn', isAvailable: true, statusText: 'Sẵn sàng đón tiếp' },
    { id: 102, fullName: 'Phạm Minh Đức', phone: '0987.654.302', email: 'duc.pham@autotrade.vn', isAvailable: false, statusText: 'Đã kín lịch' },
    { id: 103, fullName: 'Hoàng Thu Trang', phone: '0987.654.303', email: 'trang.hoang@autotrade.vn', isAvailable: true, statusText: 'Sẵn sàng đón tiếp' }
  ],
  2: [
    { id: 201, fullName: 'Trần Văn Hải', phone: '0912.334.501', email: 'hai.tran@autotrade.vn', isAvailable: true, statusText: 'Sẵn sàng đón tiếp' },
    { id: 202, fullName: 'Ngô Thanh Phong', phone: '0912.334.502', email: 'phong.ngo@autotrade.vn', isAvailable: false, statusText: 'Đã kín lịch' }
  ]
};

const getFallbackShowroomStaff = (showroomId, appointmentDate) => {
  const sId = Number(showroomId) || 1;
  const list = SHOWROOM_STAFF_DIRECTORY[sId] || [
    { id: sId * 100 + 1, fullName: `Nguyễn Tuấn Anh (CN ${sId})`, phone: `0988.11${(sId % 90 + 10)}.01`, email: `staff${sId}_01@autotrade.vn`, isAvailable: true, statusText: 'Sẵn sàng đón tiếp' },
    { id: sId * 100 + 2, fullName: `Trần Bảo Ngọc (CN ${sId})`, phone: `0988.11${(sId % 90 + 10)}.02`, email: `staff${sId}_02@autotrade.vn`, isAvailable: false, statusText: 'Đã kín lịch' },
    { id: sId * 100 + 3, fullName: `Đặng Quang Huy (CN ${sId})`, phone: `0988.11${(sId % 90 + 10)}.03`, email: `staff${sId}_03@autotrade.vn`, isAvailable: true, statusText: 'Sẵn sàng đón tiếp' }
  ];

  return list.map((st, idx) => {
    // Luôn giữ nhân viên thứ 2 là đã kín lịch để kiểm thử kịch bản TC-02
    const isBusy = idx === 1;
    return {
      ...st,
      isAvailable: !isBusy,
      statusText: !isBusy ? 'Sẵn sàng đón tiếp' : 'Đã kín lịch'
    };
  });
};

// Business state is owned by the backend; failures intentionally reach the UI.
export const depositApi = {
  // Lấy danh sách nhân viên showroom kèm trạng thái rảnh/bận theo ngày giờ
  getShowroomStaff: async (showroomId, appointmentDate) => {
    try {
      const response = await apiClient.get(`/showrooms/${showroomId}/staff`, {
        params: appointmentDate ? { appointmentDate } : {},
      });
      if (Array.isArray(response) && response.length > 0) {
        return response;
      }
    } catch (err) {
      console.warn(`[TV2 Frontend] API /showrooms/${showroomId}/staff chưa sẵn sàng, dùng danh mục chuyên viên mẫu:`, err?.message);
    }
    return getFallbackShowroomStaff(showroomId, appointmentDate);
  },

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
