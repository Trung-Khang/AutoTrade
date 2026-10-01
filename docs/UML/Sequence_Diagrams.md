# Sequence Diagrams — Current API Flow

Ngày đồng bộ: 01/10/2026

## 1. Login + current user

```plantuml
@startuml
actor User
participant "AuthController" as C
participant "AuthService" as S
participant "AppUserRepository" as UR
participant "PasswordEncoder" as PE
participant "JwtTokenService" as J

User -> C: POST /api/v1/auth/login
C -> S: login(usernameOrEmail,password)
S -> UR: findByUsernameIgnoreCaseOrEmailIgnoreCase(...)
UR --> S: AppUser
S -> PE: matches(password,passwordHash)
PE --> S: true
S -> J: generate(user)
J --> S: signed JWT
S --> C: AuthResponse
C --> User: 200 OK + JWT/user
@enduml
```

## 2. Register + verify email OTP

```plantuml
@startuml
actor Guest
participant "AuthController" as C
participant "AuthService" as S
participant "AppUserRepository" as U
participant "PasswordEncoder" as PE
participant "OtpService" as O
participant "OtpMailService" as M
participant "AuthOtpRepository" as OR

Guest -> C: POST /auth/register
C -> S: register(request)
S -> PE: BCrypt encode(password)
PE --> S: password hash
S -> U: save user CUSTOMER
S -> O: issue(user, VERIFY_EMAIL)
O -> OR: save OTP hash/expiry
O -> M: send(email, code)
M --> O: emailSent
O --> S: dispatch
S --> C: MessageResponse
C --> Guest: 200 OK

Guest -> C: POST /auth/verify-email
C -> S: verifyEmail(email, code)
S -> O: verify(...)
O -> OR: load active OTP + compare SHA-256
OR --> O: valid
O --> S: user
S -> U: mark emailVerified=true
S --> C: MessageResponse
C --> Guest: 200 OK
@enduml
```

## 3. Forgot password / reset token

```plantuml
@startuml
actor User
participant "AuthController" as C
participant "AuthService" as S
participant "OtpService" as O
participant "PasswordResetSessionRepository" as PR

User -> C: POST /auth/forgot-password
C -> S: requestPasswordReset(email)
S -> O: issue(user, RESET_PASSWORD)
O --> S: generic response
S --> C: MessageResponse
C --> User: 200 OK (generic)

User -> C: POST /auth/verify-reset-otp
C -> S: verifyPasswordResetOtp(email, code)
S -> O: verify(...)
O --> S: user
S -> PR: consume previous sessions
S -> PR: save reset session(tokenHash, expiry)
S --> C: ResetVerificationResponse(resetToken)
C --> User: 200 OK

User -> C: POST /auth/reset-password
C -> S: resetPassword(resetToken,newPassword,confirmPassword)
S -> PR: find active session by token hash
PR --> S: session
S -> PR: mark consumed
S --> C: MessageResponse
C --> User: 200 OK
@enduml
```

## 4. Search / filter listing

```plantuml
@startuml
actor Guest
participant "ListingController" as C
participant "ListingService" as S
participant "ListingSpecification" as SP
participant "ListingRepository" as R
participant "ListingResponseDto" as D

Guest -> C: GET /api/v1/listings?filters&page
C -> S: searchListings(filter,pageable)
S -> SP: filterBy(filter)
SP --> S: Specification<Listing>
S -> R: findAll(spec,pageable)
R --> S: Page<Listing>
S -> D: fromEntity(listing)
D --> S: ListingResponseDto
S --> C: PageResponse
C --> Guest: 200 OK
@enduml
```

## 5. Create deposit + appointment

```plantuml
@startuml
actor CUSTOMER
participant "DepositController" as C
participant "DepositService" as S
participant "VehicleRepository" as VR
participant "ShowroomRepository" as SR
participant "DepositRepository" as DR
participant "AppointmentRepository" as AR

CUSTOMER -> C: POST /api/v1/deposits
C -> C: current code reads X-User-Id header (legacy mismatch)
C -> S: createDeposit(request,userId)
S -> VR: findById(vehicleId)
VR --> S: Vehicle
S -> S: require status AVAILABLE
S -> SR: findById(showroomId)
SR --> S: Showroom
S -> DR: save Deposit(PENDING)
DR --> S: Deposit
S -> AR: save Appointment(PENDING)
AR --> S: Appointment
S --> C: DepositResponse
C --> CUSTOMER: 201 Created
@enduml
```

**Target security contract:** `userId` must come from JWT `SecurityUtils.currentUser()`, not a browser-provided header.

## 6. Confirm deposit + atomic vehicle lock

```plantuml
@startuml
actor CUSTOMER
participant "DepositController" as C
participant "DepositService" as S
participant "DepositRepository" as DR
participant "VehicleRepository" as VR
participant "TransactionLedgerRepository" as LR

CUSTOMER -> C: POST /api/v1/deposits/{id}/confirm
C -> S: confirmPayment(id)
S -> DR: findById(id)
DR --> S: Deposit

alt status == DEPOSITED
  S -> S: getReceipt(id)
  S --> C: existing ReceiptResponse
else status == PENDING
  S -> VR: updateVehicleStatusIfAvailable(vehicleId,HOLD)
  alt rowsUpdated == 1
    VR --> S: 1
    S -> S: status = DEPOSITED
    S -> DR: save(deposit)
    S -> LR: save(DEPOSIT_RECEIVED)
    S --> C: ReceiptResponse
    C --> CUSTOMER: 200 OK
  else rowsUpdated == 0
    VR --> S: 0
    S -> DR: save(CANCELLED)
    S --> C: VehicleAlreadyReservedException
    C --> CUSTOMER: 409 Conflict
  end
end
@enduml
```

**Current gap:** sequence does not contain an ownership decision because source `confirmPayment()` only accepts `depositId`.

## 7. Staff appointment/check-in

```plantuml
@startuml
actor STAFF
participant "StaffAppointmentController" as C
participant "AppointmentService" as S
participant "AppointmentRepository" as R

STAFF -> C: GET /api/v1/staff/appointments?showroomId&status
C -> S: getAppointments(showroomId,status)
S -> R: findByShowroomId... / findByStatus / findAll
R --> S: List<Appointment>
S --> C: list
C --> STAFF: 200 OK

STAFF -> C: PUT /api/v1/staff/appointments/{id}/check-in
C -> S: checkIn(id,request)
S -> R: findById(id)
R --> S: Appointment
S -> S: status = COMPLETED
S -> R: save(appointment)
R --> S: Appointment
S --> C: Appointment
C --> STAFF: 200 OK
@enduml
```

## 8. Admin refund

```plantuml
@startuml
actor ADMIN
participant "AdminLedgerController" as C
participant "AdminLedgerService" as S
participant "DepositRepository" as DR
participant "VehicleRepository" as VR
participant "TransactionLedgerRepository" as LR

ADMIN -> C: POST /api/v1/admin/ledger/{depositId}/refund
C -> S: refundDeposit(depositId,reason)
S -> DR: findById(depositId)
DR --> S: Deposit
S -> DR: save(status=REFUNDED)
S -> VR: updateVehicleStatus(vehicleId,AVAILABLE)
S -> LR: save(REFUND negative amount)
LR --> S: Ledger
S --> C: result map
C --> ADMIN: 200 OK
@enduml
```

## 9. Security boundary

```plantuml
@startuml
participant Browser
participant "JwtAuthenticationFilter" as JF
participant "SecurityConfig" as SC
participant "Controller" as C

Browser -> JF: Authorization: Bearer <jwt>
JF -> JF: verify signature + extract user id
JF -> SC: authenticated principal + authorities
SC -> C: allow/deny by method + URL + role
C --> Browser: 200 / 401 / 403
@enduml
```

SecurityConfig currently protects `/admin/**`, `/staff/**`, deposit endpoints, `/auth/me` and logout; public GET catalog and auth bootstrap endpoints remain permitAll.
