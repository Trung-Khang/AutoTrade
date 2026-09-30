# BIÊN BẢN BÀN GIAO CÔNG VIỆC — TV1 (CUỐI NGÀY 1)
## Đề tài: Hệ thống Quản lý Kinh doanh Ô tô Đã qua Sử dụng
- **Thời điểm bàn giao:** 17:00 – Ngày 1 (30/09/2026)
- **Người bàn giao:** TV1 (Backend Core & Integration Lead)
- **Nhánh Git:** `TV1` (Đã push lên remote repository)
- **Mục tiêu:** Cung cấp đầy đủ API thật, tài liệu kỹ thuật và file migration để các thành viên (TV2, TV3, TV4, TV5) triển khai công việc theo đúng tiến độ kế hoạch 3 ngày.

---

## 1. TỔNG QUAN TÀI NGUYÊN ĐÃ HOÀN THÀNH

1. **Tài liệu API Contract chính thức:** `docs/API/API_Specification_Official_v3.md`
2. **Kịch bản Migration Database V3.0.0:** `database/migrations/V3_0_0__showroom_deposit_appointment.sql`
3. **Mã nguồn Backend:**
   - 5 Entities: `Vehicle`, `Showroom`, `Deposit`, `Appointment`, `TransactionLedger`
   - 5 Repositories: `VehicleRepository` (kèm atomic lock), `ShowroomRepository`, `DepositRepository`, `AppointmentRepository`, `TransactionLedgerRepository`
   - 4 Services: `DepositService` (chống cọc trùng), `VehicleService`, `AppointmentService`, `AdminLedgerService`
   - 4 Controllers: `VehicleController` & `AdminVehicleController`, `DepositController`, `StaffAppointmentController`, `AdminLedgerController`
   - Xử lý lỗi tập trung: `GlobalExceptionHandler` (bắt lỗi HTTP `409 Conflict` khi cọc trùng xe)
4. **Kiểm tra biên dịch:** Maven Wrapper `mvnw.cmd test-compile` $\rightarrow$ **BUILD SUCCESS (0 lỗi)**.

---

## 2. CHI TIẾT CÁC TASK BÀN GIAO CHO TỪNG THÀNH VIÊN

### 2.1. Bàn giao cho TV2 (Frontend Developer & Test Lead)
*Mục đích: Bỏ mock data, kết nối API thật vào giao diện React để phục vụ nghiệm thu Gate 1 & Gate 2.*

* **Task TV2-01: Ghép Showroom & Bộ lọc xe**
  * *Endpoint:* `GET /api/v1/vehicles`
  * *Mô tả:* Lấy danh sách xe đang ở trạng thái `AVAILABLE`. Hỗ trợ các query params: `keyword`, `brand`, `minPrice`, `maxPrice`, `minYear`, `maxYear`, `transmission`, `fuelType`, `showroomId`, `page`, `size`, `sort`.
* **Task TV2-02: Ghép Trang Chi tiết xe**
  * *Endpoint:* `GET /api/v1/vehicles/{id}`
  * *Mô tả:* Hiển thị thông số kỹ thuật, số khung (VIN), showroom và nút **"Đặt cọc giữ xe"**.
* **Task TV2-03: Ghép Form Đặt cọc & Checkbox Lái thử (Quyết định D4)**
  * *Endpoint:* `POST /api/v1/deposits`
  * *Payload gửi lên:*
    ```json
    {
      "vehicleId": 1,
      "showroomId": 1,
      "appointmentDate": "2026-10-02T09:30:00",
      "hasTestDrive": true,
      "customerName": "Nguyễn Văn A",
      "customerPhone": "0987654321",
      "customerNote": "Muốn lái thử"
    }
    ```
  * *Nhận về:* `depositCode` và link ảnh `qrPaymentUrl` để hiển thị Modal QR.
* **Task TV2-04: Ghép Modal Quét mã QR & Xác nhận thanh toán**
  * *Endpoint:* `POST /api/v1/deposits/{id}/confirm`
  * *Mô tả:* Khách bấm "Đã thanh toán cọc". Nếu nhận 200 OK $\rightarrow$ chuyển trang xem biên lai; Nếu nhận **`409 Conflict`** $\rightarrow$ hiện thông báo đỏ cảnh báo xe đã bị khách khác cọc trước.
* **Task TV2-05: Ghép Trang Quản trị xe cho Admin (FR-13)**
  * *Endpoints:* `POST /api/v1/admin/vehicles`, `PUT /api/v1/admin/vehicles/{id}`, `DELETE /api/v1/admin/vehicles/{id}`.
* **Task TV2-06: Ghép Trang Đón tiếp của Staff (FR-12)**
  * *Endpoints:* `GET /api/v1/staff/appointments` và `PUT /api/v1/staff/appointments/{id}/check-in`.

---

### 2.2. Bàn giao cho TV3 (Database & Dữ liệu)
*Mục đích: Nạp cấu trúc bảng mới và dữ liệu mẫu vào PostgreSQL.*

* **Task TV3-01: Chạy Migration V3.0.0**
  * *File sử dụng:* `database/migrations/V3_0_0__showroom_deposit_appointment.sql`.
  * *Nội dung:* Tạo bảng `showrooms`, `deposits`, `appointments`, `transaction_ledger`; bổ sung cột `vin` (UNIQUE) và `status` cho bảng `vehicles`.
* **Task TV3-02: Nạp Dữ liệu mẫu (Seed Data)**
  * *Yêu cầu:* Tạo tối thiểu **10 xe mẫu** có số VIN, thông số kỹ thuật, giá bán, ODO, showroom và trạng thái ban đầu là `AVAILABLE`.
* **Task TV3-03: Cập nhật Data Dictionary**
  * *Nội dung:* Đồng bộ lại `Data_Dictionary.md` khớp với cấu trúc 5 bảng mới.

---

### 2.3. Bàn giao cho TV4 (Backend Xác thực & Phân quyền)
*Mục đích: TV4 cấu hình Spring Security & JWT bảo vệ các endpoint của TV1.*

* **Task TV4-01: Cấu hình Phân quyền Role (RBAC)**
  * URL Public (cho phép tất cả): `GET /api/v1/vehicles/**`
  * URL yêu cầu role `CUSTOMER`: `POST /api/v1/deposits/**`, `GET /api/v1/deposits/my`
  * URL yêu cầu role `STAFF`: `GET /api/v1/staff/appointments/**`, `PUT /api/v1/staff/appointments/**`
  * URL yêu cầu role `ADMIN`: `/api/v1/admin/**`
* **Task TV4-02: Current User Contract**
  * Sau khi hoàn tất JWT Filter, hỗ trợ TV1 trích xuất `userId` từ token thay vì dùng Header tạm `X-User-Id`.
* **Task TV4-03: Triển khai OTP**
  * Ưu tiên gửi OTP qua Gmail; nếu lỗi cấu hình thì chuyển sang OTP Demo 90 giây theo Quyết định D5.

---

### 2.4. Bàn giao cho TV5 (UML, SRS & Tài liệu)
*Mục đích: TV5 cập nhật SRS và vẽ biểu đồ khớp 100% với code thật của Spring Boot.*

* **Task TV5-01: Vẽ Sequence Diagram Luồng Đặt cọc giả lập & Khóa xe**
  * Sử dụng đúng tên các Controller (`DepositController`), Service (`DepositService`), Repository (`VehicleRepository`), Method (`confirmPayment`, `updateVehicleStatusIfAvailable`) và HTTP status `409 Conflict`.
* **Task TV5-02: Vẽ Collaboration Diagram cho Nhân viên Showroom**
  * Dùng các lớp Spring Boot: `StaffAppointmentController`, `AppointmentService`, `AppointmentRepository`.
* **Task TV5-03: Cập nhật Class Diagram**
  * Đưa đầy đủ các Entity (`Vehicle`, `Showroom`, `Deposit`, `Appointment`, `TransactionLedger`) vào Class Diagram.
* **Task TV5-04: Lập Ma trận truy vết (Traceability Matrix)**
  * Gắn vết các yêu cầu từ FR-01 đến FR-15 sang các API và Test Case tương ứng.
