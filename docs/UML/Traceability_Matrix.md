# Traceability Matrix

Ngày đồng bộ: 01/10/2026

## Status rule

- `IMPLEMENTED`: code exists.
- `PARTIAL`: code exists but there is a contract/security/validation/evidence gap.
- `VERIFIED`: execution evidence is explicitly available.
- `PENDING`: no current implementation.

| FR | Use Case | API / Implementation | Test / Evidence | Status |
|---|---|---|---|---|
| FR-01 | UC-09 Register | `POST /api/v1/auth/register` | `AuthSecurityUnitTest`; TV4 runtime/full-test report | IMPLEMENTED |
| FR-02 | UC-04 Login/RBAC | `POST /auth/login`, `SecurityConfig`, JWT filter | TV4 reports 22/22 Maven + runtime role smoke | IMPLEMENTED / verification pending full regression |
| FR-03 | UC-10 OTP/reset | `/forgot-password`, `/verify-reset-otp`, `/reset-password`, `OtpService` | `AuthSecurityUnitTest`, `AuthServiceResetPasswordTest`, `OtpMailServiceTest`; TV4 reports SMTP PASS | IMPLEMENTED / regression pending |
| FR-04 | UC-01/02 Search/filter | `GET /api/v1/listings`, `ListingSpecification` | Listing integration/service/specification tests | IMPLEMENTED |
| FR-05 | UC-03 Detail | `GET /api/v1/listings/{id}`, `GET /api/v1/vehicles/{id}` | Listing/vehicle integration test code | IMPLEMENTED |
| FR-06 | UC-11 Favorites | No backend implementation | None | PENDING |
| FR-07 | UC-06 Deposit + appointment | `POST /api/v1/deposits` | `DepositServiceUnitTest` test 1; no HTTP E2E | PARTIAL |
| FR-08 | UC-07 Confirm | `POST /api/v1/deposits/{id}/confirm` | `DepositServiceUnitTest` test 3 | PARTIAL |
| FR-09 | UC-07 Atomic vehicle lock | `VehicleRepository.updateVehicleStatusIfAvailable()` + V3_0_2 index | `DepositServiceUnitTest` race-condition case; DB V3 evidence | IMPLEMENTED |
| FR-10 | UC-07 Receipt | `GET /api/v1/deposits/{id}/receipt` | Unit path covered indirectly; no ownership HTTP test | PARTIAL |
| FR-11 | Contact | UI/static requirement | No backend evidence | PENDING |
| FR-12 | UC-08 Staff appointment | `GET/PUT /api/v1/staff/appointments/**` | `DepositServiceUnitTest` test 5; no HTTP role matrix test | PARTIAL |
| FR-13 | UC-05 Admin vehicle CRUD | `/api/v1/admin/vehicles/**`, `SecurityConfig` | `VehicleControllerIntegrationTest`; no full ADMIN auth integration evidence | PARTIAL |
| FR-14 | UC-14 Ledger/refund | `/api/v1/admin/ledger/**` | `DepositServiceUnitTest` test 6; no HTTP contract test | PARTIAL |
| FR-15 | UC-13/15 Account/statistics | `/auth/me` only for current user; no admin account/statistics module | None beyond auth smoke | PENDING for full account/statistics |

## 1. Evidence inventory

### Backend test files

```text
backend/src/test/java/com/system/security/AuthSecurityUnitTest.java
backend/src/test/java/com/system/service/AuthServiceResetPasswordTest.java
backend/src/test/java/com/system/service/OtpMailServiceTest.java
backend/src/test/java/com/system/service/DepositServiceUnitTest.java
backend/src/test/java/com/system/controller/ListingControllerIntegrationTest.java
backend/src/test/java/com/system/controller/VehicleControllerIntegrationTest.java
backend/src/test/java/com/system/dto/ListingDtoMappingTest.java
backend/src/test/java/com/system/service/ListingServiceTest.java
backend/src/test/java/com/system/specification/ListingSpecificationTest.java
```

TV4 báo cáo `mvn test: 22/22 pass` trên PostgreSQL thật và runtime smoke của JWT/RBAC/SMTP. Trong audit hiện tại chưa rerun được Maven, nên đây là **reported evidence**, không phải independent rerun.

## 2. Cross-team blockers

| Blocker | Owner | TV5 action |
|---|---|---|
| Deposit create/my còn `X-User-Id`; confirm/receipt chưa truyền current user | TV4 + TV1 | Giữ FR-07/08/10 ở PARTIAL; ghi mismatch trong UML/Sequence |
| Official API Auth contract còn payload/status cũ | TV1 + TV4 | Không sửa ở TV5; đánh dấu contract mismatch |
| Clean bootstrap chưa gồm V3/Auth | TV3 | ERD/Data Dictionary ghi rõ bootstrap gap |
| Frontend còn LocalStorage/mock fallback | TV2 | Không sửa ở TV5; đưa vào handoff |
| CORS chưa cho PATCH | TV1/TV4 | Ghi finding trước Gate 2 |
| Test Plan PASS claims rộng | TV2 | Traceability chỉ dùng VERIFIED khi có evidence thật |

## 3. Golden flow trace

```text
Guest
  -> browse/search/detail
  -> register
  -> verify OTP
  -> login
  -> JWT
  -> CUSTOMER deposit + appointment
  -> confirm deposit
  -> atomic AVAILABLE -> HOLD
  -> receipt + ledger
  -> STAFF check-in
  -> ADMIN ledger/refund
  -> vehicle AVAILABLE
```

Golden flow chỉ được coi là fully verified sau khi nhóm có HTTP/browser evidence cho từng boundary.
