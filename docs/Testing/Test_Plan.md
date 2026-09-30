# Kế Hoạch Kiểm Thử Toàn Diện (Test Plan) — Hệ Thống AutoTrade
**Dự án:** Hệ thống Quản lý Kinh doanh Ô tô Đã qua Sử dụng (Used-Car Business Management System)  
**Test Lead phụ trách:** TV2 (Frontend Lead & Test Lead)  
**Phối hợp:** TV4 (QA/QC Support)  
**Cập nhật:** Kế hoạch 3 Ngày (Increment 1 -> Increment 4)

---

## 1. Mục Tiêu Kiểm Thử (Objective)
1. Đảm bảo toàn bộ các luồng nghiệp vụ kinh doanh cốt lõi hoạt động chính xác, ổn định và không phát sinh lỗi nghiêm trọng.
2. Kiểm tra tính toàn vẹn dữ liệu, các ràng buộc trạng thái nghiệp vụ (State Machine) của Xe (`AVAILABLE` -> `HOLD` -> `SOLD`), Đơn đặt cọc và Lịch hẹn.
3. Xác thực cơ chế phân quyền RBAC (Role-Based Access Control) giữa các vai trò: **Khách hàng (CUSTOMER)**, **Nhân viên (STAFF)**, **Quản trị viên (ADMIN)** và Khách vãng lai (GUEST).
4. Kiểm thử giao diện phản hồi (UI/UX), tính hợp lệ của biểu mẫu (Validation) và khả năng tích hợp REST API giữa Frontend React và Backend Spring Boot.

---

## 2. Phạm Vi Kiểm Thử (Scope)

### Trong phạm vi kiểm thử (In-Scope):
1. **Quản lý danh mục & kho xe (Admin Vehicle CRUD):**
   - Thêm xe mới, sửa thông tin, xoá xe.
   - Chuyển đổi trạng thái xe: `AVAILABLE` (Mở bán), `HOLD` (Giữ cọc), `SOLD` (Đã bán).
2. **Showroom & Tìm kiếm lọc xe (Public Showroom):**
   - Danh sách xe, phân trang, lọc theo hãng, khoảng giá, nhiên liệu, hộp số.
   - Xem chi tiết xe, cam kết kiểm định và hiển thị đúng nhãn trạng thái kinh doanh.
3. **Quy trình Đặt cọc & Lịch hẹn xem xe (Customer Deposit & Appointment):**
   - Kiểm tra điều kiện xe: Chỉ xe `AVAILABLE` mới được đặt cọc.
   - Kiểm tra ngày hẹn: Chặn chọn ngày trong quá khứ (`min = today`).
   - Tùy chọn lái thử xe (Test-Drive checkbox).
   - Tự động sinh mã tham chiếu giao dịch và hiển thị Mock VietQR.
   - Tự động chuyển trạng thái xe sang `HOLD` ngay sau khi đặt cọc thành công.
4. **Quản lý Lịch hẹn & Tiếp đón (Staff Portal):**
   - Xem toàn bộ danh sách lịch hẹn khách hàng.
   - Tìm kiếm theo tên khách hàng, SĐT, mã cọc.
   - Cập nhật trạng thái lịch hẹn: `SCHEDULED` -> `COMPLETED` / `CANCELLED`.
5. **Theo dõi đơn cọc khách hàng (Customer Portal):**
   - Tra cứu danh sách đơn cọc cá nhân, mã cọc, số tiền, ngày giờ hẹn và trạng thái xử lý.
6. **Xác thực & Phân quyền (Authentication & Authorization):**
   - Đăng nhập, đăng ký, đăng xuất, lưu JWT token, bảo vệ Route (`ProtectedRoute`).

### Ngoài phạm vi kiểm thử (Out-of-Scope):
- Không kiểm thử các tính năng AI, mô hình hồi quy Machine Learning, R Plumber (đã loại bỏ khỏi phạm vi đồ án từ 29/09/2026).
- Không tích hợp cổng thanh toán trực tiếp ngân hàng thực tế (sử dụng cổng giả lập Mock VietQR & mã tham chiếu).

---

## 3. Ma Trận Ca Kiểm Thử (Test Cases Matrix)

| Mã TC | Phân Hệ | Mục Tiêu Kiểm Thử | Dữ Liệu Đầu Vào / Thao Tác | Kết Quả Kỳ Vọng | Mức Độ | Trạng Thái |
|---|---|---|---|---|---|---|
| **AUTH-01** | Auth | Đăng nhập tài khoản hợp lệ | Username/password của Admin/Staff/Customer | Đăng nhập thành công, lưu token, hiển thị role badge | High | Pass |
| **AUTH-02** | Auth | Đăng nhập sai mật khẩu | Nhập sai password | Báo lỗi đăng nhập rõ ràng, không lưu token | High | Pass |
| **AUTH-03** | Auth | Route Guard chặn truy cập trái phép | Customer truy cập `/admin/vehicles` | Báo 403 Không có quyền truy cập | High | Pass |
| **VEH-01** | Showroom | Hiển thị kho xe mở bán | Truy cập `/vehicles` | Hiển thị danh sách xe kèm giá và status badge | High | Pass |
| **VEH-02** | Showroom | Lọc xe theo hãng & khoảng giá | Chọn Toyota + Giá dưới 600tr | Trả về đúng danh sách xe khớp tiêu chí | Medium | Pass |
| **VEH-03** | Showroom | Chi tiết xe mở bán (AVAILABLE) | Bấm vào xe có status AVAILABLE | Hiển thị nút "Tiến hành Đặt Cọc & Hẹn Lịch" | High | Pass |
| **VEH-04** | Showroom | Chặn cọc xe đang HOLD/SOLD | Bấm vào xe có status HOLD hoặc SOLD | Nút cọc bị disable, hiển thị giải thích rõ ràng | High | Pass |
| **DEP-01** | Đặt cọc | Đặt cọc thành công xe AVAILABLE | Nhập tên, SĐT, chọn ngày hẹn tương lai | Tạo đơn cọc thành công, xe chuyển sang HOLD | High | Pass |
| **DEP-02** | Đặt cọc | Chặn chọn ngày hẹn ở quá khứ | Chọn ngày hẹn nhỏ hơn ngày hiện tại | Hệ thống chặn submit, cảnh báo ngày không hợp lệ | High | Pass |
| **DEP-03** | Đặt cọc | Tùy chọn lái thử xe (Test-drive) | Tích chọn "Đăng ký lái thử xe" | Đơn cọc và lịch hẹn lưu cờ `hasTestDrive: true` | Medium | Pass |
| **DEP-04** | Đặt cọc | Sinh mã tham chiếu giao dịch | Mở form đặt cọc | Sinh mã `AUTODEP-[ID]-[RANDOM]`, hiển thị QR | Medium | Pass |
| **STF-01** | Staff | Xem danh sách lịch hẹn | Đăng nhập Staff, vào `/staff/appointments` | Xem đủ thông tin khách, xe, ngày giờ hẹn | High | Pass |
| **STF-02** | Staff | Cập nhật hoàn tất lịch hẹn | Bấm "Đã tiếp đón" trên lịch hẹn SCHEDULED | Trạng thái chuyển thành `COMPLETED` | High | Pass |
| **ADM-01** | Admin | Thêm xe mới vào kho | Nhập đầy đủ thông tin xe trong Modal Add | Xe mới xuất hiện trong bảng và Showroom | High | Pass |
| **ADM-02** | Admin | Chuyển đổi trạng thái xe | Đổi status từ AVAILABLE sang HOLD/SOLD | Trạng thái xe cập nhật tức thì, Showroom đổi badge | High | Pass |
| **ADM-03** | Admin | Xóa xe khỏi hệ thống | Chọn Xóa xe và xác nhận Dialog | Xe bị xóa khỏi hệ thống | Medium | Pass |

---

## 4. Tiêu Chí Bắt Đầu & Kết Thúc (Entry & Exit Criteria)
- **Entry Criteria:** 
  - Giao diện UI các màn hình hoàn thiện, build Vite không lỗi.
  - API endpoint hoặc Mock API fallback sẵn sàng cung cấp dữ liệu thử nghiệm.
- **Exit Criteria:**
  - 100% ca kiểm thử High Priority đạt trạng thái PASS.
  - Không còn lỗi mức độ Blocker/Critical trong `Defect_Log.md`.
  - Báo cáo kiểm thử hoàn thành và được Test Lead ký duyệt.
