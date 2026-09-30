# Class Diagram — Current Implementation

Ngày đồng bộ: 30/09/2026

TV5 models only classes actually found in the repository. Auth/security classes are intentionally omitted because they are not implemented in the current backend.

## 1. Backend class diagram

```plantuml
@startuml
skinparam classAttributeIconSize 0

package "Entity" {
  class Vehicle {
    Long id
    String vin
    String brand
    String model
    String variant
    Integer manufactureYear
    String fuelType
    String transmission
    Double engineSize
    Integer seatCount
    String origin
    String bodyType
    BigDecimal price
    Integer mileage
    String color
    String imageUrl
    String description
    String status
    Long showroomId
  }

  class Source {
    Long id
    String sourceName
    String baseUrl
  }

  class Listing {
    Long id
    Vehicle vehicle
    Source source
    BigDecimal price
    Integer mileage
    String color
    String location
    String sourceUrl
    String imageUrl
  }

  class Showroom {
    Long id
    String name
    String address
    String phone
    String city
  }

  class Deposit {
    Long id
    String depositCode
    Long vehicleId
    Long userId
    Long showroomId
    BigDecimal amount
    String status
    String qrCodeUrl
    String receiptCode
    String contractNumber
    Instant createdAt
    Instant confirmedAt
  }

  class Appointment {
    Long id
    Long depositId
    Long userId
    Long vehicleId
    Long showroomId
    LocalDateTime appointmentDate
    boolean hasTestDrive
    String status
    String customerNote
    String staffNote
  }

  class TransactionLedger {
    Long id
    Long depositId
    BigDecimal amount
    String transactionType
    String status
    String note
  }
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
}

package "Service" {
  class ListingService
  class VehicleService
  class DepositService
  class AppointmentService
  class AdminLedgerService
}

package "Controller" {
  class ListingController
  class VehicleController
  class AdminVehicleController
  class DepositController
  class StaffAppointmentController
  class AdminLedgerController
}

package "Repository" {
  interface ListingRepository
  interface VehicleRepository
  interface SourceRepository
  interface ShowroomRepository
  interface DepositRepository
  interface AppointmentRepository
  interface TransactionLedgerRepository
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

ListingController --> ListingService
VehicleController --> ListingService
AdminVehicleController --> VehicleService
DepositController --> DepositService
StaffAppointmentController --> AppointmentService
AdminLedgerController --> AdminLedgerService

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

@enduml
```

## 2. Important modeling notes

- `Deposit` và `Appointment` đang giữ foreign-key IDs dạng `Long`; chúng chưa phải JPA `@ManyToOne` object relationships.
- `Deposit.userId` và `Appointment.userId` chưa có user entity/foreign key trong current database migration.
- `Vehicle.showroomId` cũng là `Long`; showroom được service load riêng.
- `ListingResponseDto` là flat DTO ghép Listing + Vehicle + Source.
- Không thêm `User`, `Role`, `JwtToken`, `Otp`, `SecurityConfig` vào class diagram cho tới khi TV4 có implementation thực tế.
