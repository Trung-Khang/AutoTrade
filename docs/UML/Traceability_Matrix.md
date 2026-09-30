# Traceability Matrix

Ngày đồng bộ: 30/09/2026

**Status rule:**

- `IMPLEMENTED`: code đã tồn tại trong repository.
- `PARTIAL`: code có nhưng còn security/contract/validation/test gap.
- `VERIFIED`: chỉ dùng khi có test/evidence thật.
- `PENDING`: chưa có implementation tương ứng.

| FR | Use Case | API / Implementation | Test / Evidence hiện có | Status |
|---|---|---|---|---|
| FR-01 | UC-09 Register | Auth API chưa có | Chưa có | PENDING |
| FR-02 | UC-04 Login/RBAC | Auth/Security backend chưa có | Chưa có | PENDING |
| FR-03 | UC-10 OTP reset | Auth/OTP backend chưa có | Chưa có | PENDING |
| FR-04 | UC-01/02 Search/filter | `GET /api/v1/listings`, `ListingSpecification` | `ListingControllerIntegrationTest`, `ListingSpecificationTest`, `ListingServiceTest` | IMPLEMENTED |
| FR-05 | UC-03 Detail | `GET /api/v1/listings/{id}` | `ListingControllerIntegrationTest` | IMPLEMENTED |
| FR-06 | UC-11 Favorites | Chưa có backend API/model | Chưa có | PENDING |
| FR-07 | UC-06 Deposit + appointment | `POST /api/v1/deposits` | Chưa có automated test module mới | PARTIAL |
| FR-08 | UC-07 Confirm payment | `POST /api/v1/deposits/{id}/confirm` | Chưa có automated test module mới | IMPLEMENTED |
| FR-09 | UC-07 Vehicle locking | `updateVehicleStatusIfAvailable()` trong deposit flow | Chưa có concurrency test | IMPLEMENTED |
| FR-10 | UC-07 Receipt | `GET /api/v1/deposits/{id}/receipt` | Chưa có automated test; API example cần sync | PARTIAL |
| FR-11 | Contact | UI/static requirement; no backend contract found | Chưa có | PENDING |
| FR-12 | UC-08 Staff appointment | `GET/PUT /api/v1/staff/appointments/**` | Chưa có automated test | PARTIAL |
| FR-13 | UC-05 Admin vehicle CRUD | `/api/v1/admin/vehicles/**` | Chưa có role/security test; legacy vehicle tests không verify ADMIN | PARTIAL |
| FR-14 | UC-14 Ledger/refund | `/api/v1/admin/ledger/**` | Chưa có automated test | PARTIAL |
| FR-15 | UC-13/15 Account/statistics | Chưa có backend implementation | Chưa có | PENDING |

## 1. Existing automated backend evidence

- `backend/src/test/java/com/system/controller/ListingControllerIntegrationTest.java`
- `backend/src/test/java/com/system/controller/VehicleControllerIntegrationTest.java`
- `backend/src/test/java/com/system/dto/ListingDtoMappingTest.java`
- `backend/src/test/java/com/system/service/ListingServiceTest.java`
- `backend/src/test/java/com/system/specification/ListingSpecificationTest.java`

Các file trên chứng minh có test code; không được đổi thành `VERIFIED PASS` nếu chưa có execution report/evidence gắn kèm.

## 2. Cross-team blockers

| Blocker | Owner | TV5 action |
|---|---|---|
| Auth backend chưa có | TV4 | Giữ FR-01..03 là PENDING; không invent classes |
| DB bootstrap chưa gồm V3 | TV3 | Ghi discrepancy trong ERD/report |
| API docs lệch response thực tế | TV1 | Đánh dấu PARTIAL/contract mismatch |
| Frontend endpoint lệch backend | TV2 + TV1 | Không sửa trong nhánh TV5 |
| Test Plan đang đánh dấu Pass quá rộng | TV2 | Yêu cầu đối chiếu lại với evidence thật |
