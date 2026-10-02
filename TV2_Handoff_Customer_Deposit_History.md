# TÀI LIỆU BÀN GIAO: CHUẨN HÓA DỮ LIỆU ĐƠN CỌC & LỊCH HẸN ROLE CUSTOMER (TV2 HANDOFF)

**Người bàn giao:** TV2 (Frontend Lead & Test Lead)  
**Người nhận bàn giao:** TV (Backend Developer phụ trách Module Đặt Cọc & Lịch Hẹn)  
**Ngày cập nhật:** 02/10/2026  
**Mục tiêu:** Khắc phục triệt để lỗi hiển thị tại màn hình **"Đơn Đặt Cọc & Lịch Hẹn Của Tôi"** (Role CUSTOMER - `CustomerDepositHistoryPage.jsx`).

---

## 1. BỐI CẢNH VÀ VẤN ĐỀ CẦN GIẢI QUYẾT

### Hiện trạng lỗi (xem ảnh thực tế):
1. **Số tiền đã cọc:** Hiển thị chữ `"Liên hệ"` màu cam thay vì số tiền thực tế (VD: `105,000,000 ₫` hoặc `10,000,000 ₫`).
2. **Xe đặt cọc:** Trống tên xe, giá xe hiển thị `"Giá xe: Liên hệ"`.
3. **Lịch hẹn Showroom:** Bị rỗng ngày giờ, chỉ hiển thị mỗi icon và cặp ngoặc trống: `🗓️ ()`.
4. **Trạng thái hẹn:** Mặc định luôn hiện `"Đã lên lịch"` (màu xanh dương) ngay cả khi đơn cọc mới ở trạng thái `PENDING` (khách chưa quét QR thanh toán).

### Nguyên nhân kỹ thuật:
- Endpoint `GET /api/v1/deposits/my` ở Backend hiện tại trả về thẳng danh sách Entity `Deposit` từ DB (`depositRepository.findByUserIdOrderByCreatedAtDesc(userId)`).
- Entity `Deposit` chỉ có các trường: `id`, `depositCode`, `vehicleId`, `userId`, `showroomId`, `amount`, `status`.
- Entity `Deposit` **không có** `vehicleTitle`, `vehiclePrice`, `appointmentDate`, `appointmentStatus`, `showroomName`. Các dữ liệu này nằm ở các bảng khác (`vehicles`/`listings`, `appointments`, `showrooms`).
- Ngoài ra, tên trường số tiền trong Entity là `amount`, trong khi FE đang đọc `depositAmount` dẫn tới `undefined` và render ra `"Liên hệ"`.

---

## 2. NHỮNG THAY ĐỔI ĐÃ THỰC HIỆN Ở PHÍA FRONTEND (FE ĐÃ XONG)

Đã cập nhật file: `frontend/src/pages/CustomerDepositHistoryPage.jsx` với cơ chế **Tương thích 2 chiều (Backward & Forward Compatibility)**:
1. **Tương thích trường tiền:** Hỗ trợ đọc cả `item.depositAmount` lẫn `item.amount`.
2. **Tương thích trường xe & showroom:** Nhận `item.vehicleTitle`, `item.vehiclePrice`, `item.showroomName`.
3. **Định dạng ngày giờ hẹn an toàn:** Hàm `formatAppointmentDateTime()` tự format ngày giờ đẹp (`DD/MM/YYYY (HH:mm)`), nếu rỗng sẽ hiển thị `"Chờ sắp xếp lịch"` chứ không bị lỗi ` ()`.
4. **Xử lý trạng thái thông minh:**
   - Đơn cọc có trạng thái `PENDING` / `PENDING_PAYMENT` -> Badge trạng thái đơn là **"Chờ thanh toán"**; trạng thái lịch hẹn tương ứng tự động hiển thị **"Chờ thanh toán cọc"** màu vàng cam (không bị gán nhầm là "Đã lên lịch").
   - Đơn cọc `DEPOSITED` -> Badge **"Đã đặt cọc"** màu xanh lá; lịch hẹn hiển thị **"Đã lên lịch"** hoặc theo `appointmentStatus`.
   - Hỗ trợ thêm các trạng thái `CANCELLED` (Đã hủy cọc) và `REFUNDED` (Đã hoàn cọc).

> ⚠️ **Cam kết độc lập mã nguồn:** FE chỉ sửa duy nhất 1 file `CustomerDepositHistoryPage.jsx`. **Không chạm** vào `depositApi.js`, `DepositPage.css`, `DepositController.java`... để đảm bảo **100% không xung đột Git** với 5 task bạn đang fix.

---

## 3. HỢP ĐỒNG API CẦN THỐNG NHẤT (API CONTRACT CHO BACKEND)

### Endpoint: `GET /api/v1/deposits/my`
- **Mô tả:** Lấy danh sách hồ sơ đặt cọc và lịch hẹn chi tiết của khách hàng đang đăng nhập.
- **Phương thức:** `GET`
- **Xác thực:** Lấy `userId` từ JWT Authentication Token của User (Spring Security `Authentication` / `SecurityContextHolder`). **Bỏ `X-User-Id` và bỏ default `userId = 1`**.
- **HTTP Status:** `200 OK`

### Mẫu JSON Response trả về mong muốn:
```json
[
  {
    "depositId": 1,
    "depositCode": "DEP-1790904541779",
    "depositAmount": 105000000.00,
    "status": "DEPOSITED",
    "contractNumber": "HD-COC-2026-0001",
    "vehicleId": 10813,
    "vehicleTitle": "Toyota Camry 2.5Q 2021",
    "vehiclePrice": 1050000000.00,
    "showroomId": 1,
    "showroomName": "Showroom AutoTrade Trung Tâm",
    "appointmentId": 15,
    "appointmentDate": "2026-10-05T09:30:00",
    "appointmentStatus": "CONFIRMED",
    "hasTestDrive": true,
    "customerNote": "Khách hẹn xem xe buổi sáng",
    "createdAt": "2026-10-02T04:15:00Z"
  }
]
```

---

## 4. HƯỚNG DẪN TRIỂN KHAI CHO BACKEND (JAVA SPRING BOOT)

Database **KHÔNG CẦN thay đổi hay chạy SQL script nào**. Backend chỉ cần thực hiện 2 bước đơn giản:

### Bước 1: Tạo DTO `CustomerDepositResponse.java`
Tạo tại: `backend/src/main/java/com/system/dto/CustomerDepositResponse.java`
```java
package com.system.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

public class CustomerDepositResponse {
    private Long depositId;
    private String depositCode;
    private BigDecimal depositAmount;
    private String status;
    private String contractNumber;
    
    // Thông tin xe
    private Long vehicleId;
    private String vehicleTitle;
    private BigDecimal vehiclePrice;
    
    // Thông tin showroom & lịch hẹn
    private Long showroomId;
    private String showroomName;
    private Long appointmentId;
    private LocalDateTime appointmentDate;
    private String appointmentStatus;
    private boolean hasTestDrive;
    private String customerNote;
    private Instant createdAt;

    // Getters and Setters ...
}
```

### Bước 2: Cập nhật hàm `getMyDeposits` trong `DepositService.java`
Thay vì trả về `List<Deposit>`, cập nhật kiểu trả về thành `List<CustomerDepositResponse>`:
```java
@Transactional(readOnly = true)
public List<CustomerDepositResponse> getMyDeposits(Long userId) {
    List<Deposit> deposits = depositRepository.findByUserIdOrderByCreatedAtDesc(userId);
    List<CustomerDepositResponse> result = new ArrayList<>();

    for (Deposit d : deposits) {
        CustomerDepositResponse res = new CustomerDepositResponse();
        res.setDepositId(d.getId());
        res.setDepositCode(d.getDepositCode());
        res.setDepositAmount(d.getAmount());
        res.setStatus(d.getStatus());
        res.setContractNumber(d.getContractNumber());
        res.setVehicleId(d.getVehicleId());
        res.setShowroomId(d.getShowroomId());
        res.setCreatedAt(d.getCreatedAt());

        // 1. Lấy thông tin xe & giá
        if (d.getVehicleId() != null) {
            vehicleRepository.findById(d.getVehicleId()).ifPresent(v -> {
                res.setVehicleTitle(v.getBrand() + " " + v.getModel() + (v.getVariant() != null ? " " + v.getVariant() : ""));
                if (listingRepository != null) {
                    List<Listing> listings = listingRepository.findByVehicleId(v.getId());
                    if (listings != null && !listings.isEmpty() && listings.get(0).getPrice() != null) {
                        res.setVehiclePrice(listings.get(0).getPrice());
                    }
                }
            });
        }

        // 2. Lấy thông tin Showroom
        if (d.getShowroomId() != null) {
            showroomRepository.findById(d.getShowroomId()).ifPresent(s -> {
                res.setShowroomName(s.getName());
            });
        }

        // 3. Lấy thông tin Lịch hẹn theo depositId
        appointmentRepository.findByDepositId(d.getId()).ifPresent(app -> {
            res.setAppointmentId(app.getId());
            res.setAppointmentDate(app.getAppointmentDate());
            res.setAppointmentStatus(app.getStatus());
            res.setHasTestDrive(app.isHasTestDrive());
            res.setCustomerNote(app.getCustomerNote());
        });

        result.add(res);
    }

    return result;
}
```

### Bước 3: Cập nhật `DepositController.java`
Thay đổi endpoint `GET /api/v1/deposits/my`:
```java
@GetMapping("/my")
@Operation(summary = "Danh sách đơn cọc của tôi")
public ResponseEntity<List<CustomerDepositResponse>> getMyDeposits(Authentication authentication) {
    // Trích xuất userId từ JWT UserDetails thay vì dùng X-User-Id default 1
    Long userId = extractUserIdFromAuth(authentication); 
    List<CustomerDepositResponse> deposits = depositService.getMyDeposits(userId);
    return ResponseEntity.ok(deposits);
}
```

---

## 5. CHECKLIST KIỂM THỬ XÁC NHẬN (ACCEPTANCE CRITERIA)
- [x] **FE:** `CustomerDepositHistoryPage.jsx` không bị crash khi dữ liệu null/undefined.
- [x] **FE:** Hiển thị đúng số tiền cọc (không bị `"Liên hệ"`).
- [x] **FE:** Trạng thái đơn `PENDING` không tự ý hiển thị lịch hẹn là `"Đã lên lịch"`.
- [ ] **BE:** Endpoint `GET /api/v1/deposits/my` trả về đầy đủ các trường DTO theo hợp đồng.
- [ ] **BE:** Lấy đúng `userId` từ token JWT, không phụ thuộc `X-User-Id`.
