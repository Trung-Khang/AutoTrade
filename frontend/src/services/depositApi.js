import apiClient from './api';

const LOCAL_STORAGE_KEY_DEPOSITS = 'autotrade_deposits_list';
const LOCAL_STORAGE_KEY_APPOINTMENTS = 'autotrade_appointments_list';

// Dữ liệu mẫu ban đầu cho Lịch hẹn và Đặt cọc
const INITIAL_DEPOSITS = [
  {
    id: 101,
    depositCode: 'DEP-20260930-001',
    vehicleId: 1,
    vehicleTitle: 'Toyota Camry 2.5Q 2021',
    vehiclePrice: 980000000,
    depositAmount: 20000000,
    customerName: 'Trần Khách Hàng',
    customerPhone: '0901234567',
    customerEmail: 'customer@gmail.com',
    appointmentDate: '2026-10-05',
    appointmentTime: '09:30',
    hasTestDrive: true,
    note: 'Xin kiểm tra kỹ phần nội thất và bảo dưỡng trước giờ hẹn',
    status: 'DEPOSITED', // PENDING_PAYMENT, DEPOSITED, REFUNDED, RELEASED
    createdAt: '2026-09-30T10:15:00Z',
    appointmentStatus: 'SCHEDULED' // SCHEDULED, COMPLETED, CANCELLED
  }
];

// Helper lấy danh sách từ LocalStorage nếu Backend chưa deploy
const getLocalDeposits = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_DEPOSITS);
    return raw ? JSON.parse(raw) : INITIAL_DEPOSITS;
  } catch {
    return INITIAL_DEPOSITS;
  }
};

const saveLocalDeposits = (list) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_DEPOSITS, JSON.stringify(list));
  } catch (e) {
    console.error('Không thể lưu vào localStorage', e);
  }
};

export const depositApi = {
  // Tạo đơn đặt cọc mới kèm lịch hẹn
  createDeposit: async (depositData) => {
    try {
      const response = await apiClient.post('/deposits', depositData);
      return response;
    } catch (apiError) {
      console.warn('Backend /deposits chưa sẵn sàng. Lưu tạm vào LocalStorage.', apiError.message);
      const list = getLocalDeposits();
      const newDeposit = {
        id: Date.now(),
        depositCode: `DEP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        status: 'DEPOSITED',
        appointmentStatus: 'SCHEDULED',
        createdAt: new Date().toISOString(),
        ...depositData
      };
      list.unshift(newDeposit);
      saveLocalDeposits(list);
      return newDeposit;
    }
  },

  // Lấy danh sách đặt cọc của người dùng (Customer)
  getMyDeposits: async (userEmail) => {
    try {
      const response = await apiClient.get('/deposits/my-deposits');
      return response;
    } catch (apiError) {
      console.warn('Backend /deposits/my-deposits chưa sẵn sàng. Lấy dữ liệu mock.', apiError.message);
      const list = getLocalDeposits();
      if (!userEmail) return list;
      return list.filter(d => d.customerEmail === userEmail || d.customerName === userEmail);
    }
  },

  // Lấy toàn bộ danh sách lịch hẹn (cho Nhân viên / Staff)
  getAllAppointments: async () => {
    try {
      const response = await apiClient.get('/appointments');
      return response;
    } catch (apiError) {
      console.warn('Backend /appointments chưa sẵn sàng. Lấy danh sách từ LocalStorage.', apiError.message);
      return getLocalDeposits();
    }
  },

  // Cập nhật trạng thái lịch hẹn (Staff: SCHEDULED -> COMPLETED / CANCELLED)
  updateAppointmentStatus: async (depositId, newStatus) => {
    try {
      const response = await apiClient.patch(`/appointments/${depositId}/status`, { status: newStatus });
      return response;
    } catch (apiError) {
      console.warn('Backend updateAppointmentStatus chưa sẵn sàng. Cập nhật LocalStorage.', apiError.message);
      const list = getLocalDeposits();
      const updated = list.map(item => {
        if (item.id === depositId) {
          return { ...item, appointmentStatus: newStatus };
        }
        return item;
      });
      saveLocalDeposits(updated);
      return updated.find(item => item.id === depositId);
    }
  },

  // Hủy hoặc đổi trạng thái đơn cọc
  updateDepositStatus: async (depositId, newStatus) => {
    try {
      const response = await apiClient.patch(`/deposits/${depositId}/status`, { status: newStatus });
      return response;
    } catch (apiError) {
      console.warn('Backend updateDepositStatus chưa sẵn sàng. Cập nhật LocalStorage.', apiError.message);
      const list = getLocalDeposits();
      const updated = list.map(item => {
        if (item.id === depositId) {
          return { ...item, status: newStatus };
        }
        return item;
      });
      saveLocalDeposits(updated);
      return updated.find(item => item.id === depositId);
    }
  }
};

export default depositApi;
