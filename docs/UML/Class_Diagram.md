# Class Diagram — Current Implementation

Ngày đồng bộ: 01/10/2026

TV5 models classes actually found in the repository. Auth/security is included because it is now implemented in source.

## 1. Backend class diagram

```plantuml
@startuml
skinparam classAttributeIconSize 0

package "Entity" {
  class Vehicle
  class Source
  class Listing
  class Showroom
  class Deposit
  class Appointment
  class TransactionLedger
  class AppUser
  class AuthOtp
  class PasswordResetSession
  enum Role { CUSTOMER; STAFF; ADMIN }
  enum OtpPurpose { VERIFY_EMAIL; RESET_PASSWORD }
}

package "DTO" {
  class CreateDepositRequest
  class DepositResponse
  class ReceiptResponse
  class CheckInRequest
  class ListingFilterRequest
  class ListingResponseDto
  class PageResponse
  class VehicleRequest
  class VehicleResponse
  class LoginRequest
  class RegisterRequest
  class OtpVerificationRequest
  class ResetPasswordRequest
  class AuthResponse
  class CurrentUserResponse
  class MessageResponse
  class ResetVerificationResponse
}

package "Service" {
  class ListingService
  class VehicleService
  class DepositService
  class AppointmentService
  class AdminLedgerService
  class AuthService
  class OtpService
  class OtpMailService
}

package "Controller" {
  class ListingController
  class VehicleController
  class AdminVehicleController
  class DepositController
  class StaffAppointmentController
  class AdminLedgerController
  class AuthController
}

package "Repository" {
  interface ListingRepository
  interface VehicleRepository
  interface SourceRepository
  interface ShowroomRepository
  interface DepositRepository
  interface AppointmentRepository
  interface TransactionLedgerRepository
  interface AppUserRepository
  interface AuthOtpRepository
  interface PasswordResetSessionRepository
}

package "Security / Config" {
  class SecurityConfig
  class JwtAuthenticationFilter
  class JwtTokenService
  class AppUserPrincipal
  class SecurityUtils
  interface PasswordEncoder
  class RestAuthenticationEntryPoint
  class RestAccessDeniedHandler
}

Listing "*" --> "1" Vehicle
Listing "*" --> "1" Source
Vehicle "*" --> "0..1" Showroom
Deposit "*" --> "1" Vehicle
Deposit "*" --> "1" Showroom
Appointment "*" --> "1" Vehicle
Appointment "*" --> "1" Showroom
Appointment "0..*" --> "0..1" Deposit
TransactionLedger "*" --> "1" Deposit
AuthOtp "*" --> "1" AppUser
PasswordResetSession "*" --> "1" AppUser
AppUser --> Role
AuthOtp --> OtpPurpose

ListingController --> ListingService
VehicleController --> ListingService
AdminVehicleController --> VehicleService
DepositController --> DepositService
StaffAppointmentController --> AppointmentService
AdminLedgerController --> AdminLedgerService
AuthController --> AuthService

ListingService --> ListingRepository
ListingService --> VehicleRepository
VehicleService --> VehicleRepository
VehicleService --> ShowroomRepository
DepositService --> DepositRepository
DepositService --> VehicleRepository
DepositService --> ShowroomRepository
DepositService --> AppointmentRepository
DepositService --> TransactionLedgerRepository
AppointmentService --> AppointmentRepository
AdminLedgerService --> DepositRepository
AdminLedgerService --> VehicleRepository
AdminLedgerService --> TransactionLedgerRepository
AuthService --> AppUserRepository
AuthService --> PasswordResetSessionRepository
AuthService --> OtpService
AuthService --> JwtTokenService
AuthService --> PasswordEncoder
OtpService --> AppUserRepository
OtpService --> AuthOtpRepository
OtpService --> OtpMailService
SecurityConfig --> JwtAuthenticationFilter
JwtAuthenticationFilter --> JwtTokenService
JwtAuthenticationFilter --> AppUserRepository
JwtAuthenticationFilter --> AppUserPrincipal
SecurityUtils --> AppUserPrincipal

@enduml
```

## 2. Important modeling notes

- `Deposit.vehicleId`, `Deposit.userId`, `Deposit.showroomId` are scalar IDs in the current JPA entity rather than `@ManyToOne` objects.
- `Appointment.depositId`, `userId`, `vehicleId`, `showroomId` are scalar IDs in current JPA.
- `AuthOtp.user` and `PasswordResetSession.user` are actual JPA `@ManyToOne` links to `AppUser`.
- Database migrations do **not** yet add FK from `deposits.user_id` or `appointments.user_id` to `app_users.id`; ERD must not draw those as physical FKs.
- `SecurityConfig` provides method/URL role enforcement; `JwtAuthenticationFilter` reconstructs the principal from token subject and database state.
- `JwtTokenService` signs a token whose subject is user ID and includes `username` and `role` claims.
- Password hash uses `BCryptPasswordEncoder(12)`.
