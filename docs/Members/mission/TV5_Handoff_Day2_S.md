# TV5_Handoff.md — Bàn giao TV5 sau audit ngày 01/10/2026

## 0. Kết luận điều hành

TV5 **không cần viết Backend/Frontend/Database code** cho phần tài liệu hiện tại. Việc chính là đồng bộ SRS/UML/ERD/Traceability với source thật và ghi rõ các mismatch còn thuộc owner khác.

Snapshot hiện tại của repository cho thấy:

- Backend đã có Vehicle/Listings, Deposit/Appointment/Ledger và **Auth/JWT/RBAC/OTP**.
- Database đã có V3.0.0 → V3.0.3 và file auth `V3_0_4__auth_and_otp.sql`; tuy nhiên `database/schema/schema.sql` vẫn chỉ là bootstrap v2.0.1 nên chưa có một clean-bootstrap script duy nhất cho toàn hệ thống.
- Frontend đã có Auth UI + ProtectedRoute và gọi Bearer JWT, nhưng `vehicleApi.js`/`depositApi.js` vẫn còn LocalStorage/mock fallback; đây là việc TV2 cần dọn trước Gate 2 nếu P0 phải chạy bằng API thật.
- API specification chính thức vẫn còn nội dung Auth cũ (`X-User-Id`, `demoOtp`, request login bằng email) và cần TV1 đồng bộ theo implementation/TV4 contract.
- TV5 tài liệu cũ còn ghi Auth chưa implement; phải sửa toàn bộ chỗ này.

## 1. Trạng thái nhóm hiện tại

| Thành viên | Phần đã có | Còn mở / mismatch cần xử lý |
|---|---|---|
| TV1 | Vehicle/Listings, Deposit, Appointment, Ledger, atomic vehicle lock, controllers/services/repositories; test nghiệp vụ cọc | API contract cần đồng bộ với Auth v3.1; delete vehicle chưa có guard 409 như API doc; appointment filter có hành vi thực tế cần tài liệu đúng |
| TV2 | React routes/pages cho Guest/CUSTOMER/STAFF/ADMIN; Auth UI; Bearer interceptor; deposit/staff/admin UI | Còn mock/LocalStorage fallback trong `vehicleApi.js` và `depositApi.js`; một số route/contract frontend cần khớp backend |
| TV3 | Schema/migration V3_0_0..V3_0_3, seed demo, DB integrity audit; data pipeline và evidence | Clean bootstrap chưa gộp V3; auth migration/seed/FK user_id cần xác nhận lại theo Auth contract thực tế |
| TV4 | Spring Security, JWT, BCrypt, OTP Gmail, reset token, RBAC matcher, auth endpoints, auth migration; report ghi full Maven 22/22 và runtime smoke PASS | Regression Ngày 3 vẫn mở; **source hiện tại còn `X-User-Id` trong `DepositController` create/my và confirm/receipt chưa nhận current-user**, nên ownership contract cần re-check với TV1/TV4 |
| TV5 | Đã có bộ SRS/UML/ERD/Traceability nền | Cần thay thế tài liệu stale bằng bản trong ZIP này và ghi dependency/contract mismatch rõ ràng |

## 2. Việc TV5 phải làm ngay

### P0 — bắt buộc

1. Replace `docs/SRS/SRS.md` bằng bản đã đồng bộ Auth + trạng thái thật.
2. Replace `docs/UML/README.md`.
3. Replace `docs/UML/Use_Case.md` để có Login/Register/OTP/Reset và status đúng.
4. Replace `docs/UML/Sequence_Diagrams.md` để có Auth, deposit, staff, admin refund và ghi legacy `X-User-Id` là mismatch.
5. Replace `docs/UML/Collaboration_Diagrams.md`.
6. Replace `docs/UML/Class_Diagram.md` để thêm Auth/JWT/OTP/security classes thực tế.
7. Replace `docs/UML/Traceability_Matrix.md` với FR → UC → API → Test/Evidence → Status.
8. Replace `docs/Database/ERD/ERD.md` để thêm `app_users`, `auth_otps`, `password_reset_sessions` và mô tả đúng việc `deposits.user_id`/`appointments.user_id` hiện vẫn là scalar FK chưa gắn database FK.
9. Replace `docs/Database/Data_Dictionary.md` với bản phản ánh V3 + Auth và bootstrap gap.
10. Replace `docs/Members/report/TV5_Baocaotiendo.md` bằng báo cáo hiện hành.

### Không sửa bởi TV5

TV5 **không** tự sửa:

- `backend/**`
- `frontend/**`
- `database/migrations/**`
- `database/schema/schema.sql`
- `database/seed/**`
- `docs/API/API_Specification_Official_v3.md`
- `docs/Testing/Test_Plan.md`

Các mismatch ở trên phải được ghi trong handoff/traceability và trả về owner.

## 3. Findings phải bàn giao cho owner

### F-01 — Identity/ownership chưa khớp giữa report và source

`SecurityConfig` bảo vệ endpoint deposit bằng role `CUSTOMER`, nhưng `DepositController` hiện vẫn nhận `X-User-Id` cho `POST /api/v1/deposits` và `GET /api/v1/deposits/my`. `confirm` và `receipt` chỉ nhận `depositId`, source không truyền current user vào service để kiểm ownership.

**Owner:** TV4 + TV1.

**Yêu cầu:** dùng current user từ JWT cho create/my/confirm/receipt; không tin `X-User-Id` từ browser; test 401/403/ownership qua HTTP thật.

### F-02 — API Contract Auth còn stale

`docs/API/API_Specification_Official_v3.md` còn mô tả login bằng `email`, reset một bước bằng OTP và trả `demoOtp`/90 giây. Source hiện dùng `usernameOrEmail`, `verify-reset-otp`, reset token, OTP 5 phút và không trả OTP.

**Owner:** TV1, phối hợp TV4/TV5.

### F-03 — Clean bootstrap chưa thống nhất

`database/schema/schema.sql` mới tạo `sources/vehicles/listings`, trong khi runtime hiện cần V3 business tables và auth tables. Migration file có sẵn nhưng chưa được gộp thành một bootstrap script duy nhất.

**Owner:** TV3.

### F-04 — Frontend còn mock fallback

`frontend/src/services/vehicleApi.js` và `frontend/src/services/depositApi.js` còn LocalStorage fallback/mock data.

**Owner:** TV2.

### F-05 — CORS thiếu PATCH

`CorsConfig.allowedMethods(...)` không liệt kê `PATCH`, trong khi Admin Vehicle có `PATCH /api/v1/admin/vehicles/{id}/status`.

**Owner:** TV1/TV4.

### F-06 — Test Plan có PASS claims rộng hơn evidence hiện có

`docs/Testing/Test_Plan.md` có nhiều case ghi Pass, nhưng TV5 không được suy ra PASS chỉ từ source. Chỉ `VERIFIED` khi có execution evidence; test report phải ghi nguồn bằng chứng.

**Owner:** TV2; TV5 review traceability.

## 4. Cách dùng gói này

Bản ZIP đã chứa toàn bộ project và thay thế sẵn các file TV5 cần dùng. Copy đè các đường dẫn tương ứng vào branch `TV5`, sau đó commit riêng phần tài liệu.

### Commit đề xuất

```text
chore(docs): sync TV5 SRS UML ERD and traceability with current implementation
```

### Những file đã thay trong gói

```text
docs/SRS/SRS.md
docs/UML/README.md
docs/UML/Use_Case.md
docs/UML/Sequence_Diagrams.md
docs/UML/Collaboration_Diagrams.md
docs/UML/Class_Diagram.md
docs/UML/Traceability_Matrix.md
docs/Database/ERD/ERD.md
docs/Database/Data_Dictionary.md
docs/Members/report/TV5_Baocaotiendo.md
TV5_Handoff.md
```

## 5. Gate checklist của TV5

- [x] SRS không còn ghi Auth backend chưa implement.
- [x] UML có Auth/JWT/OTP/security classes thật.
- [x] State dùng `AVAILABLE/HOLD/RESERVED/SOLD`, `PENDING/DEPOSITED/CANCELLED/REFUNDED`, `PENDING/COMPLETED/CANCELLED`.
- [x] ERD có đủ business + auth tables theo các migration hiện có.
- [x] Traceability phân biệt `IMPLEMENTED`, `PARTIAL`, `VERIFIED`, `PENDING`.
- [x] Không tự xác nhận PASS cho test chưa có evidence.
- [ ] TV1 đồng bộ API Contract Auth và response examples.
- [ ] TV2 bỏ mock fallback khỏi P0 trước Gate 2.
- [ ] TV3 chốt clean-bootstrap V3 + auth.
- [ ] TV4/TV1 chốt current-user ownership thật sự qua JWT.
- [ ] TV2/TV4 hoàn tất regression security/E2E và lưu evidence.

## 6. Lưu ý audit

Trong môi trường review này không thể rerun Maven đầy đủ vì wrapper cần tải Maven từ Maven Central nhưng môi trường không có kết nối tải dependency. Vì vậy mọi `22/22 PASS` của TV4 được giữ dưới dạng **evidence do TV4 báo cáo**, không phải kết quả rerun độc lập của lần audit này.
