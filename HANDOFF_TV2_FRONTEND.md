# TÀI LIỆU BÀN GIAO THIẾT KẾ FRONTEND (HANDOFF TV2 - FRONTEND)
**Chức năng:** Giao Diện Đặt Cọc Chọn Nhân Viên Showroom, In Biên Lai Chuẩn Hóa & Quản Lý Lịch Hẹn RBAC  
**Người nhận:** TV2 (Frontend Lead & Test Lead)  
**Người lập:** Team Handoff  
**Ngày lập:** 02/10/2026  
**Mục tiêu:** Tích hợp giao diện chọn chuyên viên tư vấn tiếp đón tại Showroom, hoàn thiện bản in biên lai (`@media print`) đầy đủ địa chỉ chi nhánh & tên nhân viên, cập nhật trang quản lý lịch hẹn phân quyền cho Staff và Admin.

---

## 1. MÀN HÌNH ĐẶT CỌC & ĐẶT LỊCH HẸN (`DepositPage.jsx`)

### 1.1. Luồng trải nghiệm người dùng (UX Flow)
1. **Hiển thị thông tin Showroom nơi xe đang đỗ:**
   - Tại đầu form hoặc ngay dưới thông tin xe, hiển thị khối thông tin:
     ```
     📍 Địa điểm xe đang trưng bày: AutoTrade TP. Hồ Chí Minh
     🏢 Địa chỉ: Số 1 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM
     📞 Hotline chi nhánh: 028 7300 8888
     ```
2. **Khách hàng chọn Ngày (`appointmentDate`) và Giờ (`appointmentTime`):**
   - Khi 2 trường này có giá trị, Frontend tự động gọi API:  
     `depositApi.getShowroomStaff(vehicle.showroomId, fullDateTimeIso)`
3. **Danh sách Chuyên viên tư vấn đón tiếp:**
   - Hệ thống hiển thị danh sách 2–3 nhân viên của showroom đó:
     - **Nhân viên Đang Rảnh (`isAvailable: true`):** Hiển thị radio button hoặc card chọn có viền xanh / nhãn `"✓ Sẵn sàng đón tiếp"`. Frontend tự động chọn (Auto-select) nhân viên rảnh đầu tiên.
     - **Nhân viên Đã Kín Lịch (`isAvailable: false`):** Card bị làm mờ (`opacity: 0.55`, `cursor: not-allowed`), radio button bị `disabled`, hiển thị nhãn màu đỏ `"⚠️ Đã kín lịch"`. Khách không thể bấm chọn người này.
4. **Gửi đơn đặt cọc:**
   - Khi bấm *"Tiếp Tục: Quét Mã QR & Thanh Toán Cọc"*, gửi kèm `assignedStaffId: selectedStaffId` trong payload tạo cọc.

---

### 1.2. Màn hình Thành công & In Biên Lai Đặt Cọc (Receipt View & Print Bill)
Tại khối tóm tắt biên lai (`success-summary-box`) và bản in khi bấm nút **"In biên lai"** (`window.print()`):

```
================================================================================
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                         Độc lập - Tự do - Hạnh phúc
                    
                    AUTOTRADE USED CAR MARKETPLACE
                     BIÊN LAI ĐẶT CỌC GIỮ XE ĐỘC BẢN
--------------------------------------------------------------------------------
Mã đơn cọc:          DEP-20261002-10850
Mã biên lai:         REC-20261002-8899
Số hợp đồng:         HD-20261002-10850
Ngày xác nhận:       02/10/2026 15:30:00

THÔNG TIN GIAO DỊCH & XE:
- Xe đặt cọc:        Toyota Camry 2.5Q (2022)
- Giá niêm yết:      1.150.000.000 VNĐ
- Số tiền cọc (10%): 115.000.000 VNĐ
- Khách hàng:        Nguyễn Văn Kha (0918.xxx.xxx)

ĐỊA ĐIỂM TIẾP ĐÓN & BÀN GIAO:
- Showroom:          AutoTrade TP. Hồ Chí Minh
- Địa chỉ:           Số 1 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP.HCM
- Thời gian hẹn:     05/10/2026 lúc 09:30 Sáng (Có đăng ký lái thử xe)
- Chuyên viên tư vấn đón tiếp: Lê Hoàng Nam (Hotline: 0987.654.301)
================================================================================
```

---

## 2. TRANG QUẢN LÝ LỊCH HẸN NHÂN VIÊN (`StaffAppointmentPage.jsx`)

### 2.1. Phân quyền theo Role người dùng (useAuth)
1. **Đối với Nhân viên Showroom (`user.role === 'STAFF'`):**
   - Tiêu đề trang: *"Lịch Hẹn Tiếp Khách Của Tôi - Showroom {user.showroomName}"*.
   - Danh sách lịch hẹn chỉ hiển thị các khách hàng mà **chính nhân viên đó được phân công đón tiếp**.
   - Nút **"Check-in tiếp đón / Lái thử"**: Cho phép nhân viên bấm xác nhận khi khách đến showroom và nhập `staffNote`.
2. **Đối với Quản trị viên (`user.role === 'ADMIN'`):**
   - Tiêu đề: *"Tổng Quản Lý Lịch Hẹn Toàn Quốc"*.
   - Hiển thị tất cả lịch hẹn của mọi showroom.
   - Thêm bộ lọc:
     - Dropdown chọn Showroom (Hà Nội, TP.HCM, Đà Nẵng...).
     - Cột hiển thị: **"Chuyên viên phụ trách"** (Tên nhân viên + SĐT).

---

## 3. CẬP NHẬT SERVICE FRONTEND (`depositApi.js`)

Thêm hàm lấy danh sách nhân viên của Showroom:
```javascript
const depositApi = {
  // Lấy danh sách nhân viên showroom kèm trạng thái rảnh/bận theo ngày giờ
  getShowroomStaff: async (showroomId, appointmentDate) => {
    return await apiClient.get(`/showrooms/${showroomId}/staff`, {
      params: appointmentDate ? { appointmentDate } : {},
    });
  },

  // Các hàm hiện có giữ nguyên...
  getMyDeposits: (email) => apiClient.get('/deposits/my', { params: { email } }),
  createDeposit: (data) => apiClient.post('/deposits', data),
  confirmPayment: (depositId) => apiClient.post(`/deposits/${depositId}/confirm`),
  getStaffAppointments: (params) => apiClient.get('/staff/appointments', { params }),
  checkInAppointment: (appointmentId, data) => apiClient.put(`/staff/appointments/${appointmentId}/check-in`, data),
};
```

---

## 4. MA TRẬN KIỂM THỬ (TEST CASES DÀNH CHO TV2 LEAD)

| Mã Test | Tên Kịch Bản | Dữ liệu kiểm thử | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| **TC-01** | Khách chọn giờ $\rightarrow$ Nhân viên rảnh | Chọn 05/10 lúc 09:30 | Nhân viên rảnh có nút radio xanh, tự động chọn nhân viên rảnh đầu tiên. |
| **TC-02** | Khách xem nhân viên đã kín lịch | Khung giờ đã có lịch cọc trước | Nhân viên bị bận hiển thị badge đỏ `(Đã kín lịch)`, radio button bị xám (disabled), không bấm chọn được. |
| **TC-03** | Khách không chọn nhân viên (Auto-Assign) | Để trống nhân viên, gửi cọc | Hệ thống Backend tự gán nhân viên rảnh của showroom đó, tạo cọc thành công. |
| **TC-04** | In biên lai thu tiền cọc (Print Bill) | Bấm "In biên lai" | Bản in có đầy đủ: Địa chỉ showroom + Tên chuyên viên tư vấn + SĐT chuyên viên. |
| **TC-05** | Nhân viên A đăng nhập xem lịch hẹn | Tài khoản `staff_hcm_01` | Chỉ thấy các lịch hẹn do `staff_hcm_01` tiếp nhận. Không thấy lịch của `staff_hcm_02`. |
| **TC-06** | Nhân viên A check-in lịch của mình | Bấm Check-in | Cập nhật thành công, trạng thái chuyển sang `COMPLETED`. |
| **TC-07** | Admin đăng nhập xem lịch hẹn | Tài khoản `admin` | Xem được danh sách lịch hẹn của toàn bộ các showroom trên cả nước. |
| **TC-08** | Responsive Mobile | Màn hình điện thoại 390px | Card chọn nhân viên và biên lai co giãn gọn gàng, không bị tràn mép ngang. |
