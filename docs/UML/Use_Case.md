# Use Case Specification

Ngày đồng bộ: 01/10/2026

## 1. Actor

- **Guest:** browse/search/detail, register, verify email, forgot password.
- **CUSTOMER:** login, deposit, appointment, my deposits, confirm deposit, receipt.
- **STAFF:** appointment list/check-in.
- **ADMIN:** vehicle CRUD/status, ledger/refund.
- **System:** JWT authentication, OTP, QR/reference, transaction/state transition.

## 2. Use Case map

| ID | Use Case | Actor | API / Implementation | Status |
|---|---|---|---|---|
| UC-01 | Browse listings | Guest | `GET /api/v1/listings` | IMPLEMENTED |
| UC-02 | Search & filter | Guest | `GET /api/v1/listings`, `ListingSpecification` | IMPLEMENTED |
| UC-03 | View detail | Guest | `GET /api/v1/listings/{id}`, `GET /api/v1/vehicles/{id}` | IMPLEMENTED |
| UC-04 | Login/RBAC | CUSTOMER/STAFF/ADMIN | `/auth/login`, `SecurityConfig`, JWT | IMPLEMENTED |
| UC-05 | Admin vehicle CRUD/status | ADMIN | `/admin/vehicles/**` | PARTIAL |
| UC-06 | Create deposit + appointment | CUSTOMER | `POST /deposits` | PARTIAL |
| UC-07 | Confirm deposit / lock / receipt | CUSTOMER/System | `/deposits/{id}/confirm`, `/receipt` | PARTIAL |
| UC-08 | Staff appointment/check-in | STAFF | `/staff/appointments/**` | PARTIAL |
| UC-09 | Register + email verify | Guest | `/auth/register`, `/verify-email`, `/resend-verification` | IMPLEMENTED |
| UC-10 | Forgot password / OTP / reset | Guest/CUSTOMER | `/forgot-password`, `/verify-reset-otp`, `/reset-password` | IMPLEMENTED |
| UC-11 | Favorite vehicle | CUSTOMER | No backend API | PENDING |
| UC-12 | My deposits | CUSTOMER | `GET /api/v1/deposits/my` | PARTIAL |
| UC-13 | Current account/profile | CUSTOMER/ADMIN | `GET /api/v1/auth/me` | IMPLEMENTED (current-user only) |
| UC-14 | Admin ledger/refund | ADMIN | `/admin/ledger/**` | PARTIAL |
| UC-15 | Statistics | ADMIN | No current backend implementation | PENDING |

## 3. Use Case detail

### UC-04 — Login/RBAC

**Main flow**

1. User submits `usernameOrEmail` + password.
2. `AuthController.login()` calls `AuthService.login()`.
3. Service loads user by username/email.
4. Active/locked/email-verified state is checked.
5. BCrypt password match succeeds.
6. `JwtTokenService.generate()` creates signed token with user ID, username and role.
7. Frontend stores token and calls `/auth/me` after reload.
8. `SecurityConfig` applies role matcher to protected endpoints.

**Negative flow**

- Missing credentials → `400`.
- Wrong credentials → `401`.
- Inactive/locked/unverified → `403`.
- Wrong role at protected endpoint → `403`.

### UC-09 — Register + verify email

1. Guest submits username, full name, email, phone, password.
2. `AuthService.register()` validates and creates `CUSTOMER`.
3. Password is BCrypt cost 12.
4. `OtpService.issue()` creates a 6-digit OTP, stores SHA-256 hash and sends email.
5. `/auth/verify-email` verifies OTP and marks `emailVerified=true`.
6. OTP is single-use; resend cooldown is 60 seconds.

### UC-10 — Forgot password / reset

1. `POST /forgot-password` always returns a generic message to avoid email enumeration.
2. If account is eligible, reset OTP is issued.
3. `POST /verify-reset-otp` verifies OTP and creates a short-lived reset token.
4. Previous unconsumed sessions are consumed.
5. `POST /reset-password` validates token + new password, writes BCrypt hash and consumes the reset session.

### UC-06 — Create deposit + appointment

**Precondition:** vehicle exists and is `AVAILABLE`; showroom exists.

1. CUSTOMER sends `POST /api/v1/deposits`.
2. `DepositService.createDeposit()` checks vehicle/showroom.
3. Deposit is created as `PENDING` with fixed amount `10,000,000`.
4. Mock QR URL is generated.
5. Appointment is created as `PENDING` with `hasTestDrive`.

**Current security gap:** controller still accepts `X-User-Id`; target contract is current user from JWT. Future-date validation is not enforced in the service.

### UC-07 — Confirm deposit / lock / receipt

1. CUSTOMER calls `POST /api/v1/deposits/{id}/confirm`.
2. Existing `DEPOSITED` deposit returns existing receipt.
3. Otherwise atomic vehicle update attempts `AVAILABLE -> HOLD`.
4. One row updated → deposit becomes `DEPOSITED`; receipt and contract number are generated; ledger entry is created.
5. Zero rows updated → deposit becomes `CANCELLED`; vehicle conflict maps to HTTP 409.

**Current security gap:** confirm service receives only deposit ID and does not verify that the deposit belongs to JWT current user.

### UC-08 — Staff check-in

1. STAFF requests appointments.
2. `AppointmentService.getAppointments()` selects by showroom/status depending on the passed parameters.
3. STAFF calls `PUT /staff/appointments/{id}/check-in`.
4. Appointment status becomes `COMPLETED`.
5. Optional test-drive flag and staff note are stored.

### UC-14 — Admin ledger/refund

1. ADMIN calls ledger overview.
2. Service returns transaction list and total holding amount.
3. ADMIN posts refund with optional reason.
4. Deposit becomes `REFUNDED`.
5. Vehicle becomes `AVAILABLE`.
6. Negative `REFUND` ledger entry is stored.

## 4. State definitions

### Vehicle

```text
AVAILABLE -> HOLD -> RESERVED -> SOLD
HOLD -> AVAILABLE  (refund/other refundable release path)
```

Database V3_0_1 also defines `ARCHIVED` for old marketplace configurations without showroom.

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

## 5. Removed scope

- ML/regression/R Plumber
- automatic valuation
- recommendation/comparison
- real payment gateway
- shopping cart
- standalone test-drive workflow
