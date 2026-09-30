# BÁO CÁO TIẾN ĐỘ — TV5

**Audit date:** 01/10/2026
**Branch snapshot:** `TV5`
**Role:** UML, SRS, ERD documentation and traceability

## 1. Kết luận hiện tại

TV5 không cần implementation code. Công việc hiện tại là **đồng bộ tài liệu với implementation thật** và chuyển các mismatch kỹ thuật sang đúng owner.

Điểm thay đổi lớn nhất so với report cũ: **Auth/JWT/RBAC/OTP đã tồn tại trong backend**, vì vậy không được tiếp tục ghi Auth là `PENDING` do “chưa có backend”.

## 2. Audit implementation thực tế

### Backend

Đã thấy implementation cho:

- Listing/search/filter/detail
- Vehicle/Admin vehicle CRUD/status
- Deposit create/confirm/receipt/my deposits
- Appointment list/check-in
- Admin ledger/refund
- Auth register/verify/resend/login/logout/current-user/forgot/reset
- JWT filter/service
- BCrypt password hashing
- OTP hash + Gmail mail service
- REST 401/403 handlers

### Database

Migrations hiện có:

```text
V3_0_0__showroom_deposit_appointment.sql
V3_0_1__archive_inventory_boundary.sql
V3_0_2__deposit_integrity.sql
V3_0_3__appointment_ledger_integrity.sql
V3_0_4__auth_and_otp.sql
```

`schema.sql` vẫn là bootstrap v2.0.1 cho `sources/vehicles/listings`, nên clean bootstrap hiện hành chưa được gộp thành một file duy nhất.

### Frontend

Đã có:

- AuthProvider + token persistence + `/auth/me` restore
- ProtectedRoute theo role
- Login/Register/Verify Email/Forgot Password
- Showroom/Vehicle detail
- Deposit/Admin/Staff pages

Nhưng vẫn còn LocalStorage/mock fallback ở service layer; đây là dependency của TV2, không phải việc TV5 sửa trực tiếp.

## 3. Những gì TV5 đã chốt trong đợt này

### SRS

- Đồng bộ stack thành Spring Boot + Spring Security + React + PostgreSQL.
- Đưa Auth/JWT/OTP vào scope đã implement.
- Đổi status về vocabulary thật.
- Phân biệt `IMPLEMENTED`, `PARTIAL`, `VERIFIED`, `PENDING`.
- Ghi rõ ownership/security gap cho deposit.

### UML

- Use Case: 15 UC, bổ sung Auth/OTP/reset flow.
- Sequence: Login, Register/Verify, Reset, Search, Deposit, Staff, Refund, Security boundary.
- Collaboration: Auth, Deposit, Staff, Refund.
- Class Diagram: thêm AppUser/AuthOtp/PasswordResetSession và security classes thực tế.

### ERD/Data Dictionary

- Bổ sung 3 bảng auth.
- Giữ đúng physical FK hiện có.
- Không vẽ `deposits.user_id` hoặc `appointments.user_id` thành FK khi migration chưa có FK.
- Ghi rõ `schema.sql` chưa phải full runtime bootstrap.

### Traceability

- FR-01..03 không còn PENDING vì “chưa có auth”.
- FR-07/08/10/12/13/14 giữ PARTIAL khi còn contract/security/evidence gap.
- VERIFIED chỉ dùng khi có evidence execution rõ nguồn.

## 4. Các mismatch TV5 phát hiện

| ID | Finding | Owner | TV5 xử lý |
|---|---|---|---|
| F-01 | Deposit create/my còn `X-User-Id`; confirm/receipt chưa current-user ownership | TV4 + TV1 | Ghi mismatch, giữ status PARTIAL |
| F-02 | Official API Auth spec còn login email, `demoOtp`, reset 1-step/90s | TV1 + TV4 | Không sửa API doc trong branch TV5 |
| F-03 | `schema.sql` chưa gồm V3/Auth | TV3 | ERD/Data Dictionary ghi bootstrap gap |
| F-04 | `vehicleApi.js`/`depositApi.js` có mock/LocalStorage fallback | TV2 | Ghi dependency |
| F-05 | CORS chưa liệt kê PATCH | TV1/TV4 | Ghi dependency trước Gate 2 |
| F-06 | Test Plan có PASS claims rộng | TV2 | Traceability không tự chuyển PASS thành VERIFIED |

## 5. Evidence hiện có

TV4 report ghi nhận:

- Backend build PASS.
- Frontend build PASS.
- AuthSecurityUnitTest 2/2 PASS.
- Full Maven test 22/22 PASS trên PostgreSQL thật.
- Runtime API/JWT/RBAC smoke PASS.
- Gmail OTP PASS.

Các test file Auth/Deposit hiện có:

```text
AuthSecurityUnitTest
AuthServiceResetPasswordTest
OtpMailServiceTest
DepositServiceUnitTest
```

Trong môi trường audit hiện tại, Maven không thể rerun vì wrapper cần tải Maven và dependency nhưng môi trường review không tải được Maven Central. Do đó các kết quả trên được ghi là **reported evidence từ TV4**, không phải independent rerun.

## 6. Việc còn lại của TV5 trước Final Gate

1. Commit bộ tài liệu thay thế trong ZIP.
2. Sau khi owner trả lời F-01..F-06, cập nhật traceability/status lần cuối.
3. Lấy test evidence thật từ TV2/TV4/TV3 rồi nâng `VERIFIED` cho các FR đủ bằng chứng.
4. Chốt SRS/UML/ERD lần cuối sau khi clean-bootstrap và current-user contract được sửa.

## 7. Tiêu chí hoàn thành TV5

- [x] SRS đúng stack và scope.
- [x] Use Case đúng actor/role/state.
- [x] Sequence/Collaboration bám class/method hiện tại.
- [x] Class Diagram có Auth/security thật.
- [x] ERD có V3 + Auth.
- [x] Traceability FR → UC → API → Test/Evidence.
- [x] Không invent Auth implementation.
- [ ] Owner đã xử lý mismatch security/API/bootstrap.
- [ ] Final evidence đã được TV2 tổng hợp.
