# BÁO CÁO TIẾN ĐỘ — TV5

**Ngày:** 30/09/2026  
**Branch:** `TV5`  
**HEAD audit:** `61a2715 Merge remote-tracking branch 'origin/main' into TV5`

## 1. Phạm vi trách nhiệm

TV5 phụ trách:

- SRS
- Use Case
- Sequence Diagram
- Collaboration Diagram
- Class Diagram
- ERD documentation
- Traceability Matrix
- Cross-check tài liệu với code/API/database/test evidence

TV5 **không** sở hữu implementation backend/frontend/auth/database migration.

## 2. Snapshot code hiện tại

### Backend có implementation

- Listing/search/filter/detail.
- Vehicle service.
- Admin vehicle CRUD/status.
- Deposit create/confirm/receipt/my deposits.
- Appointment list/check-in.
- Admin ledger/refund.

Các class nghiệp vụ chính:

```text
Entity:
Vehicle, Listing, Source, Showroom, Deposit, Appointment, TransactionLedger

Controller:
ListingController
VehicleController
AdminVehicleController
DepositController
StaffAppointmentController
AdminLedgerController

Service:
ListingService
VehicleService
DepositService
AppointmentService
AdminLedgerService
```

### Backend chưa có

```text
AuthController / AuthService
Spring Security configuration/filter
JWT/session implementation
User/Role persistence model
OTP backend
```

Vì vậy TV5 không ghi Auth/RBAC là completed.

## 3. Database hiện tại

Migration V3 đã có:

```text
sources
vehicles
listings
showrooms
deposits
appointments
transaction_ledger
```

Trạng thái:

```text
Vehicle      = AVAILABLE / HOLD / RESERVED / SOLD
Deposit      = PENDING / DEPOSITED / CANCELLED / REFUNDED
Appointment  = PENDING / COMPLETED / CANCELLED
```

**Mismatch:** `database/schema/schema.sql` vẫn chỉ là v2.0.1 với 3 bảng `sources/vehicles/listings`. TV5 không tự sửa; phải chuyển issue cho TV3.

## 4. Automated tests đã thấy

```text
backend/src/test/java/com/system/controller/ListingControllerIntegrationTest.java
backend/src/test/java/com/system/controller/VehicleControllerIntegrationTest.java
backend/src/test/java/com/system/dto/ListingDtoMappingTest.java
backend/src/test/java/com/system/service/ListingServiceTest.java
backend/src/test/java/com/system/specification/ListingSpecificationTest.java
```

Chưa thấy automated test tương ứng cho deposit, appointment, ledger, auth/security.

## 5. Tình trạng tài liệu TV5 trước khi đồng bộ

| File | Tình trạng trước sync | Quyết định |
|---|---|---|
| `docs/SRS/SRS.md` | Chỉ là scope ngắn, thiếu FR/status/API | **REPLACE** |
| `docs/UML/README.md` | README cũ | **REPLACE** |
| `docs/UML/Use_Case.md` | Có nhiều UC nhưng state cũ và status cũ | **REPLACE** |
| `docs/UML/Class_Diagram.md` | Chủ yếu model Increment 2, thiếu Deposit/Appointment/Ledger/Showroom | **REPLACE** |
| `docs/UML/Sequence_Diagrams.md` | Diagram lỗi format + nhiều flow pending dù code đã có | **REPLACE** |
| `docs/UML/Collaboration_Diagrams.md` | Placeholder | **REPLACE** |
| `docs/UML/Traceability_Matrix.md` | Mapping cũ, nhiều endpoint/status cũ | **REPLACE** |
| `docs/Database/ERD/ERD.md` | Chỉ có 3 bảng | **REPLACE** |
| `docs/Members/report/TV5_Baocaotiendo.md` | Chứa nhận định stale, đặc biệt Deposit/Auth/Appointment | **REPLACE** |

## 6. Những gì TV5 phải làm

### Priority 1 — bắt buộc

1. Đồng bộ SRS với stack + FR hiện tại.
2. Đổi toàn bộ state cũ `PENDING_PAYMENT/RELEASED/SCHEDULED` sang state thật trong code.
3. Cập nhật Use Case 01–15 với status thực tế.
4. Viết lại Sequence cho 7 flow đã có code.
5. Viết Collaboration cho deposit/appointment/refund.
6. Cập nhật Class Diagram với 7 entity + service/controller/repository thực tế.
7. Cập nhật ERD lên 7 bảng theo V3 migration và đánh dấu bootstrap mismatch.
8. Cập nhật Traceability FR→UC→API→Test/Evidence.
9. Viết lại report để phản ánh đúng snapshot 30/09/2026.

### Priority 2 — cross-team review

TV5 gửi các finding sau cho owner:

- **TV1:** API doc receipt/deposit/ledger có example chưa khớp code; kiểm tra delete vehicle 409; kiểm tra appointment date validation; kiểm tra status filter behavior.
- **TV2:** `depositApi.js` đang dùng endpoint khác backend (`/deposits/my-deposits`, `/appointments`, PATCH status). Cần sync contract.
- **TV3:** bootstrap `schema.sql` chưa gồm V3; import pipeline còn mô hình cũ.
- **TV4:** chưa có auth/security backend trong current branch.
- **TV2:** Test Plan đang đánh dấu nhiều case Pass nhưng repo chưa có backend test/evidence tương ứng.

## 7. Những gì KHÔNG phải việc TV5

- Không code Spring Security/JWT.
- Không code Deposit/Appointment.
- Không sửa React API.
- Không sửa migration/seed/schema để thay TV3.
- Không tạo fake test evidence.
- Không ghi chức năng là verified chỉ vì source có class.

## 8. Final Gate của TV5

### SRS

- [x] Đúng stack hiện tại.
- [x] Đúng P0/P1/P2/Removed.
- [x] Không còn ML/regression/valuation/recommendation/comparison trong current scope.
- [x] Status phân biệt implementation và verification.

### UML

- [x] Actor/use case khớp scope.
- [x] State khớp code/database.
- [x] Class diagram khớp class thực tế.
- [x] Sequence/Collaboration khớp endpoint và service flow.

### Traceability

- [x] FR → UC → API → Test/Evidence.
- [x] PENDING/PARTIAL được ghi rõ.
- [x] Không invent auth implementation.

### Cross-team

- [ ] TV1 sync API contract response.
- [ ] TV2 sync frontend endpoints.
- [ ] TV3 sync clean-bootstrap schema.
- [ ] TV4 deliver auth/security backend.
- [ ] TV2 replace unsupported test Pass claims by real evidence.

## 9. Kết luận

TV5 hiện không cần viết thêm backend code. Việc cần làm là **đồng bộ toàn bộ tài liệu và diagram với implementation thật**, sau đó ghi rõ các phần còn thiếu/ lệch thuộc owner nào.

Bộ tài liệu cập nhật ngày 30/09/2026 phải được xem là bản làm việc mới của TV5; các report/diagram cũ không được dùng làm source-of-truth nếu còn khác code hiện tại.
