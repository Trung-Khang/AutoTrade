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

### NGÀY 2 — HOÀN THÀNH INTEGRATION VÀ CHUẨN BỊ GATE 2 (01/10/2026) — [CODE FRONTEND ĐÃ LÀM XONG 100% TRƯỚC HẠN]

#### A. Những việc TV2 đã chủ động lập trình xong trước thời hạn:
1. **Chuẩn hóa Design System theo phong cách Modern Minimal / Premium:**
   - Bảng màu: Primary Gold `#D4AF37`, Dark `#151515`, Background `#F5F5F5`, Card `#FFFFFF`, Text chính `#151515`, Text phụ `#666666`.
   - Bo góc Card 12px, Button 8px, Font Inter, spacing chuẩn 8px system.
   - Lưới sản phẩm: Thiết lập chuẩn 4 card/hàng trên Desktop, tạo nhiều khoảng thở thoáng đãng.
2. **Thiết kế lại Hero Banner trực quan & tinh giản (Khắc phục rối mắt):**
   - Heading: `TÌM CHIẾC XE PHÙ HỢP VỚI BẠN` (Màu `#FFFFFF`).
   - Text phụ: `Xe đã qua sử dụng chất lượng / Minh bạch thông tin – Dễ dàng lựa chọn` (Màu `#F5F5F5`).
   - Nút CTA: `[ 🔍 Tìm xe ngay ]` (Nền `#D4AF37`, chữ `#151515`).
   - Hình ảnh ô tô là trọng tâm, loại bỏ các khối văn bản dài dòng gây phân tâm.
3. **Tái cấu trúc chân trang Footer chuẩn nền đen `#151515`:**
   - Khối Logo `AUTOTRADE` kèm mô tả `Nền tảng mua bán ô tô cũ`.
   - 3 cột điều hướng rõ ràng: **Sản phẩm** (Tìm xe, Kho xe showroom, Đặt cọc online), **Hỗ trợ** (FAQ, Chính sách, Điều khoản), **Liên hệ** (Email, Hotline, Chi nhánh).
   - Đường viền phân cách `#333333` và dòng bản quyền `© 2026 Used Car Marketplace`.
4. **Admin CRUD UI & Quản trị kho xe (`AdminVehiclePage.jsx`):**
   - Bảng danh mục xe với bộ lọc trạng thái và tìm kiếm.
   - Modal thêm xe mới, sửa thông tin xe và chức năng xóa xe có dialog xác nhận an toàn.
   - Dropdown đổi trạng thái xe trực tiếp (`AVAILABLE` / `HOLD` / `SOLD`).
5. **Giao diện Admin quản lý Sổ cái đặt cọc (`AdminDepositLedgerPage.jsx`):**
   - Thống kê KPI tổng tiền cọc đang giữ, số đơn cọc hợp lệ, số đơn đã hoàn cọc.
   - Bảng tra cứu toàn bộ đơn cọc hệ thống và nút "Hoàn tiền cọc" (chuyển đơn sang `REFUNDED` và mở bán lại xe sang `AVAILABLE`).
6. **Quy trình Đặt cọc & Hẹn lịch xem xe (`DepositPage.jsx`):**
   - Kiểm tra ràng buộc trạng thái: Chỉ cho phép đặt cọc xe `AVAILABLE`; xe `HOLD` hoặc `SOLD` sẽ bị vô hiệu hóa nút cọc.
   - Ràng buộc ngày hẹn: Chặn người dùng chọn ngày ở quá khứ (`min={today}`).
   - Checkbox Đăng ký lái thử xe (Test-Drive) tích hợp trực tiếp.
   - Tự động sinh mã tham chiếu giao dịch độc nhất (`AUTODEP-[ID]-[RANDOM]`), bảng thông tin ngân hàng và khung quét mã Mock VietQR.
   - Khi hoàn tất cọc, tự động đổi trạng thái chiếc xe thành `HOLD`.
7. **Giao diện Khách hàng & Nhân viên:**
   - `CustomerDepositHistoryPage.jsx`: Tra cứu mã cọc, số tiền cọc, ngày giờ hẹn và trạng thái xử lý.
   - `StaffAppointmentPage.jsx`: Quản lý danh sách lịch hẹn, lọc theo trạng thái (`SCHEDULED`, `COMPLETED`, `CANCELLED`), cập nhật tiếp đón lái thử.
8. **Xử lý chuẩn mã lỗi HTTP & Chặn Submit lặp (Double-click):**
   - `api.js`: Đính kèm JWT token từ `localStorage`, chuẩn hóa xử lý lỗi chi tiết cho các mã HTTP `401/403/404/409/422/500`.
   - Toàn bộ các nút Submit trên các form đều có cờ `isSubmitting` chặn bấm liên tiếp gây duplicate request.
9. **Xác thực & Route Guard RBAC (`AuthContext.jsx`, `ProtectedRoute.jsx`, `LoginPage.jsx`):**
   - Đăng nhập, đăng ký, đăng xuất, lưu token JWT, phân quyền truy cập, hiển thị 403 khi sai quyền và hỗ trợ 3 nút đăng nhập Demo 1-click.

#### B. Danh sách file/module đã tạo mới và cập nhật:
- **Core Auth & Routing:**
  - `frontend/src/context/AuthContext.jsx` (Tạo mới)
  - `frontend/src/components/common/ProtectedRoute.jsx` (Tạo mới)
  - `frontend/src/App.jsx` (Cập nhật định tuyến)
- **Giao diện Màn hình (Pages):**
  - `frontend/src/pages/HomePage.jsx` & `HomePage.css` (Cập nhật Hero Banner chuẩn yêu cầu)
  - `frontend/src/pages/VehicleListPage.jsx` & `VehicleListPage.css` (Cập nhật Showroom)
  - `frontend/src/pages/DepositPage.jsx` & `DepositPage.css` (Tạo mới)
  - `frontend/src/pages/CustomerDepositHistoryPage.jsx` (Tạo mới)
  - `frontend/src/pages/StaffAppointmentPage.jsx` (Tạo mới)
  - `frontend/src/pages/AdminVehiclePage.jsx` & `AdminVehiclePage.css` (Tạo mới)
  - `frontend/src/pages/AdminDepositLedgerPage.jsx` (Tạo mới Sổ cái đặt cọc)
  - `frontend/src/pages/LoginPage.jsx` & `LoginPage.css` (Tạo mới)
  - `frontend/src/pages/RegisterPage.jsx` (Tạo mới)
- **Components & Navigation:**
  - `frontend/src/components/common/Navbar.jsx` & `Navbar.css` (Chuẩn hóa màu Dark & Gold)
  - `frontend/src/components/common/Footer.jsx` & `Footer.css` (Chân trang nền đen 3 cột chuẩn)
  - `frontend/src/components/vehicle/VehicleCard.jsx` & `VehicleCard.css` (Chuẩn hóa card 12px, nút 8px)
  - `frontend/src/components/vehicle/VehicleGrid.css` (Lưới 4 card/hàng trên Desktop)
  - `frontend/src/components/vehicle/VehicleInfo.jsx` & `VehicleInfo.css` (Chi tiết xe)
  - `frontend/src/components/filter/FilterPanel.css` (Bộ lọc)
  - `frontend/src/styles/global.css` (Hệ thống Design Tokens Modern Minimal)
- **Dữ liệu & API Services:**
  - `frontend/src/services/api.js` (Interceptor JWT & mã lỗi HTTP 401/403/404/409/422)
  - `frontend/src/services/vehicleApi.js` (Bổ sung CRUD Admin & State Sync)
  - `frontend/src/services/depositApi.js` (Tạo mới Service đơn cọc và lịch hẹn)
  - `frontend/src/utils/mockVehicles.js` (Chuẩn hóa trạng thái AVAILABLE/HOLD/SOLD)
- **Tài liệu Kiểm thử (Test Lead):**
  - `docs/Testing/Test_Plan.md` (Cập nhật phạm vi và Test Matrix)
  - `docs/Testing/Defect_Log.md` (Tạo mới sổ theo dõi khiếm khuyết)

#### C. Phần duy nhất còn lại của Ngày 2 cần môi trường thật:
- **Kết nối API trực tiếp (Real API Integration):**
  - Toàn bộ mã nguồn Frontend của TV2 đã sẵn sàng cả 2 chế độ: Nếu Backend đang chạy sẽ gọi API thật, nếu Backend chưa chạy sẽ fallback sang Mock LocalStorage để không bị gián đoạn.
  - Ngay khi TV1 (Backend Core) và TV4 (Auth) bàn giao máy chủ API thật, TV2 sẽ chuyển kết nối và cùng nhóm chạy kiểm thử luồng vàng để nghiệm thu **Gate 2**.

---

### NGÀY 3 — KIỂM THỬ HỆ THỐNG, TỔNG HỢP EVIDENCE VÀ ĐÓNG GÓI (02/10/2026)
- **Kế hoạch thực hiện:**
  - Code freeze giao diện UI (chỉ sửa bug phát sinh).
  - Chạy toàn diện 15 ca kiểm thử theo `Test_Plan.md`.
  - Cập nhật kết quả vào `Defect_Log.md` và xuất biên bản nghiệm thu `Test_Report.md`.
  - Hỗ trợ TV5 hoàn thiện bằng chứng chạy hệ thống (Evidence/Screenshots) cho báo cáo đồ án.
