# BÁO CÁO RÀ SOÁT HỆ THỐNG & BÀN GIAO CÁC ĐIỂM CẦN TINH CHỈNH (TV2 HANDOFF)

**Người lập:** TV2 (Frontend Lead & Test Lead)  
**Người nhận:** Backend Developer (TV4) & Team  
**Ngày cập nhật:** 02/10/2026  
**Mục tiêu:** Rà soát toàn diện, ghi nhận các phần ĐÃ HOÀN TẤT và chỉ ra chính xác các lỗi dữ liệu còn tồn đọng cần tinh chỉnh.

---

## 1. KẾT QUẢ RÀ SOÁT: CÁC NỘI DUNG BACKEND ĐÃ HOÀN TẤT XONG (KHÔNG CẦN LÀM LẠI)

Sau khi rà soát toàn bộ source code Backend vừa merge, ghi nhận TV4 đã xử lý rất tốt các phần sau:
- [x] **Xác thực JWT & Bỏ `X-User-Id`:** `DepositController.java` đã chuyển sang dùng `SecurityUtils.currentUser().id()`, không còn tin cậy header `X-User-Id`.
- [x] **Chức năng Hủy / Đổi lịch & Hoàn cọc (Role Admin):** Đã tạo `AdminAppointmentController.java` và hoàn tất logic `@Transactional` an toàn trong `AdminLedgerService` (hủy lịch `CANCELLED`, hoàn cọc `REFUNDED`, mở xe `AVAILABLE`, ghi bút toán âm vào `TransactionLedger` và khóa bi quan `findLockedById`).
- [x] **Gỡ bỏ Fallback LocalStorage:** `depositApi.js` đã gỡ bỏ hoàn toàn logic giả lập lưu LocalStorage khi API lỗi.
- [x] **CSS in ấn biên lai:** `DepositPage.css` đã được cập nhật `@media print`.
- [x] **Đã tạo các DTO mới:** Đã có `CustomerDepositResponse` và `AppointmentResponse`.

---

## 2. CÁC ĐIỂM NGHẼN DỮ LIỆU THỰC TẾ CÒN TỒN ĐỌNG CẦN TINH CHỈNH Ở BACKEND

Qua kiểm thử thực tế trên giao diện, phát hiện 2 nguyên nhân cốt lõi khiến dữ liệu hiển thị chưa đầy đủ:

### ⚠️ Điểm 1: Giá xe và Tên xe bị NULL trong `DepositService.getMyDeposits()`
* **Hiện trạng trên UI:** Xe cọc hiện *"Xe tại Showroom"*, giá xe hiện *"Giá xe: Liên hệ"*.
* **Nguyên nhân trong code:**
  - Trong `DepositService.java` (dòng 262): code đang lấy `vehicle.getPrice()`.
  - Nhưng trong cấu trúc database dự án, **cột `price` của bảng `vehicles` là NULL** (toàn bộ hơn 10.800 xe đều lưu giá bán trong bảng **`listings`**).
  - Ngoài ra, nếu `deposit.getVehicleId()` lưu ID của listing (ví dụ xe #10813 có `listing_id = 10813`, `vehicle_id = 10850`) thì `vehicleRepository.findById(10813)` sẽ trả về `null`.
* **Hướng tinh chỉnh trong `DepositService.java`:**
  ```java
  // Lấy Vehicle (hỗ trợ cả trường hợp ID là listing_id)
  Vehicle vehicle = null;
  if (deposit.getVehicleId() != null) {
      vehicle = vehicleRepository.findById(deposit.getVehicleId()).orElse(null);
      if (vehicle == null && listingRepository != null) {
          Listing listing = listingRepository.findById(deposit.getVehicleId()).orElse(null);
          if (listing != null) vehicle = listing.getVehicle();
      }
  }

  // Lấy giá niêm yết từ ListingRepository (thay vì vehicle.getPrice())
  BigDecimal vehiclePrice = null;
  if (vehicle != null && listingRepository != null) {
      List<Listing> listings = listingRepository.findByVehicleId(vehicle.getId());
      if (listings != null && !listings.isEmpty()) {
          vehiclePrice = listings.get(0).getPrice();
      }
  }
  ```

---

### ⚠️ Điểm 2: Lịch hẹn bị hiện *"Chờ sắp xếp lịch"* và Staff Portal thiếu thông tin khách
* **Hiện trạng trên UI:**
  - Khách hàng (`/customer/deposits`): hiện *"Chờ sắp xếp lịch"* và *"Chờ xác nhận"*.
  - Nhân viên (`/staff/appointments`): hiện ngày giờ nhưng trống Tên khách, SĐT và Tên xe.
* **Nguyên nhân:**
  1. Trong `DepositService.getMyDeposits()`: gọi `appointmentRepository.findByDepositId(deposit.getId())`. Các đơn hàng test cũ trong DB có `deposit_id` trong bảng `appointments` bị `NULL` nên trả về `null`.
  2. Trong `AdminLedgerService.toResponse()`: tìm user qua `appUserRepository.findById(appointment.getUserId())`. Nếu `appointment.getUserId()` là user vãng lai hoặc không khớp trong bảng `app_users`, `customer` là `null` nên `customerPhone` trả về `null`.
* **Hướng tinh chỉnh:**
  - Với đơn cọc: Đảm bảo khi tạo cọc (`createDeposit`), `appointment.setDepositId(deposit.getId())` luôn được lưu thành công.
  - Với Staff: Trong `toResponse()`, nếu `customer == null`, kiểm tra thêm thông tin khách hàng từ đơn cọc liên kết (`deposit`) hoặc thông tin ghi chú để không bị trống số điện thoại.

---

### ⚡ 3. LƯU Ý ĐẶC BIỆT QUAN TRỌNG: BUILD LẠI FILE `.WAR` ĐỂ CHẠY
* File `backend-0.0.1-SNAPSHOT.war` trong thư mục `backend/target/` hiện tại có thời gian build là **10:15 PM ngày 01/10/2026 (từ đêm qua)**.
* Các commit mới nhất của TV4 vừa push trưa nay (`84bde5e`, `fcb8a82`) **chưa được build vào file `.war`**!
* Do đó khi chạy `run_backend.bat`, máy tính vẫn đang chạy file `.war` cũ của hôm qua.
* 👉 **Cần chạy lệnh sau trong thư mục `backend` để cập nhật file `.war` mới nhất:**
  ```bash
  mvn clean package -DskipTests
  ```
  Sau đó nhấp đúp chạy lại `run_backend.bat` thì toàn bộ các API mới của TV4 sẽ có hiệu lực ngay lập tức.
