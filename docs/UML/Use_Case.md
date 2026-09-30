# Use Case Specification

Ngày đồng bộ: 30/09/2026

## 1. Actor

- **Guest:** browse/search/detail.
- **CUSTOMER:** deposit, appointment, deposit history, account/auth requirement.
- **STAFF:** appointment list/check-in.
- **ADMIN:** vehicle CRUD/status, ledger/refund.
- **System:** state transition, QR/reference, transaction.

## 2. Use Case map

| ID | Use Case | Actor | API / Evidence | Status |
|---|---|---|---|---|
| UC-01 | Browse vehicle listings | Guest | `GET /api/v1/listings` | IMPLEMENTED |
| UC-02 | Search & filter | Guest | `GET /api/v1/listings` + `ListingSpecification` | IMPLEMENTED |
| UC-03 | View listing detail | Guest | `GET /api/v1/listings/{id}` | IMPLEMENTED |
| UC-04 | Login/RBAC | CUSTOMER/STAFF/ADMIN | Auth API planned | PENDING |
| UC-05 | Admin vehicle CRUD/status | ADMIN | `/api/v1/admin/vehicles/**` | IMPLEMENTED (auth pending) |
| UC-06 | Create deposit + appointment | CUSTOMER | `POST /api/v1/deposits` | IMPLEMENTED (auth/validation pending) |
| UC-07 | Confirm deposit / lock vehicle / receipt | CUSTOMER/System | `/deposits/{id}/confirm`, `/receipt` | IMPLEMENTED (tests pending) |
| UC-08 | Staff appointment/check-in | STAFF | `/staff/appointments/**` | IMPLEMENTED (security/test pending) |
| UC-09 | Register | Guest | Auth contract | PENDING |
| UC-10 | Forgot password / OTP | Guest/CUSTOMER | Auth contract | PENDING |
| UC-11 | Favorite vehicle | CUSTOMER | No backend API found | PENDING |
| UC-12 | My deposits | CUSTOMER | `GET /api/v1/deposits/my` | IMPLEMENTED (auth pending) |
| UC-13 | Account/profile | CUSTOMER/ADMIN | No current backend implementation | PENDING |
| UC-14 | Admin ledger/refund | ADMIN | `/api/v1/admin/ledger/**` | IMPLEMENTED (auth/contract/test pending) |
| UC-15 | Statistics | ADMIN | No current backend implementation | PENDING |

## 3. Use Case detail

### UC-01/UC-02 — Browse/Search/Filter listing

**Precondition:** none.

**Main flow:**

1. Guest opens listing page.
2. Frontend sends `GET /api/v1/listings` with pageable/filter query.
3. `ListingController` forwards request to `ListingService`.
4. `ListingSpecification.filterBy()` builds Spring Data specification.
5. Repository returns paged `Listing` entities.
6. `ListingResponseDto.fromEntity()` maps listing + vehicle + source fields.
7. `PageResponse` is returned.

**Negative flow:** invalid/non-matching filters return empty page; unknown detail ID returns 404 via `ResourceNotFoundException`.

### UC-03 — View listing detail

1. Guest calls `GET /api/v1/listings/{id}`.
2. Service loads listing by ID.
3. DTO includes listing, vehicle and source fields.
4. Not-found → resource exception/404 handler.

### UC-05 — Admin vehicle CRUD

**Main flow:**

1. ADMIN submits create/update/status/delete request.
2. `AdminVehicleController` validates routing and forwards to `VehicleService`.
3. `VehicleService` loads/creates `Vehicle` and persists.
4. Current implementation does not yet enforce ADMIN role at controller/security layer.

### UC-06 — Create deposit + appointment

**Precondition:** selected vehicle exists and is `AVAILABLE`; showroom exists.

**Main flow:**

1. CUSTOMER selects vehicle/showroom/date/time.
2. POST `/api/v1/deposits` with `CreateDepositRequest`.
3. `DepositService.createDeposit()` checks vehicle status and showroom.
4. Creates `Deposit(status=PENDING)`.
5. Creates `Appointment(status=PENDING)` linked to vehicle/showroom/user and optional test drive.
6. Returns `DepositResponse` including deposit code and QR reference.

**Current gap:** code does not enforce auth and does not reject past appointment date explicitly.

### UC-07 — Confirm deposit / lock vehicle / receipt

1. CUSTOMER calls POST `/api/v1/deposits/{id}/confirm`.
2. Service loads deposit.
3. If already deposited, returns existing receipt (idempotent path in service).
4. Atomic repository update attempts `AVAILABLE -> HOLD` for the target vehicle.
5. If no row updated, service raises conflict for duplicate/unavailable deposit.
6. Deposit changes to `DEPOSITED`; receipt/contract references are generated.
7. A ledger transaction is inserted.
8. `ReceiptResponse` is returned.

**Important state:** current code uses `PENDING`, not `PENDING_PAYMENT`.

### UC-08 — Staff appointment/check-in

1. STAFF calls `GET /api/v1/staff/appointments` with optional showroom/status.
2. Service loads appointment entities.
3. STAFF sends PUT `/api/v1/staff/appointments/{id}/check-in`.
4. Service sets status `COMPLETED`, optional `staffNote`, and may set `testDriveCompleted` flag.

**Current gap:** endpoint exists but role authorization and automated test are missing.

### UC-14 — Admin ledger/refund

1. ADMIN calls `GET /api/v1/admin/ledger`.
2. Service returns totals and ledger transactions.
3. ADMIN calls POST `/api/v1/admin/ledger/{depositId}/refund`.
4. Service sets deposit `REFUNDED`, vehicle `AVAILABLE`, and writes a negative ledger entry.

**Current gap:** backend authorization and contract test are missing.

## 4. State definitions

### Vehicle

```text
AVAILABLE
   |
   +--> HOLD
   |
   +--> RESERVED
   |
   +--> SOLD
```

Typical return flow after a refundable deposit:

```text
HOLD -> AVAILABLE
```

### Deposit

```text
PENDING -> DEPOSITED -> REFUNDED
       \-> CANCELLED
```

### Appointment

```text
PENDING -> COMPLETED
       \-> CANCELLED
```

## 5. Scope removed from current Use Case model

Do not add use cases for:

- ML/regression/R Plumber
- automated valuation
- recommendation
- vehicle comparison
- real payment gateway
- shopping cart
- standalone test-drive workflow
