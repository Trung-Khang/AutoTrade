# Collaboration Diagrams — Current Business Flows

Ngày đồng bộ: 01/10/2026

## 1. Login + JWT

```plantuml
@startuml
object USER
object AuthController
object AuthService
object AppUserRepository
object PasswordEncoder
object JwtTokenService

USER --> AuthController : 1. POST /auth/login
AuthController --> AuthService : 2. login(usernameOrEmail,password)
AuthService --> AppUserRepository : 3. find user
AuthService --> PasswordEncoder : 4. verify BCrypt
AuthService --> JwtTokenService : 5. generate(user)
JwtTokenService --> AuthService : 6. JWT
AuthService --> AuthController : 7. AuthResponse
AuthController --> USER : 8. 200 OK
@enduml
```

## 2. Register + verify email

```plantuml
@startuml
object GUEST
object AuthController
object AuthService
object AppUserRepository
object PasswordEncoder
object OtpService
object AuthOtpRepository
object OtpMailService

GUEST --> AuthController : 1. POST /auth/register
AuthController --> AuthService : 2. register(request)
AuthService --> PasswordEncoder : 3. BCrypt hash
AuthService --> AppUserRepository : 4. save CUSTOMER
AuthService --> OtpService : 5. issue VERIFY_EMAIL
OtpService --> AuthOtpRepository : 6. save SHA-256 hash
OtpService --> OtpMailService : 7. send OTP
AuthService --> AuthController : 8. MessageResponse
AuthController --> GUEST : 9. 200 OK

GUEST --> AuthController : 10. POST /auth/verify-email
AuthController --> AuthService : 11. verifyEmail(email,code)
AuthService --> OtpService : 12. verify OTP
OtpService --> AuthOtpRepository : 13. load latest OTP
AuthService --> AppUserRepository : 14. mark emailVerified
AuthController --> GUEST : 15. 200 OK
@enduml
```

## 3. Create deposit + appointment

```plantuml
@startuml
object CUSTOMER
object DepositController
object DepositService
object VehicleRepository
object ShowroomRepository
object DepositRepository
object AppointmentRepository

CUSTOMER --> DepositController : 1. POST /deposits
DepositController --> DepositService : 2. createDeposit(request,userId)
DepositService --> VehicleRepository : 3. verify AVAILABLE
DepositService --> ShowroomRepository : 4. verify showroom
DepositService --> DepositRepository : 5. save PENDING
DepositService --> AppointmentRepository : 6. save PENDING
DepositService --> DepositController : 7. DepositResponse
DepositController --> CUSTOMER : 8. 201 Created
@enduml
```

**Mismatch note:** current `userId` path still comes from `X-User-Id` in the controller.

## 4. Confirm deposit / atomic lock

```plantuml
@startuml
object CUSTOMER
object DepositController
object DepositService
object DepositRepository
object VehicleRepository
object TransactionLedgerRepository

CUSTOMER --> DepositController : 1. POST /deposits/{id}/confirm
DepositController --> DepositService : 2. confirmPayment(id)
DepositService --> DepositRepository : 3. find deposit
DepositService --> VehicleRepository : 4. atomic AVAILABLE -> HOLD
DepositService --> DepositRepository : 5. save DEPOSITED or CANCELLED
DepositService --> TransactionLedgerRepository : 6. save ledger if success
DepositService --> DepositController : 7. receipt / 409
DepositController --> CUSTOMER : 8. 200 or 409
@enduml
```

## 5. Staff check-in

```plantuml
@startuml
object STAFF
object StaffAppointmentController
object AppointmentService
object AppointmentRepository

STAFF --> StaffAppointmentController : 1. PUT /staff/appointments/{id}/check-in
StaffAppointmentController --> AppointmentService : 2. checkIn(id,request)
AppointmentService --> AppointmentRepository : 3. findById
AppointmentService --> AppointmentRepository : 4. save COMPLETED
AppointmentRepository --> AppointmentService : 5. updated Appointment
AppointmentService --> StaffAppointmentController : 6. Appointment
StaffAppointmentController --> STAFF : 7. 200 OK
@enduml
```

## 6. Admin refund

```plantuml
@startuml
object ADMIN
object AdminLedgerController
object AdminLedgerService
object DepositRepository
object VehicleRepository
object TransactionLedgerRepository

ADMIN --> AdminLedgerController : 1. POST /admin/ledger/{depositId}/refund
AdminLedgerController --> AdminLedgerService : 2. refundDeposit(...)
AdminLedgerService --> DepositRepository : 3. load deposit
AdminLedgerService --> DepositRepository : 4. save REFUNDED
AdminLedgerService --> VehicleRepository : 5. set AVAILABLE
AdminLedgerService --> TransactionLedgerRepository : 6. save negative REFUND
AdminLedgerService --> AdminLedgerController : 7. result
AdminLedgerController --> ADMIN : 8. 200 OK
@enduml
```
