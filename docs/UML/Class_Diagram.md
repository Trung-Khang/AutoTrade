# Class Diagram — Current Implementation & P0 Design

**Owner:** TV5

## 1. Nguyên tắc

Class Diagram phải sử dụng tên class/package thực tế trong repository.

Không đưa vào diagram các class chưa tồn tại chỉ để làm đẹp sơ đồ.

Các module Auth / Deposit / Appointment chỉ được bổ sung tên class cụ thể sau khi TV4/TV1 bàn giao code.

---

## 2. Current Backend Classes

```mermaid
classDiagram

class Vehicle {
    Long id
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
    Instant createdAt
}

class Source {
    Long id
    String sourceName
    String baseUrl
    Instant createdAt
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
    String listedAtRaw
    Instant listedAt
    Instant crawledAt
    Instant createdAt
    Instant updatedAt
}

class ListingFilterRequest {
    String keyword
    Long vehicleId
    String brand
    String model
    String variant
    BigDecimal minPrice
    BigDecimal maxPrice
    Integer minYear
    Integer maxYear
    Integer minMileage
    Integer maxMileage
    String fuelType
    String transmission
    String bodyType
    String origin
    String location
}

class ListingResponseDto {
    Long id
    BigDecimal price
    Integer mileage
    String color
    String location
    String sourceUrl
    String imageUrl
    Long vehicleId
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
    Long sourceId
    String sourceName
}

class PageResponse~T~ {
    List~T~ content
    int page
    int size
    long totalElements
    int totalPages
    boolean first
    boolean last
}

class VehicleController
class ListingController
class VehicleService
class ListingService
class ListingSpecification
class VehicleRepository
class ListingRepository
class SourceRepository
class ResourceNotFoundException
class GlobalExceptionHandler

Listing "*" --> "1" Vehicle
Listing "*" --> "1" Source

VehicleController --> VehicleService
VehicleController --> ListingService

ListingController --> ListingService

VehicleService --> VehicleRepository
ListingService --> ListingRepository
ListingService --> VehicleRepository
ListingService --> ListingSpecification

ListingController --> ListingResponseDto
ListingService --> ListingResponseDto
ListingService --> PageResponse
ListingController --> PageResponse
ListingController --> Listing
VehicleController --> Vehicle

ListingRepository --> Listing
VehicleRepository --> Vehicle
SourceRepository --> Source

GlobalExceptionHandler --> ResourceNotFoundException
```

---

## 3. Package structure represented by the diagram

```text
com.system
├── controller
│   ├── VehicleController
│   └── ListingController
│
├── dto
│   ├── ListingFilterRequest
│   ├── ListingResponseDto
│   └── PageResponse
│
├── entity
│   ├── Vehicle
│   ├── Listing
│   └── Source
│
├── repository
│   ├── VehicleRepository
│   ├── ListingRepository
│   └── SourceRepository
│
├── service
│   ├── VehicleService
│   └── ListingService
│
├── specification
│   └── ListingSpecification
│
└── exception
    ├── ResourceNotFoundException
    ├── ErrorResponse
    └── GlobalExceptionHandler
```

---

## 4. Database relationship

```text
sources
    1
    │
    │
    N
listings
    N
    │
    │
    1
vehicles
```

`Listing` is the market listing entity.

`Vehicle` stores the observed vehicle configuration.

`Source` stores the marketplace/source information.

---

## 5. Current search/filter flow

```text
ListingController
       ↓
ListingService
       ↓
ListingSpecification
       ↓
ListingRepository
       ↓
PostgreSQL
```

The result is mapped to:

```text
Page<Listing>
     ↓
Page<ListingResponseDto>
     ↓
PageResponse<ListingResponseDto>
```

---

## 6. Classes not yet finalized

The following must not be invented in the diagram:

```text
AuthController
AuthService
DepositController
DepositService
AppointmentController
AppointmentService
SecurityFilter
JwtService
User
Role
Deposit
Appointment
```

They are planned by the current workflow, but their actual names and relationships must come from the implementation handed over by TV1/TV4.

---

## 7. Final synchronization rule

Before Final Gate, TV5 must compare:

```text
Class Diagram
      ↕
Java source code
      ↕
Database schema
      ↕
API contract
      ↕
Sequence Diagram
```

Any class existing only in documentation must be removed or marked pending.
