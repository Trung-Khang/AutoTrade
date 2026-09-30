# BÁO CÁO TIẾN ĐỘ THÀNH VIÊN 01 (TV1 — BACKEND LEAD)
## INCREMENT 1
### 1. Việc đã hoàn thành

1. **Khởi tạo và cấu hình nền móng Spring Boot (Java 17):**
   - Đã cấu hình file `pom.xml` với 5 thư viện cốt lõi: Spring Web, Spring Data JPA, PostgreSQL Driver, Springdoc OpenAPI (Swagger UI 2.5.0), Spring Boot Test.
   - Cấu hình Maven Wrapper (`mvnw.cmd`, `maven-wrapper.properties`).
2. **Cấu hình hệ thống & Kết nối cơ sở dữ liệu (`application.properties`):**
   - Cổng chạy Backend: `8080`.
   - Kết nối PostgreSQL linh hoạt thông qua biến môi trường.
   - Bật cơ chế tự động đồng bộ bảng (`spring.jpa.hibernate.ddl-auto=update`) và log SQL (`show-sql=true`).
   - Cấu hình Swagger UI path: `/swagger-ui.html`.
3. **Xây dựng Entry Point & Cấu hình bảo mật giao tiếp:**
   - Tạo class chạy chính `BackendApplication.java`.
   - Tạo `CorsConfig.java` cho phép ReactJS (cổng 5173/3000) gọi API vào Backend cổng 8080.
   - Tạo `OpenApiConfig.java` cấu hình tiêu đề và metadata cho trang tài liệu Swagger UI.
4. **Mô hình Dữ liệu (JPA Entities):**
   - `Vehicle.java`: Bảng `vehicles` (brand, model, variant, manufacture_year, body_type, fuel_type, transmission, created_at).
   - `Listing.java`: Bảng `listings` (vehicle_id @ManyToOne, price, mileage, location, source_id, source_url, image_url, listed_at, crawled_at, created_at).
5. **Tầng thao tác CSDL (JPA Repositories):**
   - `VehicleRepository.java`: Kế thừa `JpaRepository<Vehicle, Long>`, hỗ trợ tìm kiếm xe theo Hãng và Model.
   - `ListingRepository.java`: Kế thừa `JpaRepository<Listing, Long>`, hỗ trợ tìm tin đăng theo địa điểm và vehicle_id.
6. **Tầng Nghiệp vụ (Business Services):**
   - `VehicleService.java`: Toàn bộ logic nghiệp vụ CRUD cho dòng xe (getAll, getById, create, update, delete, getByBrand).
   - `ListingService.java`: Logic nghiệp vụ quản lý tin đăng bán xe (getAll, getById, create, delete, getByVehicleId).
7. **Tầng Điều khiển REST API (Controllers):**
   - `VehicleController.java`: Cung cấp đầy đủ REST endpoints cho Xe (`GET /api/v1/vehicles`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}`) kèm tài liệu Swagger.
   - `ListingController.java`: Cung cấp REST endpoints cho Tin đăng (`GET /api/v1/listings`, `GET /{id}`, `POST`, `DELETE /{id}`).
8. **Xử lý Ngoại lệ tập trung (Global Exception Handling):**
   - `ResourceNotFoundException.java`: Exception báo lỗi không tìm thấy dữ liệu.
   - `ErrorResponse.java`: Chuẩn hóa JSON phản hồi lỗi (status, error, message, path, timestamp).
   - `GlobalExceptionHandler.java`: `@RestControllerAdvice` bắt lỗi 404, 400, 500 trả về JSON sạch sẽ cho Frontend.

---

### 2. Cấu trúc mã nguồn

```text
backend/
├── pom.xml                                               # Quản lý thư viện Maven
├── mvnw.cmd                                              # Script chạy Maven trên Windows
├── .mvn/wrapper/maven-wrapper.properties                 # Cấu hình tải Maven 3.9.6
└── src/
    └── main/
        ├── resources/
        │   └── application.properties                    # Cấu hình Port 8080, PostgreSQL, JPA, Swagger
        └── java/com/system/
            ├── BackendApplication.java                   # Class khởi chạy chính
            ├── config/
            │   ├── CorsConfig.java                       # Cấu hình CORS cho ReactJS
            │   └── OpenApiConfig.java                    # Cấu hình tài liệu Swagger UI
            ├── controller/
            │   ├── VehicleController.java                # REST API quản lý Xe (/api/v1/vehicles)
            │   └── ListingController.java                # REST API quản lý Tin đăng (/api/v1/listings)
            ├── entity/
            │   ├── Vehicle.java                          # Entity bảng vehicles
            │   └── Listing.java                          # Entity bảng listings (@ManyToOne với Vehicle)
            ├── exception/
            │   ├── ErrorResponse.java                    # DTO trả về lỗi chuẩn
            │   ├── ResourceNotFoundException.java        # Exception khi không tìm thấy xe/tin đăng
            │   └── GlobalExceptionHandler.java           # Bộ xử lý lỗi tập trung @RestControllerAdvice
            ├── repository/
            │   ├── VehicleRepository.java                # JPA Repository cho Vehicle
            │   └── ListingRepository.java                # JPA Repository cho Listing
            └── service/
                ├── VehicleService.java                   # Business Logic cho Vehicle
                └── ListingService.java                   # Business Logic cho Listing
```

---

### 3. Các file trên được tạo ra để làm gì?

- Cung cấp một **hệ thống Backend chạy được hoàn chỉnh (Runnable Skeleton)** cho đồ án.
- Cung cấp đầy đủ các cổng giao tiếp REST API chuẩn JSON và tài liệu Swagger UI trực quan.
- Tự động đồng bộ và tạo cấu trúc 2 bảng cốt lõi `vehicles` và `listings` trong PostgreSQL.
- Xử lý lỗi tập trung, không làm sập server hay trả về lỗi thô (stack trace) cho Client.

---

### 4. Bàn giao cho ai?

- **TV2 (Frontend):** 
  - Đã có đầy đủ URL endpoints (`/api/v1/vehicles`, `/api/v1/listings`) để gọi lấy danh sách và thêm mới xe.
  - Đã có Swagger UI tại `http://localhost:8080/swagger-ui.html` để TV2 xem chi tiết cấu trúc Request/Response JSON và test thử.
  - Đã mở CORS cho Frontend kết nối.
- **TV5 (Database & Testing):**
  - Đã sẵn sàng các API để TV5 bắt đầu viết và thực hiện các Test Cases kiểm thử CRUD cho Increment 1.
  - Schema JPA trong code khớp 100% với bản vẽ ERD của TV5.

---

### 5. Cách thức và thao tác Run / Debug / Test thử

1. **Chuẩn bị Database trong PostgreSQL:**
   - Mở pgAdmin hoặc SQL Shell (psql), chạy lệnh tạo database:
     ```sql
     CREATE DATABASE used_car_db;
     ```
2. **Khởi chạy ứng dụng:**
   - Chạy lệnh sau tại thư mục `backend/`:
     ```bash
     .\mvnw.cmd spring-boot:run
     ```
   - Hoặc mở IDE (IntelliJ IDEA / VS Code) và Run file `BackendApplication.java`.
3. **Kiểm tra kết quả:**
   - Mở trình duyệt vào link: `http://localhost:8080/swagger-ui.html`
   - Bấm vào các API `POST /api/v1/vehicles` để thêm xe mẫu, và `GET /api/v1/vehicles` để xem danh sách trả về.

---

## EMERGENCY MISSiON (16/9/2026)
### 1. Việc đã hoàn thành 
- **Tạo mới Source.java & SourceRepository.java: Map chính xác bảng sources theo Schema v2.0.0.**
- **Cập nhật Vehicle.java: Bổ sung đầy đủ 3 trường Enrich (engineSize, seatCount, origin), đồng bộ kiểu thời gian Instant (TIMESTAMPTZ), các ràng buộc độ dài cột khớp DDL.**
- **Cập nhật Listing.java: Đổi sourceId thành quan hệ @ManyToOne Source source, bổ sung color, listedAtRaw, kiểu Instant, cho phép mileage nullable, bảo toàn imageUrl.**
- **Kích hoạt ddl-auto=validate: Cập nhật cấu hình trong application.properties để chứng minh tính toàn vẹn 100% giữa JPA và PostgreSQL.**

### 2. Cấu trúc mã nguồn 
```text
backend/
├── pom.xml                                               # Quản lý dependencies (Spring Web, JPA, PostgreSQL, Swagger...)
├── mvnw.cmd                                              # Maven Wrapper khởi chạy trên Windows
├── .mvn/wrapper/maven-wrapper.properties                 # Cấu hình tải phiên bản Maven
└── src/
    └── main/
        ├── resources/
        │   └── application.properties                    # Cấu hình: Port 8080, PostgreSQL, ddl-auto=validate, Swagger
        └── java/com/system/
            │
            ├── BackendApplication.java                   # [1] Class khởi chạy chính (@SpringBootApplication)
            │
            ├── config/                                   # [2] TẦNG CẤU HÌNH HỆ THỐNG
            │   ├── CorsConfig.java                       # Cấu hình CORS mở cổng kết nối cho Frontend (React 5173/3000)
            │   └── OpenApiConfig.java                    # Cấu hình tiêu đề, mô tả và metadata cho Swagger UI
            │
            ├── entity/                                   # [3] TẦNG THỰC THỂ CSDL (JPA ENTITIES)
            │   ├── Source.java                           # [NEW] Đại diện bảng sources (Nguồn cào: Chợ Tốt, Bốn Bánh)
            │   ├── Vehicle.java                          # [UPDATED] Đại diện bảng vehicles (+3 trường enrich)
            │   └── Listing.java                          # [UPDATED] Đại diện bảng listings (Liên kết Vehicle & Source)
            │
            ├── repository/                               # [4] TẦNG THAO TÁC CƠ SỞ DỮ LIỆU (SPRING DATA JPA)
            │   ├── SourceRepository.java                 # [NEW] Truy vấn bảng sources (findBySourceName)
            │   ├── VehicleRepository.java                # Truy vấn bảng vehicles (findByBrand, findByModel)
            │   └── ListingRepository.java                # Truy vấn bảng listings (findByVehicleId, findByLocation)
            │
            ├── service/                                  # [5] TẦNG NGHIỆP VỤ (BUSINESS LOGIC LAYER)
            │   ├── VehicleService.java                   # Logic CRUD, kiểm tra tồn tại và xử lý dữ liệu dòng xe
            │   └── ListingService.java                   # Logic CRUD tin đăng, liên kết xe và nguồn bài viết
            │
            ├── controller/                               # [6] TẦNG ĐIỀU KHIỂN REST API (REST CONTROLLERS)
            │   ├── VehicleController.java                # Endpoint /api/v1/vehicles (CRUD dòng xe + Swagger doc)
            │   └── ListingController.java                # Endpoint /api/v1/listings (CRUD tin đăng + Swagger doc)
            │
            └── exception/                                # [7] TẦNG XỬ LÝ NGOẠI LỆ TẬP TRUNG
                ├── ErrorResponse.java                    # DTO chuẩn hóa cấu trúc JSON phản hồi lỗi
                ├── ResourceNotFoundException.java        # Exception báo lỗi khi không tìm thấy ID (HTTP 404)
                └── GlobalExceptionHandler.java           # @RestControllerAdvice bắt lỗi toàn cục (404, 400, 500)
```

### 3. Các file trên được tạo ra để làm gì?
Tạo ra một Backend hoàn chỉnh (Runnable Skeleton), kết nối mượt mà với PostgreSQL của TV5 và cung cấp sẵn API chuẩn cho Frontend của TV2.

### 4. Bàn giao cho ai?
- Quy trình kiểm thử Giai đoạn 4 khi TV3 chạy seed CSDL.
- Kế hoạch xây dựng API Search / Filter động (JPA Specification), phân trang (Pageable), sắp xếp (Sort) và DTO phẳng cho Increment 2.

### 5. Cách thức và thao tác Run / Debug / Test thử
- Chạy lệnh mvn clean compile bằng OpenJDK 21 đạt BUILD SUCCESS (16 files compiled sạch sẽ).

---

## INCREMENT 2 — MARKET DATA API (19/09/2026)

### 1. Việc đã hoàn thành
1. **Kiểm chứng toàn vẹn CSDL với Hibernate `ddl-auto=validate`:**
   - Đã khởi động ngữ cảnh Spring Boot kết nối trực tiếp vào PostgreSQL `used_car_db` (Schema v2.0.1).
   - Hibernate 6.4.4 xác thực thành công 100% các thực thể JPA (`Vehicle`, `Listing`, `Source`) với Schema DB, không có lỗi sai lệch cấu trúc (0 failures, 0 errors).
2. **Xây dựng tầng DTO phẳng phục vụ hiển thị (DTO Layer):**
   - `ListingResponseDto.java`: Gộp phẳng các trường từ `Listing` + `Vehicle` + `Source`.
   - `ListingFilterRequest.java`: Đóng gói các tham số lọc đa tiêu chí (`keyword`, `brand`, `model`, `minPrice`, `maxPrice`, `minYear`, `maxYear`, `minMileage`, `maxMileage`, `fuelType`, `transmission`, `bodyType`, `origin`, `location`, `vehicleId`).
   - `PageResponse.java`: Chuẩn hóa cấu trúc phân trang trả về cho Client (`content`, `page`, `size`, `totalElements`, `totalPages`, `isFirst`, `isLast`).
3. **Triển khai truy vấn động JPA Criteria (Specification Layer):**
   - `ListingRepository.java`: Kế thừa thêm `JpaSpecificationExecutor<Listing>`.
   - `ListingSpecification.java`: Xây dựng query Criteria động với LEFT JOIN sang `Vehicle`, hỗ trợ lọc linh hoạt và an toàn khi các trường dữ liệu tùy chọn là `null`.
4. **Nâng cấp Service & Controller REST API:**
   - `ListingService.java`: Bổ sung `searchListings(ListingFilterRequest, Pageable)` và `getListingDtoById(Long)`.
   - `ListingController.java`: Cập nhật endpoint `GET /api/v1/listings` nhận `@ParameterObject` filter và `@PageableDefault(size=20, sort="id", direction=DESC)`.

### 2. Cấu trúc mã nguồn bổ sung
```text
backend/
└── src/main/java/com/system/
    ├── dto/
    │   ├── ListingFilterRequest.java       # DTO nhận tiêu chí tìm kiếm & lọc
    │   ├── ListingResponseDto.java        # DTO phẳng trả về cho Frontend
    │   └── PageResponse.java              # DTO bọc dữ liệu phân trang
    ├── specification/
    │   └── ListingSpecification.java      # JPA Criteria Specification động
    ├── repository/│   │   └── ListingRepository.java         # [+JpaSpecificationExecutor]
    ├── service/
    │   └── ListingService.java            # [+searchListings, +getListingDtoById]
    └── controller/
        └── ListingController.java         # [Cập nhật GET /api/v1/listings phân trang & lọc]
```

### 3. Bàn giao cho ai
- **TV2 (Frontend Developer):**
  - Endpoint chính thức: `GET /api/v1/listings`
  - Các tham số query: `brand`, `model`, `minPrice`, `maxPrice`, `minYear`, `maxYear`, `minMileage`, `maxMileage`, `fuelType`, `transmission`, `bodyType`, `location`, `keyword`, `page`, `size`, `sort`.
  - Định dạng JSON trả về dạng phẳng, đã có sẵn cả `manufacture_year`, `image_url` khớp 100% với component `VehicleCard` và `VehicleInfo`.

### 4. Test thử
```powwershell
cd backend
.\mvnw.cmd spring-boot:run
```
**Chạy thành công, sau đó vào mở đường dẫn sau:**
http://localhost:8080/swagger-ui.html

---

# GIAI ĐOẠN ĐỀ TÀI MỚI: QUẢN LÝ KINH DOANH Ô TÔ ĐÃ QUA SỬ DỤNG
## BÁO CÁO TIẾN ĐỘ NGÀY 1 & NGÀY 2 (30/09 - 01/10/2026)
**Người thực hiện:** TV1 (Backend Core & Integration Lead)

### 1. Nhiệm vụ đã hoàn thành xuất sắc

1. **Khóa và ban hành API Contract v3.0 chính thức:**
   - Ban hành tài liệu: `docs/API/API_Specification_Official_v3.md`.
   - Chuẩn hóa toàn bộ mã lỗi HTTP: `200`, `201`, `400`, `401`, `403`, `404`, `422` và đặc biệt là mã **`409 Conflict`** khi cọc trùng xe độc bản.
   - Chuẩn hóa ma trận vòng đời trạng thái (*State Transitions*):
     - Xe: `AVAILABLE` $\rightarrow$ `HOLD` $\rightarrow$ `RESERVED` $\rightarrow$ `SOLD`.
     - Cọc: `PENDING` $\rightarrow$ `DEPOSITED` $\rightarrow$ `CANCELLED` / `REFUNDED`.
     - Lịch hẹn: `PENDING` $\rightarrow$ `COMPLETED`.

2. **Nâng cấp và Xây dựng Domain Model (JPA Entities & Repositories):**
   - `Vehicle.java`: Bổ sung số VIN độc bản duy nhất (UNIQUE), trạng thái `status`, showroom, giá, ODO, màu sắc, hình ảnh.
   - `Showroom.java` & `ShowroomRepository.java`: Quản lý các cơ sở showroom trưng bày xe.
   - `Deposit.java` & `DepositRepository.java`: Đơn đặt cọc giả lập, mã đơn, số tiền cọc, link ảnh QR giả lập VietQR, mã biên lai và số hợp đồng.
   - `Appointment.java` & `AppointmentRepository.java`: Lịch hẹn xem xe kèm trường boolean `hasTestDrive` (**Quyết định D4: Lái thử là checkbox**).
   - `TransactionLedger.java` & `TransactionLedgerRepository.java`: Sổ cái ghi chép dòng tiền cọc cho Quản trị viên (FR-14).

3. **Hiện thực hóa "Trái tim nghiệp vụ" – Atomic Lock chống đặt cọc trùng xe:**
   - Trong `VehicleRepository.java`: Cài đặt phương thức cập nhật nguyên tử:
     `UPDATE vehicles v SET v.status = :newStatus WHERE v.id = :id AND v.status = 'AVAILABLE'`
   - Trong `DepositService.java`: 
     - Tự động sinh mã VietQR giả lập chứa số tiền 10 triệu và mã cọc.
     - Xác nhận thanh toán `confirmPayment`: Nếu xe đã bị cọc trước trong cùng mili-giây, câu lệnh trả về 0 dòng $\rightarrow$ Lập tức ném `VehicleAlreadyReservedException` $\rightarrow$ `GlobalExceptionHandler` trả về HTTP `409 Conflict`.
     - Nếu thành công: Khóa xe sang `HOLD`, đổi cọc sang `DEPOSITED`, sinh biên lai điện tử `REC-...` và hợp đồng `HD-COC-...`, tự động ghi sổ cái `TransactionLedger`.

4. **Xây dựng hệ thống REST API Endpoints đầy đủ:**
   - `VehicleController.java`: API xem, tìm kiếm, lọc xe cho khách hàng.
   - `AdminVehicleController.java`: API CRUD xe và đổi trạng thái cho Admin.
   - `DepositController.java`: API cọc xe, xác nhận cọc giả lập, xem biên lai hợp đồng số, danh sách cọc cá nhân (`My Deposits`).
   - `StaffAppointmentController.java`: API tra cứu lịch hẹn theo showroom và Check-in đón tiếp/lái thử cho Nhân viên.
   - `AdminLedgerController.java`: API xem tổng quan sổ cái tiền cọc và duyệt hoàn cọc cho Admin.

5. **Bộ kiểm thử tự động (Unit Test Suite):**
   - Viết test suite `DepositServiceUnitTest.java` kiểm thử toàn diện:
     - Test tạo cọc thành công kèm lái thử.
     - Test chặn cọc xe khi không `AVAILABLE`.
     - Test thanh toán cọc thành công và sinh hợp đồng số.
     - **Test Chống cọc trùng (Race Condition)**: Giả lập 2 luồng cùng cọc 1 xe, chứng minh hệ thống ném ngoại lệ 409 Conflict và hủy đơn cọc trùng.
     - Test Staff check-in và Admin hoàn cọc.
   - **Kết quả kiểm thử:** `Tests run: 6, Failures: 0, Errors: 0, Skipped: 0` $\rightarrow$ **BUILD SUCCESS 100%**.

6. **Kịch bản kiểm thử luồng vàng Gate 2:**
   - Soạn thảo tài liệu `docs/Testing/Integration_Test_Scenario_Gate_2.md` hướng dẫn cả nhóm chạy End-to-End luồng vàng.

### 2. Bàn giao cho các thành viên
- **Cho TV2 (Frontend):** Bàn giao API Contract v3.0 và toàn bộ Controller endpoints.
- **Cho TV3 (Database):** Bàn giao file script migration `V3_0_0__showroom_deposit_appointment.sql`.
- **Cho TV4 (Auth):** Bàn giao danh sách URL cần bảo vệ role (`/admin/**`, `/staff/**`, `/deposits/**`).
- **Cho TV5 (UML):** Bàn giao tên class, entity, method và state transition để vẽ Sequence/Class Diagram.