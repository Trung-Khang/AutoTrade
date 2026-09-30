# Use Case Diagram & Specification

**Project:** Xây dựng hệ thống quản lý kinh doanh ô tô đã qua sử dụng
**Owner:** TV5
**Scope:** Final submission scope — Spring Boot + React + PostgreSQL

## 1. Actors

### 1.1. Khách vãng lai

Khách chưa đăng nhập.

Quyền chính:

* Xem showroom/danh sách xe.
* Tìm kiếm xe.
* Lọc xe.
* Xem chi tiết xe.
* Liên hệ nhanh khi chức năng này được hoàn thiện.

### 1.2. CUSTOMER

Khách hàng đã đăng nhập.

Quyền chính:

* Đăng nhập/đăng xuất.
* Đặt cọc giả lập.
* Tạo lịch hẹn xem xe.
* Xem đơn cọc của mình.
* Các chức năng P1 như đăng ký, quên mật khẩu, yêu thích nếu đã hoàn thành.

### 1.3. STAFF

Nhân viên showroom.

Quyền chính:

* Xem danh sách lịch hẹn.
* Cập nhật trạng thái lịch hẹn.
* Xử lý các thao tác nghiệp vụ được Backend cho phép.

### 1.4. ADMIN

Quản trị viên.

Quyền chính:

* CRUD xe.
* Quản lý tài khoản ở mức được triển khai.
* Xem/quản lý ledger cọc ở mức được triển khai.
* Thực hiện các thao tác quản trị được Backend cho phép.

### 1.5. System / External Service

Thành phần hỗ trợ hệ thống:

* Mail Service hoặc OTP demo có hạn dùng.
* Mock QR/reference service cho giao dịch đặt cọc.

Không xem Mock QR là cổng thanh toán tiền thật.

---

## 2. Scope hiện tại

### P0 — Bắt buộc

* Đăng nhập và phân quyền.
* Xem showroom/danh sách xe.
* Tìm kiếm và lọc xe.
* Xem chi tiết xe.
* Admin CRUD xe.
* Đặt cọc giả lập.
* Tạo lịch hẹn.
* Khóa xe sau khi cọc thành công.
* Chống đặt cọc trùng.
* Test và UML cho luồng chính.

### P1 — Sau khi P0 ổn định

* Đăng ký.
* Quên mật khẩu/OTP.
* Yêu thích.
* Quản lý đơn cọc cá nhân.
* Staff cập nhật lịch hẹn.
* Admin ledger/tài khoản/thống kê cơ bản.

### P2

* QR giao diện đẹp.
* Tải biên lai/hợp đồng.
* Liên hệ Zalo/Messenger.
* Gallery nhiều ảnh.
* Chart nâng cao.

### Loại bỏ khỏi phạm vi nộp

* Machine Learning.
* Regression.
* R Plumber.
* Automated Valuation.
* Recommendation.
* Comparison.
* Thanh toán thật.
* Giỏ hàng.
* Workflow lái thử độc lập.

Lái thử chỉ là một checkbox thuộc lịch hẹn.

---

## 3. Use Case chính

| ID    | Use Case                  | Actor                | Priority |
| ----- | ------------------------- | -------------------- | -------- |
| UC-01 | Xem danh sách/showroom xe | Guest                | P0       |
| UC-02 | Tìm kiếm & lọc xe         | Guest                | P0       |
| UC-03 | Xem chi tiết xe           | Guest                | P0       |
| UC-04 | Đăng nhập                 | CUSTOMER/STAFF/ADMIN | P0       |
| UC-05 | Quản lý xe                | ADMIN                | P0       |
| UC-06 | Đặt cọc & tạo lịch hẹn    | CUSTOMER             | P0       |
| UC-07 | Xác nhận đặt cọc giả lập  | CUSTOMER/System      | P0       |
| UC-08 | Quản lý lịch hẹn          | STAFF                | P0       |
| UC-09 | Đăng ký tài khoản         | Guest                | P1       |
| UC-10 | Quên mật khẩu/OTP         | Guest/CUSTOMER       | P1       |
| UC-11 | Quản lý yêu thích         | CUSTOMER             | P1       |
| UC-12 | Xem đơn cọc của tôi       | CUSTOMER             | P1       |
| UC-13 | Quản lý tài khoản         | ADMIN                | P1       |
| UC-14 | Quản lý ledger cọc        | ADMIN                | P1       |
| UC-15 | Thống kê cơ bản           | ADMIN                | P1       |

---

## 4. Quan hệ Use Case

```text
UC-06 Đặt cọc & tạo lịch hẹn
        │
        ├── include → Tạo Deposit PENDING_PAYMENT
        │
        └── include → Tạo Appointment SCHEDULED

UC-07 Xác nhận đặt cọc giả lập
        │
        ├── Deposit → DEPOSITED
        └── Vehicle → HOLD/RESERVED

UC-04 Đăng nhập
        │
        └── kiểm tra Authentication + Role

UC-09 Đăng ký
        │
        └── include → OTP

UC-10 Quên mật khẩu
        │
        └── include → OTP
```

Lưu ý: lái thử không tạo Use Case riêng.

---

## 5. Trạng thái nghiệp vụ

### Vehicle

```text
AVAILABLE
   ↓
HOLD / RESERVED
   ↓
AVAILABLE hoặc SOLD
```

### Deposit

```text
PENDING_PAYMENT
       ↓
   DEPOSITED
       ↓
REFUNDED hoặc RELEASED
```

### Appointment

```text
SCHEDULED
   ↓
COMPLETED hoặc CANCELLED
```

---

## 6. Quy tắc nghiệp vụ quan trọng

1. Chỉ xe `AVAILABLE` mới được tạo đặt cọc.
2. Không cho phép hai giao dịch giữ cùng một xe cùng thời điểm.
3. Xác nhận cọc và chuyển trạng thái xe phải nằm trong transaction.
4. Lịch hẹn không được ở quá khứ.
5. CUSTOMER không được gọi API STAFF/ADMIN.
6. Callback/reference hoặc submit lặp không được tạo thêm giao dịch.
7. Lái thử chỉ là thuộc tính tùy chọn của Appointment.

---

## 7. Use Case specification — UC-01

**Tên:** Xem danh sách/showroom xe

**Actor:** Khách vãng lai

**Precondition:** Hệ thống có dữ liệu xe/tin đăng.

**Main flow:**

1. Khách mở trang showroom.
2. Frontend gọi API danh sách tin đăng.
3. Backend nhận request.
4. Backend truy vấn PostgreSQL.
5. Backend áp dụng paging/filter/sort nếu có.
6. Backend trả JSON.
7. Frontend hiển thị danh sách xe.

**Alternative flow:**

* Không có dữ liệu → hiển thị trạng thái empty.
* Backend lỗi → hiển thị lỗi.
* Request filter không hợp lệ → trả lỗi theo API contract.

**Postcondition:** Danh sách xe được hiển thị hoặc thông báo lỗi phù hợp.

---

## 8. Use Case specification — UC-02

**Tên:** Tìm kiếm & lọc xe

**Actor:** Khách vãng lai

**Precondition:** Trang danh sách xe đang hoạt động.

**Main flow:**

1. Người dùng nhập keyword hoặc chọn bộ lọc.
2. Frontend gửi query parameters tới Backend.
3. Backend xây dựng truy vấn động.
4. Backend truy vấn listings và vehicle.
5. Backend trả dữ liệu phân trang.
6. Frontend cập nhật danh sách.

**Bộ lọc hiện có trong code:**

```text
keyword
vehicleId
brand
model
variant
minPrice
maxPrice
minYear
maxYear
minMileage
maxMileage
fuelType
transmission
bodyType
origin
location
page
size
sort
```

**Postcondition:** Danh sách phản ánh điều kiện tìm kiếm/lọc.

---

## 9. Use Case specification — UC-03

**Tên:** Xem chi tiết xe/tin đăng

**Actor:** Khách vãng lai

**Main flow:**

1. Người dùng chọn một tin đăng.
2. Frontend gọi `GET /api/v1/listings/{id}`.
3. Backend tìm listing.
4. Backend load Vehicle và Source.
5. Backend chuyển sang `ListingResponseDto`.
6. Backend trả dữ liệu cho Frontend.
7. Frontend hiển thị chi tiết.

**Alternative flow:**

* ID không tồn tại → `404 Not Found`.

---

## 10. Use Case specification — UC-05

**Tên:** Quản lý xe

**Actor:** ADMIN

**Các thao tác:**

```text
Create
Read
Update
Delete
```

**API hiện có trong code:**

```text
GET    /api/v1/vehicles
GET    /api/v1/vehicles/{id}
POST   /api/v1/vehicles
PUT    /api/v1/vehicles/{id}
DELETE /api/v1/vehicles/{id}
```

**Trạng thái tài liệu:**

API CRUD đã có trong Backend code.

Authorization ADMIN chưa được xác nhận trong snapshot hiện tại; phải cập nhật sau khi TV4 tích hợp Security.

---

## 11. Use Case specification — UC-06

**Tên:** Đặt cọc & tạo lịch hẹn

**Actor:** CUSTOMER

**Trạng thái:** PENDING implementation.

Luồng nghiệp vụ phải tuân thủ:

```text
Select AVAILABLE vehicle
        ↓
Select showroom/date/time
        ↓
Optional test-drive checkbox
        ↓
Create Deposit = PENDING_PAYMENT
        ↓
Create Appointment = SCHEDULED
        ↓
Mock QR/reference
```

Tên Controller/Service/Repository cụ thể chỉ được cập nhật sau khi nhận code thực tế từ TV1.

---

## 12. Use Case specification — UC-07

**Tên:** Xác nhận đặt cọc giả lập

**Actor:** CUSTOMER + System

**Expected flow:**

```text
Mock payment confirmation
        ↓
Validate reference/idempotency
        ↓
Deposit = DEPOSITED
        ↓
Vehicle = HOLD / RESERVED
```

Hai thay đổi trạng thái phải được bảo đảm trong cùng transaction.

---

## 13. Use Case specification — UC-08

**Tên:** Quản lý lịch hẹn showroom

**Actor:** STAFF

**Trạng thái:** PENDING implementation.

STAFF được phép:

* xem lịch hẹn;
* cập nhật trạng thái được Backend cho phép.

Lifeline/class cụ thể phải lấy từ code TV1 sau integration.

---

## 14. Current implementation boundary

Các Use Case đã có bằng chứng code hiện tại:

```text
UC-01
UC-02
UC-03
UC-05 API layer
```

Các Use Case cần chờ implementation/contract:

```text
UC-04
UC-06
UC-07
UC-08
UC-09
UC-10
UC-11
UC-12
UC-13
UC-14
UC-15
```

Không được ghi `Implemented` cho các UC chưa có code/evidence.

## UC diagram

*** Sơ đồ Use Case tổng thể (Use Case Diagram)

```mermaid

@startuml
left to right direction
skinparam packageStyle rectangle
skinparam shadowing false
skinparam actorStyle stickman

actor "Khách vãng lai\n(Guest)" as Guest
actor "Khách hàng\n(CUSTOMER)" as Customer
actor "Nhân viên\n(STAFF)" as Staff
actor "Quản trị viên\n(ADMIN)" as Admin
actor "Hệ thống / External Service" as System << System >>

' Kế thừa Actor
Guest <|-- Customer
Customer <|-- Staff
Staff <|-- Admin

rectangle "Hệ thống Quản lý Kinh doanh Ô tô đã qua sử dụng" {

    ' P0 - SCOPE BẮT BUỘC
    package "Phạm vi P0 - Bắt buộc" #FFFFFF {
        usecase "UC-01: Xem danh sách/showroom xe" as UC01
        usecase "UC-02: Tìm kiếm & lọc xe" as UC02
        usecase "UC-03: Xem chi tiết xe" as UC03
        usecase "UC-04: Đăng nhập" as UC04
        usecase "UC-05: Quản lý xe (CRUD)" as UC05
        usecase "UC-06: Đặt cọc & tạo lịch hẹn" as UC06
        usecase "UC-07: Xác nhận đặt cọc giả lập" as UC07
        usecase "UC-08: Quản lý lịch hẹn" as UC08

        usecase "Tạo Deposit (PENDING_PAYMENT)" as Sub_Deposit
        usecase "Tạo Appointment (SCHEDULED)" as Sub_Appt
        usecase "Cập nhật Deposit -> DEPOSITED" as Sub_Dep_Confirm
        usecase "Cập nhật Vehicle -> HOLD/RESERVED" as Sub_Veh_Hold
        usecase "Kiểm tra Auth & Role" as Sub_Auth
    }

    ' P1 - PHẤN ĐẤU
    package "Phạm vi P1 - Sau P0" #F5F5F5 {
        usecase "UC-09: Đăng ký tài khoản" as UC09
        usecase "UC-10: Quên mật khẩu / OTP" as UC10
        usecase "UC-11: Quản lý yêu thích" as UC11
        usecase "UC-12: Xem đơn cọc của tôi" as UC12
        usecase "UC-13: Quản lý tài khoản" as UC13
        usecase "UC-14: Quản lý ledger cọc" as UC14
        usecase "UC-15: Thống kê cơ bản" as UC15

        usecase "Xác thực OTP" as Sub_OTP
    }

    ' P2 - MỞ RỘNG
    package "Phạm vi P2 - Nâng cao" #FAFAFA {
        usecase "Tạo Mock QR / Reference" as UC_QR
        usecase "Tải biên lai / Hợp đồng" as UC_Receipt
        usecase "Liên hệ nhanh (Zalo/Messenger)" as UC_Contact
    }
}

' Liên kết Actors & Use Cases
Guest --> UC01
Guest --> UC02
Guest --> UC03
Guest --> UC09
Guest --> UC10
Guest --> UC_Contact

Customer --> UC04
Customer --> UC06
Customer --> UC07
Customer --> UC11
Customer --> UC12

Staff --> UC08

Admin --> UC05
Admin --> UC13
Admin --> UC14
Admin --> UC15

System --> UC07
System --> UC_QR
System --> Sub_OTP

' Relationships (include)
UC06 .> Sub_Deposit : <<include>>
UC06 .> Sub_Appt : <<include>>
UC07 .> Sub_Dep_Confirm : <<include>>
UC07 .> Sub_Veh_Hold : <<include>>
UC04 .> Sub_Auth : <<include>>
UC09 .> Sub_OTP : <<include>>
UC10 .> Sub_OTP : <<include>>

@enduml

*** UC-01 & UC-02: Tìm kiếm / Lọc danh sách xe

```mermaid

@startuml
skinparam style strictuml

actor "Khách\n(Guest)" as Guest
boundary "Giao diện Danh sách xe\n(VehicleListPage)" as UI
control "Bộ điều khiển Danh sách\n(ListingController)" as C
entity "Dịch vụ Danh sách\n(ListingService)" as S
entity "Tiêu chí tìm kiếm\n(ListingSpecification)" as SP
entity "Kho chứa Danh sách\n(ListingRepository)" as R
database "Cơ sở dữ liệu\n(PostgreSQL)" as DB

Guest -> UI: 1 1. Nhập từ khóa / bộ lọc và tìm kiếm
activate UI

UI -> C: 2 2. getListings(params) [GET /api/v1/listings]
activate C

C -> S: 3 3. searchListings(filter, pageable)
activate S

S -> SP: 4 4. filterBy(filter)
activate SP
SP --> S: 5 5. Specification<Listing>
deactivate SP

S -> R: 6 6. findAll(spec, pageable)
activate R

R -> DB: 7 7. Truy vấn SQL
activate DB
DB --> R: 8 8. Trả về Page<Listing>
deactivate DB

R --> S: 9 9. Trả về Page<Listing>
deactivate R

S -> S: 10 10. Map sang ListingResponseDto

S --> C: 11 11. Trả về PageResponse<ListingResponseDto>
deactivate S

C --> UI: 12 12. Phản hồi 200 OK (JSON)
deactivate C

UI --> Guest: 13 13. Hiển thị danh sách xe
deactivate UI

@enduml

*** UC-03: Xem chi tiết xe

```mermaid

@startuml
skinparam style strictuml

actor "Khách\n(Guest)" as Guest
boundary "Giao diện Chi tiết xe\n(VehicleDetailPage)" as UI
control "Bộ điều khiển Danh sách\n(ListingController)" as C
entity "Dịch vụ Danh sách\n(ListingService)" as S
entity "Kho chứa Danh sách\n(ListingRepository)" as R
database "Cơ sở dữ liệu\n(PostgreSQL)" as DB

Guest -> UI: 1 1. Chọn xem tin đăng
activate UI

UI -> C: 2 2. getListingById(id) [GET /api/v1/listings/{id}]
activate C

C -> S: 3 3. getListingDtoById(id)
activate S

S -> R: 4 4. findById(id)
activate R

R -> DB: 5 5. Truy vấn SELECT
activate DB
DB --> R: 6 6. Trả về dữ liệu Listing
deactivate DB

R --> S: 7 7. Trả về đối tượng Listing
deactivate R

S -> S: 8 8. ListingResponseDto.fromEntity()

S --> C: 9 9. Trả về ListingResponseDto
deactivate S

C --> UI: 10 10. Phản hồi 200 OK (JSON)
deactivate C

UI --> Guest: 11 11. Hiển thị thông tin chi tiết xe
deactivate UI

@enduml