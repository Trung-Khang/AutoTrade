# KỊCH BẢN KIỂM THỬ LUỒNG VÀNG — INTEGRATION GATE 2
## Đề tài: Hệ thống Quản lý Kinh doanh Ô tô Đã qua Sử dụng
- **Người lập kịch bản:** TV1 (Backend Core & Integration)
- **Đối tượng kiểm thử:** Cả 5 thành viên (TV1, TV2, TV3, TV4, TV5)
- **Thời điểm nghiệm thu:** 16:00 – 19:00 Ngày 2 (01/10/2026)
- **Mục tiêu:** Kiểm thử End-to-End luồng nghiệp vụ chính (P0) không còn dữ liệu mock, đảm bảo tính toàn vẹn trạng thái xe và chống cọc trùng.

---

## 1. DỮ LIỆU ĐẦU VÀO CHUẨN BỊ (PRE-CONDITIONS)

1. **Database:** Đã nạp migration `V3_0_0` và có ít nhất 1 Showroom (ID: 1 - Showroom Thủ Đức).
2. **Xe thử nghiệm:** 
   - ID: `1`, VIN: `VN-TOYOTA-CAMRY-2021-001`
   - Dòng xe: Toyota Camry 2.5Q 2021
   - Trạng thái ban đầu: **`AVAILABLE`**
3. **Tài khoản kiểm thử:**
   - Khách hàng A: `customerA@gmail.com` (User ID: 101)
   - Khách hàng B: `customerB@gmail.com` (User ID: 102)
   - Nhân viên Showroom: `staff@usedcar.vn` (User ID: 201)
   - Quản trị viên: `admin@usedcar.vn` (User ID: 301)

---

## 2. CÁC BƯỚC THỰC HIỆN KIỂM THỬ TỪNG BƯỚC (STEP-BY-STEP)

```mermaid
sequenceDiagram
    autonumber
    actor KhachA as Khách hàng A
    actor KhachB as Khách hàng B
    actor Staff as Nhân viên Showroom
    actor Admin as Quản trị viên
    participant Web as Giao diện Web (React)
    participant API as Backend (Spring Boot)
    participant DB as Database (PostgreSQL)

    Note over KhachA, DB: BƯỚC 1: XEM XE VÀ ĐẶT CỌC GIẢ LẬP
    KhachA->>Web: Xem chi tiết xe Toyota Camry
    Web->>API: GET /api/v1/vehicles/1
    API->>DB: Query vehicle status
    DB-->>API: status = 'AVAILABLE'
    API-->>Web: Trả về thông tin xe (AVAILABLE)
    KhachA->>Web: Điền form cọc, chọn ngày hẹn, tích [x] Lái thử xe
    Web->>API: POST /api/v1/deposits (vehicleId=1, hasTestDrive=true)
    API->>DB: INSERT deposits (PENDING), INSERT appointments
    API-->>Web: Trả về mã cọc + link ảnh VietQR giả lập 10 triệu
    
    Note over KhachA, DB: BƯỚC 2: XÁC NHẬN CHUYỂN KHOẢN & KHÓA XE
    KhachA->>Web: Quét QR và bấm "Đã thanh toán cọc"
    Web->>API: POST /api/v1/deposits/{id}/confirm
    API->>DB: UPDATE vehicles SET status='HOLD' WHERE id=1 AND status='AVAILABLE'
    DB-->>API: 1 row updated (Thành công)
    API->>DB: UPDATE deposits SET status='DEPOSITED', INSERT ledger
    API-->>Web: 200 OK: Trả về Biên lai cọc & Hợp đồng số

    Note over KhachB, DB: BƯỚC 3: KIỂM THỬ ÂM - CHỐNG CỌC TRÙNG (409 CONFLICT)
    KhachB->>Web: Cố tình đặt cọc chiếc xe Camry đó
    Web->>API: POST /api/v1/deposits/{id}/confirm
    API->>DB: UPDATE vehicles SET status='HOLD' WHERE id=1 AND status='AVAILABLE'
    DB-->>API: 0 rows updated (Xe không còn AVAILABLE!)
    API-->>Web: 409 Conflict: "Rất tiếc! Xe này vừa có khách hàng khác đặt cọc."

    Note over Staff, DB: BƯỚC 4: NHÂN VIÊN ĐÓN TIẾP & XÁC NHẬN LÁI THỬ
    Staff->>Web: Mở danh sách lịch hẹn hôm nay tại showroom
    Web->>API: GET /api/v1/staff/appointments?showroomId=1
    API-->>Web: Hiển thị lịch hẹn của Khách hàng A (hasTestDrive=true)
    Staff->>Web: Bấm Check-in đón tiếp và xác nhận lái thử
    Web->>API: PUT /api/v1/staff/appointments/{appId}/check-in
    API->>DB: UPDATE appointments SET status='COMPLETED'
    API-->>Web: 200 OK: Cập nhật thành công

    Note over Admin, DB: BƯỚC 5: ADMIN GIÁM SÁT DÒNG TIỀN CỌC & HOÀN CỌC
    Admin->>Web: Mở trang Sổ cái dòng tiền (Ledger)
    Web->>API: GET /api/v1/admin/ledger
    API-->>Web: Hiển thị tổng tiền cọc đang giữ (+10.000.000 VNĐ)
```

---

## 3. CHECKLIST NGHIỆM THU GATE 2 (PASS/FAIL CRITERIA)

| STT | Kịch bản kiểm thử | Kết quả mong đợi | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | Khách vãng lai xem danh sách & lọc xe | Chỉ hiển thị các xe có trạng thái `AVAILABLE`. Xe `HOLD` không xuất hiện ở danh sách bán. | **PASS** |
| 2 | Khởi tạo đơn cọc & lịch hẹn | Tạo đơn cọc `PENDING`, hiển thị ảnh QR giả lập 10 triệu; lưu tùy chọn lái thử `hasTestDrive = true`. | **PASS** |
| 3 | Xác nhận thanh toán cọc giả lập | Trạng thái đơn đổi thành `DEPOSITED`; Trạng thái xe đổi thành `HOLD`; Xuất mã biên lai `REC-...` và hợp đồng `HD-COC-...`. | **PASS** |
| 4 | **Test Race-Condition (Chống cọc trùng)** | Khách hàng B cọc cùng chiếc xe đó lập tức bị chặn với mã **HTTP 409 Conflict**; đơn cọc của B chuyển `CANCELLED`. | **PASS** |
| 5 | Nhân viên Check-in lịch hẹn | Danh sách hiển thị đúng showroom; bấm xác nhận chuyển sang `COMPLETED`, lưu ghi chú lái thử. | **PASS** |
| 6 | Quản trị viên Ledger & Hoàn cọc | Sổ cái tăng đúng 10 triệu; khi duyệt hoàn cọc (`REFUND`), trạng thái xe **tự động mở lại về `AVAILABLE`** để khách khác mua. | **PASS** |
