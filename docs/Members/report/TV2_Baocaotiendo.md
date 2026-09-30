# BÁO CÁO TIẾN ĐỘ THÀNH VIÊN 02 (TV2 — FRONTEND & TEST LEAD)
**Đề tài:** Xây dựng hệ thống quản lý kinh doanh ô tô đã qua sử dụng (AutoTrade)  
**Thời gian kế hoạch:** Kế hoạch 3 Ngày (30/09/2026 – 02/10/2026)  
**Hạn nộp:** 04/10/2026  

---

## 1. TỔNG QUAN VAI TRÒ VÀ TRÁCH NHIỆM
- **Frontend Lead:** Xây dựng toàn bộ giao diện ứng dụng React cho 4 nhóm đối tượng: Khách vãng lai, CUSTOMER, STAFF, ADMIN.
  - Showroom trưng bày xe, tìm kiếm & bộ lọc, chi tiết xe, cam kết thẩm định chất lượng.
  - Chuẩn hóa hệ thống thiết kế (Design System) theo phong cách **Modern Minimal / Premium** (Gold `#D4AF37`, Dark `#151515`, Card `#FFFFFF` bo góc 12px, Button 8px, lưới 4 card/hàng trên desktop).
  - Tối ưu khu vực Hero Banner tinh gọn, tập trung hình ảnh ô tô, nút tìm xe nổi bật, loại bỏ các khối văn bản gây rối mắt.
  - Tái cấu trúc chân trang Footer nền đen `#151515` chuẩn 3 cột điều hướng chuyên nghiệp.
  - Xác thực người dùng (Auth UI: Đăng nhập, Đăng ký, Quản lý Token JWT & Phân quyền RBAC qua ProtectedRoute).
  - Quy trình Đặt cọc giữ chỗ giả lập (Mock Payment/QR) & Đặt lịch hẹn xem xe (tích hợp tùy chọn lái thử, chặn chọn ngày quá khứ).
  - Giao diện Admin quản trị kho xe (CRUD xe, đổi trạng thái AVAILABLE / HOLD / SOLD tức thì).
  - Giao diện Admin quản lý Sổ cái đặt cọc (Admin Deposit Ledger: theo dõi tổng tiền cọc và thao tác hoàn tiền cọc, tự động mở bán lại xe).
  - Giao diện Staff quản lý danh sách lịch hẹn và tiếp đón khách hàng lái thử.
  - Giao diện Khách hàng theo dõi lịch sử các đơn đặt cọc và tiến độ lịch hẹn.
  - Xử lý chuẩn mã lỗi HTTP `401/403/404/409/422`, chặn double-click và cấu hình cơ chế Fallback Mock Data thông minh lưu trữ LocalStorage giúp giao diện hoạt động mượt mà và kiểm thử độc lập ở Local.
- **Test Lead:**
  - Soạn thảo và quản lý `Test_Plan.md`, ma trận 15 ca kiểm thử P0/P1, quy trình quản lý khiếm khuyết trong `Defect_Log.md`.
  - Điều phối và thực hiện kiểm thử hệ thống (Happy Path, Negative Test, Kiểm thử phân quyền RBAC, Gate 2 và Final Gate).

---

## 2. TIẾN ĐỘ THỰC HIỆN THEO KẾ HOẠCH 3 NGÀY

### NGÀY 1 — KHÓA CONTRACT, DỰNG KHUNG UI VÀ TEST PLAN P0 (30/09/2026) — [ĐÃ HOÀN THÀNH 100%]

#### A. Việc đã hoàn thành:
1. **Dọn dẹp và chuẩn hóa kiến trúc Frontend theo scope mới:**
   - Loại bỏ hoàn toàn các module và thuật toán cũ không còn thuộc phạm vi (Hồi quy R Plumber, Định giá tự động, Recommendation, Comparison).
   - Xóa bỏ logo cũ, thay thế bằng bộ nhận diện thương hiệu `AUTOTRADE` thanh lịch bằng biểu tượng và kiểu chữ SVG.
   - Thiết lập cấu trúc định tuyến (React Router) đầy đủ cho cả 4 nhóm người dùng.
2. **Xây dựng Showroom & Chi tiết xe:**
   - Hoàn thiện Trang chủ (`HomePage.jsx`), Danh sách xe (`VehicleListPage.jsx`), Chi tiết xe (`VehicleDetailPage.jsx`, `VehicleInfo.jsx`).
   - Hiển thị rõ 3 trạng thái kinh doanh: `AVAILABLE` (Đang mở bán), `HOLD` (Đang giữ chỗ cọc), `SOLD` (Đã bán).
3. **Thiết lập tài liệu Test Lead:**
   - Soạn thảo `docs/Testing/Test_Plan.md` cập nhật chi tiết mục tiêu, phạm vi và ma trận 15 Test Cases.
   - Khởi tạo `docs/Testing/Defect_Log.md` phân cấp mức độ lỗi và ghi nhận giải pháp xử lý.

---

### NGÀY 2 — TÍCH HỢP VỚI BÀN GIAO TỪ TV1 & CHUẨN BỊ GATE 2 (01/10/2026) — [ĐÃ GHÉP NỐI 100% CONTRACT TV1]

#### A. Tiếp nhận bàn giao từ TV1 và hoàn thiện tích hợp Frontend:
1. **Tiếp nhận tài nguyên từ TV1:**
   - Đã nhận `API_Specification_Official_v3.md` và mã nguồn Backend Spring Boot của TV1.
   - Toàn bộ 6 task TV1 bàn giao cho TV2 (từ Task TV2-01 đến Task TV2-06) đều đã được ghép nối và cấu hình hoàn tất vào mã nguồn Frontend:
2. **Task TV2-01: Ghép Showroom & Bộ lọc xe (`GET /api/v1/vehicles`):**
   - Đã cấu hình `vehicleApi.getListings` gọi endpoint chính thức `/api/v1/vehicles`, hỗ trợ các query params: `keyword`, `brand`, `minPrice`, `maxPrice`, `minYear`, `maxYear`, `transmission`, `fuelType`, `status`, `page`, `size`, `sort`.
3. **Task TV2-02: Ghép Chi tiết xe (`GET /api/v1/vehicles/{id}`):**
   - Đã cấu hình `vehicleApi.getListingById` gọi `/api/v1/vehicles/{id}`, hiển thị thông số kỹ thuật, số khung (VIN), tình trạng ODO, địa chỉ showroom và nút cọc.
4. **Task TV2-03: Ghép Form Đặt cọc & Checkbox Lái thử (`POST /api/v1/deposits`):**
   - Đã cấu hình `depositApi.createDeposit` gửi payload chuẩn gồm `vehicleId`, `showroomId`, `appointmentDate`, `hasTestDrive`, `customerName`, `customerPhone`, `customerEmail`, `note`. Nhận về `depositCode` và link ảnh `qrPaymentUrl`.
5. **Task TV2-04: Ghép Modal Quét mã QR & Xác nhận thanh toán (`POST /api/v1/deposits/{id}/confirm`):**
   - Đã hoàn thiện quy trình 2 bước trên `DepositPage.jsx`: Khách nhập form $\rightarrow$ nhận mã VietQR và thông tin chuyển khoản $\rightarrow$ bấm "Xác nhận chuyển tiền".
   - **Xử lý đặc biệt chống cọc trùng:** Nếu nhận 200 OK $\rightarrow$ hiển thị biên lai thu tiền cọc và hợp đồng số (`receiptCode`, `contractNumber`); nếu nhận **`409 Conflict`** $\rightarrow$ hiển thị banner đỏ cảnh báo xe vừa có người khác đặt cọc trước và hủy giao dịch giữ chỗ.
6. **Task TV2-05: Ghép Trang Quản trị xe cho Admin (FR-13):**
   - `AdminVehiclePage.jsx` kết nối đầy đủ các endpoint: `POST /api/v1/admin/vehicles`, `PUT /api/v1/admin/vehicles/{id}`, `DELETE /api/v1/admin/vehicles/{id}` và `PATCH /api/v1/admin/vehicles/{id}/status`.
7. **Task TV2-06: Ghép Trang Đón tiếp của Staff (FR-12):**
   - `StaffAppointmentPage.jsx` kết nối `GET /api/v1/staff/appointments` và `PUT /api/v1/staff/appointments/{id}/check-in` cho phép nhân viên ghi nhận ghi chú và kết quả lái thử khi khách đến showroom.
8. **Ghép Phân hệ Sổ cái đặt cọc Admin (FR-14):**
   - `AdminDepositLedgerPage.jsx` kết nối `GET /api/v1/admin/ledger` và `POST /api/v1/admin/ledger/{depositId}/refund` cho phép Admin kiểm soát dòng tiền cọc và duyệt hoàn cọc mở lại xe về `AVAILABLE`.
9. **Cấu hình Header `X-User-Id` và Bearer Token:**
   - Trong `api.js`: Đã cấu hình Request Interceptor tự động đính kèm cả `Authorization: Bearer <jwt_token>` và `X-User-Id: <id>` theo đúng quy định giai đoạn Ngày 1 & Ngày 2 của TV1.

#### B. Danh sách file/module đã hoàn thành:
- **Core Auth & Routing:**
  - `frontend/src/services/api.js` (Cập nhật Header X-User-Id & interceptor lỗi 401/403/404/409/422)
  - `frontend/src/context/AuthContext.jsx`
  - `frontend/src/components/common/ProtectedRoute.jsx`
  - `frontend/src/App.jsx`
- **Giao diện Màn hình (Pages):**
  - `frontend/src/pages/HomePage.jsx` & `HomePage.css` (Hero Banner chuẩn quy chuẩn)
  - `frontend/src/pages/VehicleListPage.jsx` & `VehicleListPage.css` (Showroom xe)
  - `frontend/src/pages/DepositPage.jsx` & `DepositPage.css` (Ghép nối Task TV2-03, TV2-04 & xử lý 409 Conflict)
  - `frontend/src/pages/CustomerDepositHistoryPage.jsx` (Lịch sử cọc khách hàng)
  - `frontend/src/pages/StaffAppointmentPage.jsx` (Ghép nối Task TV2-06 Check-in)
  - `frontend/src/pages/AdminVehiclePage.jsx` & `AdminVehiclePage.css` (Ghép nối Task TV2-05 CRUD)
  - `frontend/src/pages/AdminDepositLedgerPage.jsx` (Ghép nối Admin Ledger & Refund)
  - `frontend/src/pages/LoginPage.jsx` & `LoginPage.css`
  - `frontend/src/pages/RegisterPage.jsx`
- **Dữ liệu & API Services:**
  - `frontend/src/services/vehicleApi.js` (Khớp chuẩn 100% endpoint `/api/v1/vehicles` và `/api/v1/admin/vehicles`)
  - `frontend/src/services/depositApi.js` (Khớp chuẩn 100% endpoint `/api/v1/deposits`, `/staff/appointments`, `/admin/ledger`)
  - `frontend/src/utils/mockVehicles.js`
- **Tài liệu Kiểm thử (Test Lead):**
  - `docs/Testing/Test_Plan.md` (Cập nhật 15 Test Cases P0/P1)
  - `docs/Testing/Defect_Log.md` (Quản lý khiếm khuyết)

---

### NGÀY 3 — KIỂM THỬ HỆ THỐNG, TỔNG HỢP EVIDENCE VÀ ĐÓNG GÓI (02/10/2026)
- **Kế hoạch thực hiện:**
  - Code freeze giao diện UI (chỉ sửa bug phát sinh).
  - Chạy toàn diện 15 ca kiểm thử theo `Test_Plan.md`.
  - Cập nhật kết quả vào `Defect_Log.md` và xuất biên bản nghiệm thu `Test_Report.md`.
  - Hỗ trợ TV5 hoàn thiện bằng chứng chạy hệ thống (Evidence/Screenshots) cho báo cáo đồ án.
