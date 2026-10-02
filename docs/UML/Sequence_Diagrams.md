# Sequence Diagrams — TV5

Ngày đồng bộ: 01/10/2026

Quy ước ký hiệu theo mẫu:

- `actor`: người dùng.
- `boundary`: UI React/page.
- `control`: Controller/Service xử lý nghiệp vụ.
- `collections`: Repository.
- `database`: PostgreSQL.
- `alt`: nhánh nghiệp vụ/exception.

## 1. Đặt cọc + lịch hẹn + xác nhận cọc

```plantuml
@startuml
actor "CUSTOMER" as A
boundary "VehicleDetailPage / DepositPage\n(React UI)" as UI
control "DepositController" as C
control "DepositService" as S
collections "VehicleRepository" as VR
collections "ShowroomRepository" as SR
collections "DepositRepository" as DR
collections "AppointmentRepository" as AR
collections "TransactionLedgerRepository" as LR
database "PostgreSQL" as DB

A -> UI : Chọn Đặt cọc giữ xe
UI -> C : POST /api/v1/deposits
C -> S : createDeposit(request, userId)
S -> VR : findById(vehicleId)
VR -> DB : SELECT vehicle
DB --> VR : Vehicle
VR --> S : Vehicle
S -> SR : findById(showroomId)
SR -> DB : SELECT showroom
DB --> SR : Showroom
SR --> S : Showroom
S -> DR : save(PENDING)
DR -> DB : INSERT deposit
DB --> DR : Deposit
S -> AR : save(PENDING)
AR -> DB : INSERT appointment
DB --> AR : Appointment
S --> C : DepositResponse
C --> UI : 201 + QR/reference
UI --> A : Hiển thị QR + lịch hẹn

A -> UI : Xác nhận thanh toán giả lập
UI -> C : POST /api/v1/deposits/{id}/confirm
C -> S : confirmPayment(id)
S -> DR : findById(id)
DR -> DB : SELECT deposit
DB --> DR : Deposit
DR --> S : Deposit
S -> VR : updateVehicleStatusIfAvailable(vehicleId,HOLD)
VR -> DB : UPDATE WHERE status=AVAILABLE
DB --> VR : rowsUpdated

alt rowsUpdated = 1
  S -> DR : save(DEPOSITED)
  S -> LR : save(DEPOSIT_RECEIVED)
  LR -> DB : INSERT ledger
  DB --> LR : Ledger
  S --> C : ReceiptResponse
  C --> UI : 200 OK
  UI --> A : Receipt + contract
else rowsUpdated = 0
  S -> DR : save(CANCELLED)
  S --> C : VehicleAlreadyReservedException
  C --> UI : 409 Conflict
  UI --> A : Xe vừa được giữ bởi giao dịch khác
end
@enduml
```

## 2. Tìm kiếm / lọc xe

```plantuml
@startuml
actor "Guest" as A
boundary "VehicleListPage\n(React UI)" as UI
control "ListingController" as C
control "ListingService" as S
control "ListingSpecification" as SP
collections "ListingRepository" as R
database "PostgreSQL" as DB

A -> UI : Nhập keyword/filter
UI -> C : GET /api/v1/listings?filters&page
C -> S : searchListings(filter,pageable)
S -> SP : filterBy(filter)
SP --> S : Specification<Listing>
S -> R : findAll(spec,pageable)
R -> DB : SELECT + WHERE + paging
DB --> R : Page<Listing>
R --> S : Page<Listing>
S --> C : PageResponse<ListingResponseDto>
C --> UI : 200 OK
UI --> A : Danh sách + phân trang
@enduml
```

## 3. Login + JWT

```plantuml
@startuml
actor "User" as A
boundary "LoginPage\n(React UI)" as UI
control "AuthController" as C
control "AuthService" as S
collections "AppUserRepository" as R
control "PasswordEncoder" as PE
control "JwtTokenService" as J
database "PostgreSQL" as DB

A -> UI : Nhập username/email + password
UI -> C : POST /api/v1/auth/login
C -> S : login(usernameOrEmail,password)
S -> R : findByUsernameIgnoreCaseOrEmailIgnoreCase()
R -> DB : SELECT app_users
DB --> R : AppUser
R --> S : AppUser
S -> PE : matches(password,passwordHash)
PE --> S : true / false
alt Hợp lệ
  S -> J : generate(user)
  J --> S : signed JWT
  S --> C : AuthResponse
  C --> UI : 200 OK + JWT
  UI --> A : Đăng nhập thành công
else Sai / bị chặn
  S --> C : AuthException
  C --> UI : 401 / 403
  UI --> A : Thông báo lỗi
end
@enduml
```

## 4. Admin CRUD / trạng thái xe

```plantuml
@startuml
actor "ADMIN" as A
boundary "AdminVehiclePage\n(React UI)" as UI
control "AdminVehicleController" as C
control "VehicleService" as S
collections "VehicleRepository" as R
database "PostgreSQL" as DB

A -> UI : Create / Update / Status / Delete
UI -> C : POST/PUT/PATCH/DELETE /api/v1/admin/vehicles/**
C -> S : create/update/status/delete
S -> R : find/save/delete Vehicle
R -> DB : SQL/JPA
DB --> R : result
R --> S : result
S --> C : result
C --> UI : 200 / 201 / 4xx
UI --> A : Refresh + message
note over C
SecurityConfig yêu cầu ROLE_ADMIN
end note
@enduml
```

## 5. Staff appointment + check-in

```plantuml
@startuml
actor "STAFF" as A
boundary "StaffAppointmentPage\n(React UI)" as UI
control "StaffAppointmentController" as C
control "AppointmentService" as S
collections "AppointmentRepository" as R
database "PostgreSQL" as DB

A -> UI : Mở lịch hẹn
UI -> C : GET /api/v1/staff/appointments?showroomId&status
C -> S : getAppointments(showroomId,status)
S -> R : find appointments
R -> DB : SELECT appointments
DB --> R : List<Appointment>
R --> S : List<Appointment>
S --> C : List<Appointment>
C --> UI : 200 OK
UI --> A : Danh sách lịch hẹn

A -> UI : Bấm Check-in
UI -> C : PUT /api/v1/staff/appointments/{id}/check-in
C -> S : checkIn(id,request)
S -> R : findById(id)
R -> DB : SELECT appointment
DB --> R : Appointment
R --> S : Appointment
S -> R : save(COMPLETED)
R -> DB : UPDATE appointment
DB --> R : Appointment
R --> S : Appointment
S --> C : Appointment
C --> UI : 200 OK
UI --> A : Cập nhật trạng thái
@enduml
```

## 6. Security boundary

```plantuml
@startuml
actor Browser
boundary "React UI" as UI
control "JwtAuthenticationFilter" as JF
control "SecurityConfig" as SC
control "Controller" as C
database "PostgreSQL" as DB

Browser -> UI : Request + Bearer JWT
UI -> JF : HTTP request
JF -> JF : Verify signature + extract user id
JF -> DB : Load AppUser
DB --> JF : AppUser/state
JF -> SC : principal + authorities
alt Đủ quyền
  SC -> C : Allow
  C --> UI : 2xx
else Thiếu / sai quyền
  SC --> UI : 401 / 403
end
UI --> Browser : Result
@enduml
```

## 7. Lưu ý mismatch phải ghi trên diagram

- `DepositController.createDeposit()` hiện đọc `X-User-Id`; đây là legacy mismatch với JWT current-user contract.
- `getMyDeposits()` cũng còn `X-User-Id`.
- `confirmPayment(id)` và `getReceipt(id)` chưa nhận current-user để kiểm tra ownership.
- Không vẽ `X-User-Id` thành thiết kế mục tiêu; chỉ ghi chú mismatch hiện tại.
