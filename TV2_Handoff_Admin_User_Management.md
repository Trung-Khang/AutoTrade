# BIÊN BẢN BÀN GIAO CONTRACT & YÊU CẦU BACKEND
## TÍNH NĂNG: QUẢN LÝ TÀI KHOẢN VÀ PHÂN QUYỀN (ADMIN USER MANAGEMENT)

- **Ngày lập:** 01/10/2026
- **Người bàn giao:** TV2 (Frontend Lead & Test Lead)
- **Bên tiếp nhận:** Backend Developers (TV1 - Admin Modules / TV4 - Auth & RBAC)
- **Đề tài:** Hệ thống Quản lý Kinh doanh Ô tô Đã qua Sử dụng (AutoTrade)
- **Baseline:** Contract API v3.0.0, Database PostgreSQL 18.6 (`autotrade_final` / `used_car_db`)

---

## 1. MỤC TIÊU & PHẠM VI NGHIỆP VỤ

Nhằm hoàn thiện phân hệ Quản trị (**ADMIN**) theo đúng mô hình RBAC chuẩn doanh nghiệp, TV2 đã xây dựng hoàn tất giao diện trang **Quản lý Tài khoản & Phân quyền (`/admin/users`)**.

Biên bản này mô tả chi tiết hợp đồng API (RESTful Contract) để bên Backend (TV1/TV4) tiến hành cài đặt các endpoint xử lý tương ứng trên Spring Boot.

> **Trạng thái Frontend:** TV2 đã triển khai hoàn tất UI, bộ lọc, bảng dữ liệu, KPI cards và cơ chế **Hybrid Mock Fallback** tại `frontend/src/services/userApi.js`. Giao diện có thể chạy thử nghiệm ngay lập tức và sẽ tự động đồng bộ API thật ngay khi Backend kích hoạt các endpoint dưới đây.

---

## 2. DANH SÁCH API CONTRACT YÊU CẦU

Base Path: `/api/v1/admin/users`  
Bảo mật bắt buộc: `@PreAuthorize("hasRole('ADMIN')")` kèm `Authorization: Bearer <jwt-token>`.

| STT | Phương thức | Endpoint | Tham số | Mô tả chức năng |
|:---:|:---:|:---|:---|:---|
| 1 | `GET` | `/api/v1/admin/users` | `keyword`, `role`, `status`, `page`, `size` | Tìm kiếm, lọc và phân trang danh sách người dùng |
| 2 | `PATCH` | `/api/v1/admin/users/{id}/status` | `locked` (boolean) | Khóa hoặc Mở khóa tài khoản người dùng |
| 3 | `PATCH` | `/api/v1/admin/users/{id}/role` | `role` (CUSTOMER, STAFF, ADMIN) | Chuyển đổi vai trò / Phân quyền tài khoản |
| 4 | `DELETE` | `/api/v1/admin/users/{id}` | - | Xóa tài khoản (Ràng buộc: chỉ xóa khi KHÔNG CÓ lịch hẹn và đơn cọc) |

---

## 3. CHI TIẾT CONTRACT TỪNG ENDPOINT

### 3.1. API Lấy danh sách tài khoản
- **Endpoint:** `GET /api/v1/admin/users`
- **Quyền:** `ADMIN`
- **Request Parameters:**
  - `keyword` *(String, tùy chọn)*: Tìm kiếm không phân biệt hoa thường theo `username`, `full_name`, `email`, `phone`.
  - `role` *(String, tùy chọn)*: Lọc theo vai trò (`ALL`, `CUSTOMER`, `STAFF`, `ADMIN`).
  - `status` *(String, tùy chọn)*: Lọc theo trạng thái (`ALL`, `ACTIVE`, `LOCKED`).
  - `page` *(Integer, mặc định 0)*: Số trang.
  - `size` *(Integer, mặc định 20)*: Kích thước trang.

- **Response thành công (`200 OK`):**
```json
{
  "content": [
    {
      "id": 1,
      "username": "admin",
      "fullName": "Quản trị viên Hệ thống",
      "email": "admin@autotrade.vn",
      "phone": "0901234567",
      "role": "ADMIN",
      "active": true,
      "emailVerified": true,
      "locked": false,
      "createdAt": "2026-10-01T08:00:00Z"
    },
    {
      "id": 2,
      "username": "staff",
      "fullName": "Nhân viên Showroom",
      "email": "staff@autotrade.vn",
      "phone": "0902345678",
      "role": "STAFF",
      "active": true,
      "emailVerified": true,
      "locked": false,
      "createdAt": "2026-10-01T08:00:00Z"
    },
    {
      "id": 12,
      "username": "ngochuy",
      "fullName": "Hoàng Ngọc Huy",
      "email": "huyhoang.260806@gmail.com",
      "phone": "0922008156",
      "role": "CUSTOMER",
      "active": true,
      "emailVerified": true,
      "locked": false,
      "createdAt": "2026-10-01T15:14:27Z"
    }
  ],
  "totalElements": 3,
  "totalPages": 1,
  "page": 0,
  "size": 20
}
```

---

### 3.2. API Khóa / Mở khóa tài khoản
- **Endpoint:** `PATCH /api/v1/admin/users/{id}/status`
- **Quyền:** `ADMIN`
- **Request Parameters / Body:**
  - `locked`: `true` (Khóa tài khoản) hoặc `false` (Mở khóa tài khoản).
- **Quy tắc nghiệp vụ (Business Validation):**
  - Không cho phép Admin tự khóa tài khoản của chính mình (so sánh với `SecurityUtils.currentUser().id()`).
  - Nếu cố tình khóa chính mình: Trả về lỗi `400 Bad Request` ("Không thể tự khóa tài khoản quản trị đang đăng nhập.").
- **Response thành công (`200 OK`):**
```json
{
  "id": 12,
  "username": "ngochuy",
  "fullName": "Hoàng Ngọc Huy",
  "email": "huyhoang.260806@gmail.com",
  "role": "CUSTOMER",
  "locked": true,
  "message": "Đã khóa tài khoản thành công."
}
```

---

### 3.3. API Đổi vai trò (Phân quyền RBAC)
- **Endpoint:** `PATCH /api/v1/admin/users/{id}/role`
- **Quyền:** `ADMIN`
- **Request Parameters / Body:**
  - `role`: Giá trị thuộc `["CUSTOMER", "STAFF", "ADMIN"]`.
- **Quy tắc nghiệp vụ:**
  - Không cho phép Admin tự hạ quyền của chính mình.
  - Giá trị role phải nằm trong enum hợp lệ, nếu không trả về `400 Bad Request`.
- **Response thành công (`200 OK`):**
```json
{
  "id": 12,
  "username": "ngochuy",
  "role": "STAFF",
  "message": "Cập nhật vai trò tài khoản thành công."
}
```

---

### 3.4. API Xóa tài khoản người dùng
- **Endpoint:** `DELETE /api/v1/admin/users/{id}`
- **Quyền:** `ADMIN`
- **Quy tắc nghiệp vụ & Ràng buộc bắt buộc (Business Constraints):**
  - Không cho phép Admin tự xóa tài khoản của chính mình (so sánh với `SecurityUtils.currentUser().id()`).
  - **Ràng buộc:** Chỉ cho phép xóa tài khoản khi người dùng **KHÔNG CÓ lịch hẹn (`appointments`)** và **KHÔNG CÓ đơn đặt cọc (`deposits`)**.
  - Nếu tài khoản có bất kỳ đơn cọc hoặc lịch hẹn nào -> Trả về lỗi `400 Bad Request`: *"Không thể xóa tài khoản này vì người dùng đang có lịch hẹn hoặc đơn đặt cọc trên hệ thống. Bạn có thể sử dụng chức năng Khóa tài khoản thay thế."*
- **Response thành công (`200 OK`):**
```json
{
  "success": true,
  "message": "Đã xóa tài khoản @customer thành công.",
  "deletedUserId": 3
}
```

---

## 4. ÁNH XẠ CƠ SỞ DỮ LIỆU (DATABASE MAPPING)

Cơ sở dữ liệu PostgreSQL của TV3 đã có sẵn đầy đủ các cột trong bảng `public.app_users`:
- `id` (BIGINT, Primary Key)
- `username` (VARCHAR)
- `email` (VARCHAR)
- `full_name` (VARCHAR)
- `phone` (VARCHAR)
- `role` (VARCHAR: 'CUSTOMER', 'STAFF', 'ADMIN')
- `active` (BOOLEAN)
- `email_verified` (BOOLEAN)
- `locked` (BOOLEAN)
- `created_at` (TIMESTAMP WITH TIME ZONE)

👉 **Backend chỉ cần viết Controller và Service thao tác trực tiếp trên `AppUserRepository` sẵn có, KHÔNG CẦN migration database mới!**

---

## 5. CHECKLIST BÀN GIAO & NGHIỆM THU

- [x] **TV2:** Đã hoàn thành trang UI `/admin/users` (Responsive, KPI, Bộ lọc, Nút thao tác).
- [x] **TV2:** Đã bổ sung đường dẫn vào thanh điều hướng Navbar và cấu hình bảo vệ Route (`allowedRoles={['ADMIN']}`).
- [x] **TV2:** Đã kiểm tra build production đạt 100% không lỗi (`138 modules transformed`).
- [ ] **Backend (TV1/TV4):** Tiếp nhận biên bản và cài đặt `AdminUserController.java`.
- [ ] **Test Lead (TV2):** Nghiệm thu chạy thử liên thông từ UI xuống PostgreSQL thật.
