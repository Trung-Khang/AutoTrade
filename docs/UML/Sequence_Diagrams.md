# Sequence Diagrams — Current API Flow

Ngày đồng bộ: 30/09/2026

## 1. Search / Filter Listing

```plantuml
@startuml
actor Guest
participant "ListingController" as C
participant "ListingService" as S
participant "ListingSpecification" as SP
participant "ListingRepository" as R
participant "ListingResponseDto" as D

Guest -> C: GET /api/v1/listings?filters&page
C -> S: searchListings(filter, pageable)
S -> SP: filterBy(filter)
SP --> S: Specification<Listing>
S -> R: findAll(spec, pageable)
R --> S: Page<Listing>
S -> D: fromEntity(listing)
D --> S: ListingResponseDto
S --> C: PageResponse<ListingResponseDto>
C --> Guest: 200 OK
@enduml
```

## 2. View Detail

```plantuml
@startuml
actor Guest
participant "ListingController" as C
participant "ListingService" as S
participant "ListingRepository" as R
participant "ListingResponseDto" as D

Guest -> C: GET /api/v1/listings/{id}
C -> S: getListingDtoById(id)
S -> R: findById(id)
alt found
  R --> S: Listing
  S -> D: fromEntity(listing)
  D --> S: DTO
  S --> C: DTO
  C --> Guest: 200 OK
else not found
  R --> S: empty
  S --> C: ResourceNotFoundException
  C --> Guest: 404
end
@enduml
```

## 3. Admin CRUD Vehicle

```plantuml
@startuml
actor ADMIN
participant "AdminVehicleController" as C
participant "VehicleService" as S
participant "VehicleRepository" as R
participant "ShowroomRepository" as SR

ADMIN -> C: POST /api/v1/admin/vehicles
C -> S: createVehicle(request)
S -> R: save(vehicle)
R --> S: Vehicle
S --> C: Vehicle
C --> ADMIN: 201 Created

ADMIN -> C: PUT /api/v1/admin/vehicles/{id}
C -> S: updateVehicle(id, request)
S -> R: findById(id)
R --> S: Vehicle
S -> R: save(vehicle)
R --> S: Vehicle
S --> C: Vehicle
C --> ADMIN: 200 OK

ADMIN -> C: PATCH /api/v1/admin/vehicles/{id}/status?status=...
C -> S: updateVehicleStatus(id, status)
S -> R: findById(id)
R --> S: Vehicle
S -> R: save(vehicle)
R --> S: Vehicle
S --> C: Vehicle
C --> ADMIN: 200 OK
@enduml
```

## 4. Create Deposit + Appointment

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
C -> S: createDeposit(request, userId)
S -> VR: findById(vehicleId)
VR --> S: Vehicle
S -> S: check status == AVAILABLE
S -> SR: findById(showroomId)
SR --> S: Showroom
S -> DR: save(Deposit PENDING)
DR --> S: Deposit
S -> AR: save(Appointment PENDING)
AR --> S: Appointment
S --> C: DepositResponse
C --> CUSTOMER: 201 Created
@enduml
```

## 5. Confirm Deposit + Atomic Vehicle Lock

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

alt status already DEPOSITED
  S --> C: existing ReceiptResponse
else PENDING
  S -> VR: updateVehicleStatusIfAvailable(vehicleId, AVAILABLE, HOLD)
  alt one row updated
    VR --> S: 1
    S -> S: set deposit DEPOSITED + receipt/contract
    S -> DR: save(deposit)
    S -> LR: save(Deposit ledger transaction)
    S --> C: ReceiptResponse
    C --> CUSTOMER: 200 OK
  else row count 0
    VR --> S: 0
    S --> C: conflict / duplicate deposit
    C --> CUSTOMER: conflict
  end
end
@enduml
```

## 6. Staff Check-in

```plantuml
@startuml
actor STAFF
participant "StaffAppointmentController" as C
participant "AppointmentService" as S
participant "AppointmentRepository" as R

STAFF -> C: GET /api/v1/staff/appointments
C -> S: getAppointments(showroomId, status)
S -> R: findBy...()
R --> S: appointments
S --> C: List<Appointment>
C --> STAFF: 200 OK

STAFF -> C: PUT /api/v1/staff/appointments/{id}/check-in
C -> S: checkIn(id, request)
S -> R: findById(id)
R --> S: Appointment
S -> S: status = COMPLETED
S -> R: save(appointment)
R --> S: Appointment
S --> C: Appointment
C --> STAFF: 200 OK
@enduml
```

## 7. Admin Refund

```plantuml
@startuml
actor ADMIN
participant "AdminLedgerController" as C
participant "AdminLedgerService" as S
participant "DepositRepository" as DR
participant "VehicleRepository" as VR
participant "TransactionLedgerRepository" as LR

ADMIN -> C: POST /api/v1/admin/ledger/{depositId}/refund
C -> S: refundDeposit(depositId, reason)
S -> DR: findById(depositId)
DR --> S: Deposit
S -> S: status = REFUNDED
S -> DR: save(deposit)
S -> VR: findById(vehicleId)
VR --> S: Vehicle
S -> S: status = AVAILABLE
S -> VR: save(vehicle)
S -> LR: save(negative refund ledger)
LR --> S: Ledger
S --> C: result map
C --> ADMIN: 200 OK
@enduml
```

## 8. Auth sequence

**PENDING.** Không vẽ backend `AuthController/SecurityFilter/JWT` khi các class đó chưa có trong repository.
