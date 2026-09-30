# Sequence Diagrams

## 1. Search / Filter Vehicle Listings

Actor:
Guest

Lifelines:
- Guest
- React VehicleListPage
- vehicleApi
- ListingController
- ListingService
- ListingSpecification
- ListingRepository
- PostgreSQL

```mermaid
## 1. Search / Filter Vehicle Listings

Actor:
Guest

Lifelines:
- Guest
- React VehicleListPage
- vehicleApi
- ListingController
- ListingService
- ListingSpecification
- ListingRepository
- PostgreSQL

```mermaid
@startuml
skinparam style strictuml

actor "Khách (Guest)" as Guest
boundary "Giao diện Danh sách xe\n(VehicleListPage)" as UI
control "Bộ điều khiển Danh sách\n(ListingController)" as C
entity "Tiêu chí & Dịch vụ\n(ListingService)" as S
entity "Kho chứa Danh sách\n(ListingRepository)" as R
database "Cơ sở dữ liệu\n(Database)" as DB

Guest -> UI: 1 1. Nhập từ khóa và bấm "Tìm kiếm"
activate UI
UI -> C: 2 2. getListings(params)
activate C
C -> S: 3 3. Truy vấn danh sách xe theo bộ lọc
activate S
S -> R: 4 4. findAll(specification, pageable)
activate R
R -> DB: 5 5. Truy vấn cơ sở dữ liệu
activate DB
DB --> R: 6 6. Trả về dữ liệu kết quả
deactivate DB
R --> S: 7 7. Trả về danh sách đối tượng Listing
deactivate R
S -> S: 8 8. Chuyển đổi dữ liệu sang DTO
S --> C: 9 9. Trả về PageResponse<ListingResponseDto>
deactivate S
C --> UI: 10 10. Trả về kết quả JSON (200 OK)
deactivate C
UI --> Guest: 11 11. Hiển thị danh sách xe
deactivate UI

@startuml

## 2. View Listing Detail

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
    R -> DB: 5 5. Truy vấn dữ liệu xe (SELECT)
    activate DB
    DB --> R: 6 6. Trả về dữ liệu Listing
    deactivate DB
    R --> S: 7 7. Trả về đối tượng Listing
    deactivate R
    S -> S: 8 8. ListingResponseDto.fromEntity()
    S --> C: 9 9. Trả về ListingResponseDto
    deactivate S
    C --> UI: 10 10. Phản hồi 200 OK (Mảng JSON)
    deactivate C
    UI --> Guest: 11 11. Hiển thị thông tin chi tiết xe
    deactivate UI

    @enduml


## 3. Admin CRUD Vehicle

Trạng thái: API CRUD đã tồn tại trong Backend; authorization ADMIN chưa được xác minh trong snapshot hiện tại.

Exact security lifeline phải được cập nhật sau khi TV4 bàn giao.

Admin
  ↓
React Admin UI
  ↓
VehicleController
  ↓
VehicleService
  ↓
VehicleRepository
  ↓
PostgreSQL

```mermaid
    
    @startuml
    skinparam style strictuml

    actor "Quản trị viên\n(Admin)" as Admin
    boundary "Giao diện Quản trị\n(React Admin UI)" as UI
    control "Bộ điều khiển Xe\n(VehicleController)" as C
    entity "Dịch vụ Xe\n(VehicleService)" as S
    entity "Kho chứa Xe\n(VehicleRepository)" as R
    database "Cơ sở dữ liệu\n(PostgreSQL)" as DB

    Admin -> UI: 1 1. Thao tác CRUD tin xe
    activate UI
    UI -> C: 2 2. Gửi yêu cầu HTTP Request
    activate C
    C -> S: 3 3. Xử lý nghiệp vụ xe
    activate S
    S -> R: 4 4. Gọi phương thức Repository
    activate R
    R -> DB: 5 5. Thao tác dữ liệu (INSERT/UPDATE/DELETE)
    activate DB
    DB --> R: 6 6. Kết quả truy vấn
    deactivate DB
    R --> S: 7 7. Trả về đối tượng Entity/Status
    deactivate R
    S --> C: 8 8. Trả về DTO/Response
    deactivate S
    C --> UI: 9 9. Phản hồi HTTP Status Code
    deactivate C
    UI --> Admin: 10 10. Hiển thị thông báo kết quả
    deactivate UI

    @enduml

## 4. Login

Status: PENDING.

Không tự ghi tên AuthController/AuthService/JWTFilter khi chưa nhận code TV4.

Cần cập nhật sau khi TV4 bàn giao:

endpoint;
request/response;
token/session;
security filter;
error 401/403;
current-user contract.

## 5. Deposit + Appointment

Status: PENDING.

Contract nghiệp vụ:

CUSTOMER
   ↓
Select AVAILABLE Vehicle
   ↓
Create Deposit PENDING_PAYMENT
   ↓
Create Appointment SCHEDULED
   ↓
Mock QR / Reference
   ↓
Confirm Payment
   ↓
Deposit DEPOSITED
   +
Vehicle HOLD/RESERVED

Chi tiết lifeline và tên class phải lấy trực tiếp từ TV1 implementation.