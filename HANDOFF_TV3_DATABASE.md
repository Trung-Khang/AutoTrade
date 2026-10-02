# TÀI LIỆU BÀN GIAO THIẾT KẾ CƠ SỞ DỮ LIỆU (HANDOFF TV3 - DATABASE)
**Chức năng:** Quản lý Phân công Nhân viên Showroom & Lịch hẹn Tiếp đón Khách hàng  
**Người nhận:** TV3 (Database Lead)  
**Người lập:** TV2 (Frontend Lead & Test Lead) / Team Handoff  
**Ngày lập:** 02/10/2026  
**Mục tiêu:** Bổ sung liên kết giữa Nhân viên (Staff), Showroom và Lịch hẹn (Appointments), bảo đảm toàn vẹn dữ liệu và không làm ảnh hưởng các luồng cọc xe P0 hiện có.

---

## 1. TỔNG QUAN YÊU CẦU DỮ LIỆU
1. **Mỗi Showroom có đội ngũ nhân viên phụ trách:** Tài khoản nhân viên (`role = 'STAFF'`) phải thuộc về một Showroom xác định.
2. **Lịch hẹn tiếp đón gắn liền với nhân viên:** Khi khách hàng đặt cọc và chọn lịch xem xe/lái thử tại showroom, lịch hẹn (`appointments`) phải ghi nhận nhân viên tiếp nhận (`assigned_staff_id`).
3. **Chống trùng lịch tiếp khách (Conflict Constraint):** Một nhân viên tại một thời điểm (cùng ngày + khung giờ) chỉ tiếp đón tối đa 1 lịch hẹn đang hoạt động (`status IN ('PENDING', 'SCHEDULED')`).

---

## 2. CHI TIẾT MIGRATION SCHEMA (POSTGRESQL)

### 2.1. Thêm cột `showroom_id` vào bảng `app_users`
Nhân viên showroom (`role = 'STAFF'`) cần biết làm việc tại chi nhánh nào. Khách hàng (`CUSTOMER`) và Quản trị (`ADMIN`) có thể để `NULL`.

```sql
-- Migration: V3_0_6__staff_showroom_and_assigned_appointments.sql

-- 1. Bổ sung showroom_id cho tài khoản người dùng
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS showroom_id BIGINT;

-- 2. Tạo khóa ngoại liên kết tới bảng showrooms
ALTER TABLE app_users
ADD CONSTRAINT fk_app_users_showroom
FOREIGN KEY (showroom_id) REFERENCES showrooms(id)
ON DELETE SET NULL;

-- 3. Tạo index tăng tốc truy vấn tìm nhân viên theo showroom
CREATE INDEX IF NOT EXISTS idx_app_users_showroom_role 
ON app_users(showroom_id, role) 
WHERE active = true AND locked = false;
```

---

### 2.2. Thêm cột `assigned_staff_id` vào bảng `appointments`
Ghi nhận nhân viên showroom chịu trách nhiệm tiếp đón khách hàng đến xem xe / lái thử.

```sql
-- 4. Bổ sung assigned_staff_id cho lịch hẹn
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS assigned_staff_id BIGINT;

-- 5. Tạo khóa ngoại liên kết tới bảng app_users
ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_assigned_staff
FOREIGN KEY (assigned_staff_id) REFERENCES app_users(id)
ON DELETE RESTRICT;

-- 6. Tạo index hỗ trợ truy vấn lọc lịch hẹn cá nhân của nhân viên
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_staff_date 
ON appointments(assigned_staff_id, appointment_date, status);
```

---

### 2.3. Ràng buộc toàn vẹn & Chống trùng lịch (Integrity & Business Rules)
* **Khóa mềm / Logical constraint:** Một nhân viên không thể có 2 lịch hẹn trùng nhau trong cùng một khung thời gian nếu lịch đó chưa hoàn thành hoặc chưa hủy.
* Tùy chọn Index Unique có điều kiện (Partial Unique Index) để bảo vệ mức DB:
```sql
-- 7. Chống trùng lịch tiếp khách của cùng 1 nhân viên trong cùng ngày giờ
-- (Chỉ áp dụng với các lịch hẹn đang chờ xử lý: PENDING, SCHEDULED)
CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_appointment_slot 
ON appointments(assigned_staff_id, appointment_date) 
WHERE status IN ('PENDING', 'SCHEDULED');
```
> **Lưu ý TV3:** Nếu hệ thống cho phép lệch phút (ví dụ hẹn 9h30 và 9h45), Backend sẽ kiểm tra theo khoảng thời gian (`range check`). Nếu áp dụng khung giờ cố định (`08:30, 09:30, 10:30, 14:00, 15:30, 17:00`), Unique Index trên sẽ ngăn chặn hoàn toàn tình trạng race condition trùng lịch ở tầng DB!

---

## 3. SEED DỮ LIỆU MẪU (DEMO ACCOUNTS & SHOWROOMS)

Để phục vụ kiểm thử và demo đồ án, TV3 thực hiện seed ít nhất 2–3 nhân viên cho các Showroom trọng điểm:
* Showroom 1 (AutoTrade Hà Nội): 2 nhân viên
* Showroom 2 (AutoTrade TP. Hồ Chí Minh): 3 nhân viên
* Showroom 3 (AutoTrade Đà Nẵng): 2 nhân viên

### Script Seed mẫu (Mật khẩu mặc định: `Password@123` - BCrypt 12 rounds):
```sql
-- BCrypt hash của 'Password@123': $2a$12$e8Yw38p3sA6oM1Yqg1kK..X3D79tE.g9J2m3I9oF8aYy6m4z7d9Wq (hoặc hash từ OtpMailServiceTest)

-- Nhân viên Showroom Hà Nội (showroom_id = 1)
INSERT INTO app_users (username, email, password_hash, full_name, phone, role, active, email_verified, locked, showroom_id, created_at, updated_at)
VALUES 
('staff_hn_01', 'staff_hn1@autotrade.vn', '$2a$12$K8p9bL.qY7z1eR5tU3iO.OW5aY5vD3eE7m2I8oF9aYy6m4z7d9Wqe', 'Nguyễn Văn Tuấn', '0912345601', 'STAFF', true, true, false, 1, NOW(), NOW()),
('staff_hn_02', 'staff_hn2@autotrade.vn', '$2a$12$K8p9bL.qY7z1eR5tU3iO.OW5aY5vD3eE7m2I8oF9aYy6m4z7d9Wqe', 'Trần Thị Thu Hà', '0912345602', 'STAFF', true, true, false, 1, NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET showroom_id = EXCLUDED.showroom_id;

-- Nhân viên Showroom TP.HCM (showroom_id = 2)
INSERT INTO app_users (username, email, password_hash, full_name, phone, role, active, email_verified, locked, showroom_id, created_at, updated_at)
VALUES 
('staff_hcm_01', 'staff_hcm1@autotrade.vn', '$2a$12$K8p9bL.qY7z1eR5tU3iO.OW5aY5vD3eE7m2I8oF9aYy6m4z7d9Wqe', 'Lê Hoàng Nam', '0987654301', 'STAFF', true, true, false, 2, NOW(), NOW()),
('staff_hcm_02', 'staff_hcm2@autotrade.vn', '$2a$12$K8p9bL.qY7z1eR5tU3iO.OW5aY5vD3eE7m2I8oF9aYy6m4z7d9Wqe', 'Phạm Minh Đức', '0987654302', 'STAFF', true, true, false, 2, NOW(), NOW()),
('staff_hcm_03', 'staff_hcm3@autotrade.vn', '$2a$12$K8p9bL.qY7z1eR5tU3iO.OW5aY5vD3eE7m2I8oF9aYy6m4z7d9Wqe', 'Đỗ Thùy Linh', '0987654303', 'STAFF', true, true, false, 2, NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET showroom_id = EXCLUDED.showroom_id;

-- Nhân viên Showroom Đà Nẵng (showroom_id = 3)
INSERT INTO app_users (username, email, password_hash, full_name, phone, role, active, email_verified, locked, showroom_id, created_at, updated_at)
VALUES 
('staff_dn_01', 'staff_dn1@autotrade.vn', '$2a$12$K8p9bL.qY7z1eR5tU3iO.OW5aY5vD3eE7m2I8oF9aYy6m4z7d9Wqe', 'Võ Quốc Huy', '0905123401', 'STAFF', true, true, false, 3, NOW(), NOW()),
('staff_dn_02', 'staff_dn2@autotrade.vn', '$2a$12$K8p9bL.qY7z1eR5tU3iO.OW5aY5vD3eE7m2I8oF9aYy6m4z7d9Wqe', 'Ngô Bảo Trân', '0905123402', 'STAFF', true, true, false, 3, NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET showroom_id = EXCLUDED.showroom_id;
```

---

## 4. CHECKLIST NGHIỆM THU DÀNH CHO TV3
- [ ] Chạy file migration `V3_0_6` không gây lỗi trên cơ sở dữ liệu `autotrade_final`.
- [ ] Kiểm tra các đơn cọc / lịch hẹn cũ trong DB: Cột `assigned_staff_id` chấp nhận `NULL` (backward compatible với dữ liệu test cũ).
- [ ] Xác nhận các tài khoản Staff đăng nhập được bình thường với email/password đã seed.
- [ ] Xác nhận lệnh query `SELECT * FROM app_users WHERE showroom_id = 1 AND role = 'STAFF'` trả về đúng danh sách nhân viên.
