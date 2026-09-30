# Software Requirements Specification (SRS)

## 1. Thông tin tài liệu

- **Đề tài:** Xây dựng hệ thống quản lý kinh doanh ô tô đã qua sử dụng
- **Ngày đồng bộ:** 30/09/2026
- **Scope:** Workflow 4 — Increment hiện tại
- **Owner:** TV5

## 2. Mục tiêu

Hệ thống cung cấp quy trình quản lý xe cũ gồm tra cứu xe, showroom, quản trị xe, đặt cọc giả lập, lịch hẹn, khóa xe khi cọc và quản lý giao dịch cọc.

Phạm vi hiện tại giữ stack:

- Backend: Spring Boot + Spring Data JPA
- Database: PostgreSQL
- Frontend: React + Vite
- API prefix: `/api/v1`

Không đưa các module cũ về ML/regression/R Plumber/valuation/recommendation/comparison vào scope hiện tại.

## 3. Actor

| Actor | Quyền/nhu cầu |
|---|---|
| Guest | Xem danh sách, tìm kiếm/lọc, xem chi tiết xe |
| CUSTOMER | Đăng nhập, tạo đặt cọc, chọn showroom/ngày giờ, xem lịch sử cọc |
| STAFF | Tra cứu và check-in lịch hẹn showroom |
| ADMIN | CRUD xe, đổi trạng thái xe, xem ledger, duyệt hoàn cọc |
| System | Tạo mã cọc/QR giả lập, xử lý state transition, transaction |

> Auth/RBAC backend chưa có implementation trong repository hiện tại. Vì vậy quyền ở bảng trên là **requirement**, không được hiểu là đã được enforcement.

## 4. Functional Requirements

### FR-01 — Đăng ký tài khoản

CUSTOMER có thể đăng ký tài khoản.

**Status:** PENDING — chưa có backend auth trong source hiện tại.

### FR-02 — Đăng nhập và phân quyền

Hệ thống xác thực người dùng và chặn API STAFF/ADMIN khi role không phù hợp.

**Status:** PENDING — chưa có Spring Security/JWT/session backend.

### FR-03 — Quên mật khẩu/OTP

Hệ thống hỗ trợ OTP hoặc fallback demo có hạn dùng theo contract của TV4.

**Status:** PENDING.

### FR-04 — Tìm kiếm/lọc xe

API public cho phép tìm theo keyword và các filter như brand/model/variant, giá, năm, mileage, fuel type, transmission, body type, origin, location.

**API hiện có:** `GET /api/v1/listings`

**Status:** IMPLEMENTED (đã có code; automated tests cho listing/specification tồn tại).

### FR-05 — Xem chi tiết xe/listing

Guest/CUSTOMER xem chi tiết một listing.

**API:** `GET /api/v1/listings/{id}`

**Status:** IMPLEMENTED (đã có code; integration test listing tồn tại).

### FR-06 — Yêu thích

CUSTOMER lưu/xóa/xem danh sách xe yêu thích.

**Status:** PENDING — chưa có backend model/API.

### FR-07 — Tạo đặt cọc và lịch hẹn

CUSTOMER chọn xe, showroom, ngày giờ và tùy chọn lái thử. Hệ thống tạo `Deposit` ở `PENDING` và `Appointment` ở `PENDING`, đồng thời tạo QR giả lập.

**API:** `POST /api/v1/deposits`

**Status:** IMPLEMENTED ở backend; còn thiếu auth thật và validation ngày quá khứ.

### FR-08 — Xác nhận thanh toán cọc giả lập

CUSTOMER xác nhận đã chuyển tiền. Hệ thống chuyển deposit sang `DEPOSITED` và tạo receipt/contract reference.

**API:** `POST /api/v1/deposits/{id}/confirm`

**Status:** IMPLEMENTED ở code; chưa có automated test tương ứng trong repo audit.

### FR-09 — Khóa xe và chống cọc trùng

Chỉ xe `AVAILABLE` mới được confirm deposit thành công. Confirm phải thực hiện atomic update để không có hai giao dịch cùng giữ một xe.

**Vehicle states:** `AVAILABLE`, `HOLD`, `RESERVED`, `SOLD`.

**Status:** IMPLEMENTED ở code deposit flow; chưa có automated concurrency test trong repo audit.

### FR-10 — Biên lai/hợp đồng

Sau khi confirm có receipt code/contract number; UI có thể hiển thị reference.

**API:** `GET /api/v1/deposits/{id}/receipt`

**Status:** PARTIAL — response tồn tại nhưng tài liệu API hiện tại có field example chưa khớp code; tải PDF/file thật thuộc P2.

### FR-11 — Liên hệ

Hiển thị contact/showroom link cơ bản.

**Status:** PENDING/P2.

### FR-12 — Quản lý lịch hẹn STAFF

STAFF xem lịch hẹn theo showroom/trạng thái và check-in khách.

**APIs:**

- `GET /api/v1/staff/appointments`
- `PUT /api/v1/staff/appointments/{id}/check-in`

**Appointment states:** `PENDING`, `COMPLETED`, `CANCELLED`.

**Status:** IMPLEMENTED ở code; chưa có security enforcement và automated test.

### FR-13 — Admin CRUD xe

ADMIN thêm, sửa, đổi trạng thái và xóa xe.

**APIs:**

- `POST /api/v1/admin/vehicles`
- `PUT /api/v1/admin/vehicles/{id}`
- `PATCH /api/v1/admin/vehicles/{id}/status?status=...`
- `DELETE /api/v1/admin/vehicles/{id}`

**Status:** IMPLEMENTED ở code; authorization chưa có. Delete chưa có guard 409 rõ ràng trong service.

### FR-14 — Admin ledger/hoàn cọc

ADMIN xem ledger và duyệt refund.

**APIs:**

- `GET /api/v1/admin/ledger`
- `POST /api/v1/admin/ledger/{depositId}/refund`

**Status:** IMPLEMENTED ở code; authorization chưa có; response example cần TV1 sync với code.

### FR-15 — Tài khoản/quản trị người dùng/thống kê

Các chức năng quản trị account/statistics thuộc P1/P2 theo contract nhóm.

**Status:** PENDING.

## 5. Business Rules

1. Chỉ `Vehicle.status = AVAILABLE` được tạo/confirm đặt cọc thành công.
2. Xác nhận cọc phải đồng thời chuyển xe sang `HOLD` trong transaction.
3. Nếu atomic lock thất bại thì không được tạo một deposit thành công thứ hai.
4. Deposit statuses: `PENDING` → `DEPOSITED` → `REFUNDED` hoặc `CANCELLED`.
5. Appointment statuses: `PENDING` → `COMPLETED` hoặc `CANCELLED`.
6. Vehicle statuses: `AVAILABLE` → `HOLD`/`RESERVED` → `AVAILABLE` hoặc `SOLD` theo nghiệp vụ thực tế.
7. `deposit_code` là UNIQUE trong database.
8. Không có thanh toán tiền thật; QR chỉ là mô phỏng.
9. Lái thử chỉ là thuộc tính `hasTestDrive` của Appointment, không phải workflow/module độc lập.
10. Auth/RBAC là requirement nhưng chưa được đánh dấu hoàn thành khi backend chưa có security implementation.

## 6. Non-Functional Requirements

| ID | Yêu cầu |
|---|---|
| NFR-01 | Search/filter có mục tiêu phản hồi dưới 2 giây trong điều kiện demo bình thường. |
| NFR-02 | Deposit/vehicle state transition phải transaction-safe. |
| NFR-03 | Backend phải có authentication, password hashing và authorization trước khi đánh dấu P0 hoàn thành. |
| NFR-04 | React responsive trên desktop/mobile. |
| NFR-05 | Database migration/seed phải tái lập được từ môi trường sạch. |

## 7. Phạm vi loại bỏ

- Machine Learning / Regression
- R Plumber
- Valuation tự động
- Recommendation
- Comparison
- Thanh toán thật / VNPay / MoMo thật
- Shopping cart
- Standalone test-drive workflow

## 8. Traceability status

Nguồn kiểm tra chính: source code, migration, API contract và test files hiện có. `IMPLEMENTED` = có code; `VERIFIED` chỉ dùng khi có evidence test thật.
