# TÀI LIỆU BÀN GIAO THIẾT KẾ BACKEND (HANDOFF TV4 - BACKEND)
**Chức năng:** Phân Công Nhân Viên Showroom, Kiểm Tra Trùng Lịch & Phân Quyền RBAC Lịch Hẹn  
**Người nhận:** TV4 & TV1 (Backend Developers)  
**Người lập:** TV2 (Frontend Lead & Test Lead) / Team Handoff  
**Ngày lập:** 02/10/2026  
**Mục tiêu:** Cung cấp API kiểm tra lịch trống của nhân viên, thuật toán Auto-Assign thông minh, phân quyền xem lịch hẹn theo từng Staff và bổ sung thông tin Showroom + Nhân viên vào Biên lai.

---

## 1. CẬP NHẬT ENTITY & DTO

### 1.1. `AppUser.java`
Thêm trường liên kết với Showroom:
```java
@Column(name = "showroom_id")
private Long showroomId;

public Long getShowroomId() { return showroomId; }
public void setShowroomId(Long showroomId) { this.showroomId = showroomId; }
```

### 1.2. `Appointment.java`
Thêm trường nhân viên được phân công:
```java
@Column(name = "assigned_staff_id")
private Long assignedStaffId;

public Long getAssignedStaffId() { return assignedStaffId; }
public void setAssignedStaffId(Long assignedStaffId) { this.assignedStaffId = assignedStaffId; }
```

### 1.3. `CreateDepositRequest.java`
Thêm `assignedStaffId` (không bắt buộc, nếu khách không chọn thì hệ thống tự động gán):
```java
private Long assignedStaffId;

public Long getAssignedStaffId() { return assignedStaffId; }
public void setAssignedStaffId(Long assignedStaffId) { this.assignedStaffId = assignedStaffId; }
```

### 1.4. `AppointmentResponse.java` (Record DTO)
Mở rộng DTO trả về cho Frontend hiển thị chi tiết:
```java
package com.system.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AppointmentResponse(
        Long id,
        Long appointmentId,
        Long depositId,
        String depositCode,
        String depositStatus,
        BigDecimal depositAmount,
        String customerName,
        String customerPhone,
        String vehicleInfo,
        Long vehicleId,
        LocalDateTime appointmentDate,
        boolean hasTestDrive,
        String status,
        String customerNote,
        String staffNote,
        // Các trường mới:
        Long showroomId,
        String showroomName,
        String showroomAddress,
        Long assignedStaffId,
        String assignedStaffName,
        String assignedStaffPhone
) { }
```

### 1.5. Tạo mới `StaffAvailabilityDto.java`
DTO trả về danh sách nhân viên của một showroom kèm trạng thái rảnh/bận:
```java
package com.system.dto;

public record StaffAvailabilityDto(
        Long id,
        String fullName,
        String phone,
        String email,
        boolean isAvailable,
        String statusText // "Sẵn sàng đón tiếp" hoặc "Đã kín lịch"
) { }
```

---

## 2. ĐẶC TẢ API MỚI & CẬP NHẬT ENDPOINT

### 2.1. API Lấy danh sách nhân viên của Showroom & Kiểm tra lịch bận
* **Endpoint:** `GET /api/v1/showrooms/{id}/staff`
* **Query Params:**
  - `appointmentDate` *(Optional, ISO LocalDateTime)*: `2026-10-05T09:30:00`
* **Phân quyền:** `PermitAll` (hoặc `Authenticated`)
* **Logic xử lý:**
  1. Lấy danh sách nhân viên: `appUserRepository.findByShowroomIdAndRoleAndActiveTrue(showroomId, Role.STAFF)`.
  2. Nếu có truyền `appointmentDate`:
     - Với mỗi nhân viên, kiểm tra xem có lịch hẹn nào trùng thời gian không:
       `appointmentRepository.existsByAssignedStaffIdAndAppointmentDateAndStatusIn(staff.getId(), appointmentDate, List.of("PENDING", "SCHEDULED"))`.
     - Nếu tồn tại $\rightarrow$ `isAvailable = false`, `statusText = "Đã kín lịch"`.
     - Nếu không $\rightarrow$ `isAvailable = true`, `statusText = "Sẵn sàng đón tiếp"`.
* **Response 200 OK mẫu:**
```json
[
  {
    "id": 12,
    "fullName": "Lê Hoàng Nam",
    "phone": "0987654301",
    "email": "staff_hcm1@autotrade.vn",
    "isAvailable": true,
    "statusText": "Sẵn sàng đón tiếp"
  },
  {
    "id": 13,
    "fullName": "Phạm Minh Đức",
    "phone": "0987654302",
    "email": "staff_hcm2@autotrade.vn",
    "isAvailable": false,
    "statusText": "Đã kín lịch"
  }
]
```

---

### 2.2. Cập nhật API Tạo đơn cọc: `POST /api/v1/deposits`
Cập nhật trong `DepositService.createDeposit(CreateDepositRequest request)`:

```java
// BƯỚC: Phân công nhân viên tiếp đón
Long targetStaffId = request.getAssignedStaffId();

if (targetStaffId != null) {
    // 1. Nếu khách chủ động chọn nhân viên:
    AppUser staff = appUserRepository.findById(targetStaffId)
        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên với ID: " + targetStaffId));
    
    if (staff.getRole() != Role.STAFF || !Boolean.TRUE.equals(staff.isActive())) {
        throw new IllegalArgumentException("Tài khoản được chọn không phải là nhân viên showroom hợp lệ.");
    }
    
    // Kiểm tra nhân viên có thuộc đúng showroom của xe không
    if (vehicle.getShowroomId() != null && !vehicle.getShowroomId().equals(staff.getShowroomId())) {
        throw new IllegalArgumentException("Nhân viên này không thuộc showroom trưng bày xe.");
    }

    // Kiểm tra trùng lịch hẹn
    boolean isBusy = appointmentRepository.existsByAssignedStaffIdAndAppointmentDateAndStatusIn(
        targetStaffId, request.getAppointmentDate(), List.of("PENDING", "SCHEDULED")
    );
    if (isBusy) {
        throw new IllegalArgumentException("Chuyên viên " + staff.getFullName() + " đã có lịch hẹn tiếp khách vào khung giờ này. Vui lòng chọn chuyên viên khác hoặc đổi khung giờ.");
    }
} else {
    // 2. Thuật toán Auto-Assign thông minh (nếu khách không chọn):
    List<AppUser> staffList = appUserRepository.findByShowroomIdAndRoleAndActiveTrue(
        vehicle.getShowroomId(), Role.STAFF
    );
    
    // Tìm nhân viên đầu tiên đang rảnh trong khung giờ hẹn
    AppUser availableStaff = null;
    for (AppUser s : staffList) {
        boolean busy = appointmentRepository.existsByAssignedStaffIdAndAppointmentDateAndStatusIn(
            s.getId(), request.getAppointmentDate(), List.of("PENDING", "SCHEDULED")
        );
        if (!busy) {
            availableStaff = s;
            break;
        }
    }
    
    if (availableStaff != null) {
        targetStaffId = availableStaff.getId();
    } else if (!staffList.isEmpty()) {
        // Fallback: Nếu tất cả đều bận, gán cho nhân viên đầu tiên để không chặn đơn cọc của khách
        targetStaffId = staffList.get(0).getId();
    }
}

appointment.setAssignedStaffId(targetStaffId);
```

---

### 2.3. Cập nhật API Tra cứu lịch hẹn: `GET /api/v1/staff/appointments`
Trong `StaffAppointmentController.java`: Phân quyền RBAC nghiêm ngặt:

```java
@GetMapping
public ResponseEntity<List<AppointmentResponse>> getAppointments(
        @RequestParam(required = false) Long showroomId,
        @RequestParam(required = false) String status) {

    AppUser currentUser = SecurityUtils.currentUser();
    List<AppointmentResponse> all = ledgerService.getAppointments();

    // 1. Phân quyền RBAC:
    if (currentUser.getRole() == Role.STAFF) {
        // NHÂN VIÊN: CHỈ xem được lịch hẹn mà mình được phân công phụ trách
        all = all.stream()
                .filter(item -> item.assignedStaffId() != null && item.assignedStaffId().equals(currentUser.getId()))
                .toList();
    } 
    // ADMIN: Được xem tất cả lịch hẹn, cho phép lọc theo showroomId nếu có

    // 2. Lọc theo trạng thái và showroom:
    if (showroomId != null) {
        all = all.stream().filter(item -> showroomId.equals(item.showroomId())).toList();
    }
    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
        all = all.stream().filter(item -> status.equalsIgnoreCase(item.status())).toList();
    }

    return ResponseEntity.ok(all);
}
```

### 2.4. Cập nhật API Check-in: `PUT /api/v1/staff/appointments/{id}/check-in`
* Bổ sung kiểm tra quyền sở hữu:
  ```java
  Appointment app = appointmentRepository.findById(id)
      .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn: " + id));

  AppUser currentUser = SecurityUtils.currentUser();
  if (currentUser.getRole() == Role.STAFF) {
      if (app.getAssignedStaffId() == null || !app.getAssignedStaffId().equals(currentUser.getId())) {
          throw new AccessDeniedException("Bạn không có quyền check-in lịch hẹn của nhân viên khác.");
      }
  }
  ```

---

### 2.5. Cập nhật DTO Xác nhận thanh toán & Biên lai
* Trong `DepositService.confirmPayment()` và `DepositService.getReceipt()`:
  - Bổ sung vào kết quả trả về:
    - `showroomName`: Tên showroom (VD: "AutoTrade Showroom TP. Hồ Chí Minh")
    - `showroomAddress`: Địa chỉ (VD: "Số 1 Võ Văn Ngân, TP. Thủ Đức, TP.HCM")
    - `assignedStaffName`: Tên nhân viên phụ trách (VD: "Lê Hoàng Nam")
    - `assignedStaffPhone`: Số điện thoại nhân viên (VD: "0987654301")

---

## 3. CHECKLIST KIỂM THỬ DÀNH CHO TV4
- [ ] Chạy `mvn test`: Đảm bảo 22/22 unit tests hiện tại không bị gãy.
- [ ] Test API `GET /api/v1/showrooms/1/staff?appointmentDate=2026-10-05T09:30:00`: Trả về đúng danh sách nhân viên kèm trạng thái `isAvailable`.
- [ ] Test tạo cọc chọn nhân viên bận: Trả về lỗi 400 Bad Request rõ ràng.
- [ ] Test đăng nhập bằng tài khoản Staff `staff_hcm_01`: Gọi `GET /api/v1/staff/appointments` chỉ trả về đúng các lịch của nhân viên này, không thấy lịch của `staff_hcm_02`.
- [ ] Đăng nhập bằng `admin`: Xem được danh sách toàn bộ lịch hẹn trên cả nước.
