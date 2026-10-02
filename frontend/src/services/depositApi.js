import apiClient from './api';

const LOCAL_STORAGE_KEY_DEPOSITS = 'autotrade_deposits_list';

// Dữ liệu mẫu ban đầu
const INITIAL_DEPOSITS = [
  {
    id: 1,
    depositId: 1,
    depositCode: 'DEP-20260930-9948',
    vehicleId: 1,
    vehicleTitle: 'Toyota Camry 2.5Q 2021',
    vehiclePrice: 1050000000,
    depositAmount: 10000000,
    customerName: 'Nguyễn Văn A',
    customerPhone: '0987654321',
    customerEmail: 'nguyenvana@gmail.com',
    appointmentDate: '2026-10-02T09:30:00',
    hasTestDrive: true,
    note: 'Hẹn sáng thứ 6 xem xe và chạy thử trên đại lộ',
    status: 'DEPOSITED',
    receiptCode: 'REC-20260930-1',
    contractNumber: 'HD-COC-2026-0001',
    appointmentStatus: 'PENDING', // PENDING, COMPLETED, CANCELLED
    qrPaymentUrl: 'https://api.vietqr.io/image/970422-999999999-compact2.jpg?amount=10000000&addInfo=DEP-20260930-9948'
  }
];

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

/**
 * Service quản lý đặt cọc, lịch hẹn và sổ cái Admin khớp chuẩn TV1 Contract v3.0.0
 */
export const depositApi = {
  /**
   * 1. Khởi tạo đơn cọc và hẹn ngày xem xe
   * Endpoint TV1: POST /api/v1/deposits
   */
  createDeposit: async (depositData) => {
    try {
      const response = await apiClient.post('/deposits', depositData);
      return response;
    } catch (apiError) {
      console.warn('Backend POST /deposits chưa sẵn sàng. Lưu tạm vào LocalStorage.', apiError.message);
      const list = getLocalDeposits();
      const newId = Date.now();
      const code = `DEP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newDeposit = {
        id: newId,
        depositId: newId,
        depositCode: code,
        status: 'PENDING',
        appointmentStatus: 'PENDING',
        createdAt: new Date().toISOString(),
        depositAmount: depositData.depositAmount || 10000000,
        qrPaymentUrl: `https://api.vietqr.io/image/970436-1050242933-compact2.jpg?amount=${depositData.depositAmount || 10000000}&addInfo=${code}&accountName=NGUYEN%20TRUNG%20KHANG`,
        ...depositData
      };
      list.unshift(newDeposit);
      saveLocalDeposits(list);
      return newDeposit;
    }
  },

  /**
   * 2. Xác nhận thanh toán cọc giả lập & Khóa xe sang HOLD (Chống cọc trùng Race-Condition)
   * Endpoint TV1: POST /api/v1/deposits/{id}/confirm
   */
  confirmPayment: async (depositId) => {
    try {
      const response = await apiClient.post(`/deposits/${depositId}/confirm`);
      return response;
    } catch (apiError) {
      console.warn(`Backend confirm cọc #${depositId} chưa sẵn sàng. Giả lập xác nhận.`, apiError.message);
      const list = getLocalDeposits();
      const index = list.findIndex(d => String(d.id) === String(depositId) || String(d.depositId) === String(depositId));
      if (index !== -1) {
        list[index].status = 'DEPOSITED';
        list[index].receiptCode = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${depositId}`;
        list[index].contractNumber = `HD-COC-2026-${depositId}`;
        saveLocalDeposits(list);
        return {
          depositId,
          depositCode: list[index].depositCode,
          status: 'DEPOSITED',
          vehicleStatus: 'HOLD',
          receiptCode: list[index].receiptCode,
          contractNumber: list[index].contractNumber,
          message: 'Đặt cọc giữ xe thành công! Xe đã được khóa trạng thái giữ chỗ cho quý khách.'
        };
      }
      throw apiError;
    }
  },

  /**
   * 3. Xem biên lai thu tiền cọc và hợp đồng số điện tử
   * Endpoint TV1: GET /api/v1/deposits/{id}/receipt
   */
  getReceipt: async (depositId) => {
    try {
      const response = await apiClient.get(`/deposits/${depositId}/receipt`);
      return response;
    } catch (apiError) {
      console.warn(`Backend GET receipt #${depositId} chưa sẵn sàng.`, apiError.message);
      const list = getLocalDeposits();
      const item = list.find(d => String(d.id) === String(depositId) || String(d.depositId) === String(depositId));
      return item || null;
    }
  },

  /**
   * 4. Lấy danh sách các đơn cọc của người dùng hiện tại
   * Endpoint TV1: GET /api/v1/deposits/my
   */
  getMyDeposits: async () => {
    try {
      const response = await apiClient.get('/deposits/my');
      return response;
    } catch (apiError) {
      console.warn('Backend GET /deposits/my chưa sẵn sàng. Trả về LocalStorage.', apiError.message);
      return getLocalDeposits();
    }
  },

  /**
   * 5. Nhân viên showroom tra cứu lịch hẹn xem xe
   * Endpoint TV1: GET /api/v1/staff/appointments
   */
  getStaffAppointments: async (params = {}) => {
    try {
      const response = await apiClient.get('/staff/appointments', { params });
      return response;
    } catch (apiError) {
      console.warn('Backend GET /staff/appointments chưa sẵn sàng. Trả về LocalStorage.', apiError.message);
      const list = getLocalDeposits();
      return list.map(item => ({
        appointmentId: item.id || item.depositId,
        id: item.id || item.depositId,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        vehicleInfo: item.vehicleTitle,
        appointmentDate: item.appointmentDate,
        hasTestDrive: item.hasTestDrive,
        status: item.appointmentStatus || 'PENDING',
        depositCode: item.depositCode,
        note: item.note
      }));
    }
  },

  /**
   * 6. Nhân viên xác nhận khách đã đến showroom / đã lái thử (Check-in)
   * Endpoint TV1: PUT /api/v1/staff/appointments/{id}/check-in
   */
  checkInAppointment: async (appointmentId, checkInData) => {
    try {
      const response = await apiClient.put(`/staff/appointments/${appointmentId}/check-in`, checkInData);
      return response;
    } catch (apiError) {
      console.warn(`Backend check-in #${appointmentId} chưa sẵn sàng. Cập nhật LocalStorage.`, apiError.message);
      const list = getLocalDeposits();
      const updated = list.map(item => {
        if (String(item.id) === String(appointmentId) || String(item.depositId) === String(appointmentId)) {
          return {
            ...item,
            appointmentStatus: 'COMPLETED',
            testDriveCompleted: checkInData.testDriveCompleted,
            staffNote: checkInData.staffNote
          };
        }
        return item;
      });
      saveLocalDeposits(updated);
      return {
        appointmentId,
        status: 'COMPLETED',
        staffNote: checkInData.staffNote
      };
    }
  },

  /**
   * 7. Xem tổng quan sổ cái dòng tiền cọc (Admin)
   * Endpoint TV1: GET /api/v1/admin/ledger
   */
  getAdminLedger: async () => {
    try {
      const response = await apiClient.get('/admin/ledger');
      return response;
    } catch (apiError) {
      console.warn('Backend GET /admin/ledger chưa sẵn sàng. Tính toán từ LocalStorage.', apiError.message);
      const list = getLocalDeposits();
      const totalTransactions = list.length;
      const totalAmount = list
        .filter(d => d.status === 'DEPOSITED')
        .reduce((sum, d) => sum + (Number(d.depositAmount) || 10000000), 0);
      return {
        totalTransactions,
        totalDepositAmountHolding: totalAmount,
        deposits: list
      };
    }
  },

  /**
   * 8. Admin duyệt hoàn tiền cọc cho khách hàng
   * Endpoint TV1: POST /api/v1/admin/ledger/{depositId}/refund
   */
  refundDeposit: async (depositId, refundReason = 'Hoàn cọc theo thỏa thuận') => {
    try {
      const response = await apiClient.post(`/admin/ledger/${depositId}/refund`, null, {
        params: { refundReason }
      });
      return response;
    } catch (apiError) {
      console.warn(`Backend refund #${depositId} chưa sẵn sàng. Cập nhật LocalStorage.`, apiError.message);
      const list = getLocalDeposits();
      const updated = list.map(item => {
        if (String(item.id) === String(depositId) || String(item.depositId) === String(depositId)) {
          return { ...item, status: 'REFUNDED' };
        }
        return item;
      });
      saveLocalDeposits(updated);
      return {
        depositId,
        status: 'REFUNDED',
        vehicleStatus: 'AVAILABLE',
        message: 'Hoàn cọc thành công, xe đã được mở lại sang AVAILABLE'
      };
    }
  },

  // Alias
  getAllAppointments: () => depositApi.getStaffAppointments(),
  updateAppointmentStatus: (id, status) => depositApi.checkInAppointment(id, { testDriveCompleted: true, staffNote: status }),
  updateDepositStatus: (id, status) => depositApi.refundDeposit(id, 'Yêu cầu cập nhật')
};

export default depositApi;
