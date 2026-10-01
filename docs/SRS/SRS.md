# Software Requirements Specification (SRS)

## 1. Thông tin tài liệu

- **Đề tài:** Xây dựng hệ thống quản lý kinh doanh ô tô đã qua sử dụng
- **Ngày đồng bộ:** 01/10/2026
- **Scope:** Workflow 4 — Increment hiện tại
- **Owner:** TV5
- **Nguồn đối chiếu:** backend source, frontend source, PostgreSQL migrations, TV4 handoff/report và test files hiện có.

## 2. Mục tiêu

Hệ thống hỗ trợ tra cứu xe và quy trình showroom gồm quản lý xe, đặt cọc giả lập, lịch hẹn, khóa xe khi cọc, ledger/hoàn cọc và xác thực tài khoản.

Stack hiện tại:

- Backend: Spring Boot + Spring Data JPA + Spring Security
- Database: PostgreSQL
- Frontend: React + Vite
- API prefix: `/api/v1`
- Authentication: JWT Bearer
- OTP: six-digit SecureRandom, SHA-256 hash, Gmail SMTP khi được cấu hình

Không đưa ML/regression/R Plumber/valuation/recommendation/comparison/payment thật vào scope hiện hành.

## 3. Actor

| Actor | Nhu cầu/quyền | Hiện trạng |
|---|---|---|
| Guest | browse/search/detail, register, verify email, forgot password | Có UI/API tương ứng; auth flows có code |
| CUSTOMER | login, deposit, appointment, my deposits | Có auth/RBAC; ownership deposit cần re-check qua JWT |
| STAFF | xem lịch hẹn, check-in | Có API/UI; security matcher có |
| ADMIN | CRUD/status xe, ledger/refund | Có API/UI; `/admin/**` được bảo vệ |
| System | JWT, OTP, QR/reference, state transition, transaction | Có implementation phân tán qua security/auth/business services |

## 4. Functional Requirements

### FR-01 — Đăng ký tài khoản

`POST /api/v1/auth/register` tạo user role `CUSTOMER`, lưu BCrypt hash và phát OTP xác minh email.

**Status:** IMPLEMENTED. Runtime/browser E2E còn cần evidence đầy đủ.

### FR-02 — Đăng nhập và RBAC

`POST /api/v1/auth/login` nhận `usernameOrEmail` + `password`, trả JWT và thông tin user. Security matcher bảo vệ API theo role.

**Status:** IMPLEMENTED; runtime smoke được TV4 báo PASS, security regression ngày 3 còn mở.

### FR-03 — Quên mật khẩu/OTP

`POST /forgot-password` gửi OTP theo email; `POST /verify-reset-otp` cấp reset token; `POST /reset-password` đổi mật khẩu bằng reset token.

OTP có lifetime 5 phút, resend cooldown 60 giây, tối đa 5 lần sai và single-use; không trả OTP qua API.

**Status:** IMPLEMENTED; boundary/E2E regression còn cần evidence đầy đủ.

### FR-04 — Tìm kiếm/lọc xe

`GET /api/v1/vehicles` và `GET /api/v1/listings` hỗ trợ paging/filter; `ListingSpecification` thực hiện filter.

**Status:** IMPLEMENTED; có test code listing/specification.

### FR-05 — Xem chi tiết

`GET /api/v1/vehicles/{id}` và `GET /api/v1/listings/{id}` tồn tại. Lưu ý `/vehicles/{id}` hiện map qua `ListingService`, nên API doc cần mô tả đúng semantics.

**Status:** IMPLEMENTED.

### FR-06 — Yêu thích

Không tìm thấy backend model/API.

**Status:** PENDING.

### FR-07 — Tạo đặt cọc + lịch hẹn

`POST /api/v1/deposits` tạo Deposit `PENDING`, Appointment `PENDING`, QR giả lập và có tùy chọn `hasTestDrive`.

**Status:** PARTIAL — implementation có, nhưng controller hiện vẫn nhận `X-User-Id`; validation ngày hẹn quá khứ chưa được enforce trong service.

### FR-08 — Xác nhận cọc giả lập

`POST /api/v1/deposits/{id}/confirm` đổi xe `AVAILABLE -> HOLD`, cọc `PENDING -> DEPOSITED`, tạo receipt/contract và ledger.

**Status:** PARTIAL — implementation + unit test có; ownership current-user chưa được truyền vào confirm service.

### FR-09 — Chống cọc trùng

`VehicleRepository.updateVehicleStatusIfAvailable()` thực hiện atomic update; V3_0_2 có unique index cho `DEPOSITED` theo xe.

**Status:** IMPLEMENTED; full concurrent HTTP evidence chưa có trong repository snapshot.

### FR-10 — Biên lai

`GET /api/v1/deposits/{id}/receipt` trả receipt/contract data.

**Status:** PARTIAL — code có nhưng ownership và API contract phải sync.

### FR-11 — Liên hệ

UI/contact yêu cầu cơ bản; chưa có backend contract riêng.

**Status:** PENDING/P2.

### FR-12 — Staff appointment

`GET /api/v1/staff/appointments`, `PUT /api/v1/staff/appointments/{id}/check-in`.

**Status:** IMPLEMENTED; test HTTP/security regression còn cần hoàn thiện.

### FR-13 — Admin vehicle CRUD/status

`POST/PUT/PATCH/DELETE /api/v1/admin/vehicles/**` có implementation và security matcher.

**Status:** PARTIAL — delete service chưa có guard 409 như mô tả trong API spec; PATCH CORS cần bổ sung.

### FR-14 — Admin ledger/refund

`GET /api/v1/admin/ledger`, `POST /api/v1/admin/ledger/{depositId}/refund`.

**Status:** PARTIAL — implementation có; automated HTTP evidence và API examples cần sync.

### FR-15 — Account/profile/statistics

Chưa thấy backend endpoint/model tương ứng ngoài current-user.

**Status:** PENDING.

## 5. Business Rules

1. Chỉ vehicle `AVAILABLE` mới được create/confirm deposit thành công theo business service.
2. Confirm dùng atomic update `AVAILABLE -> HOLD` trong transaction.
3. Nếu atomic update trả 0 row, deposit được chuyển `CANCELLED` và conflict 409 được trả về.
4. Deposit: `PENDING -> DEPOSITED -> REFUNDED` hoặc `CANCELLED`.
5. Appointment: `PENDING -> COMPLETED` hoặc `CANCELLED`.
6. Vehicle: `AVAILABLE`, `HOLD`, `RESERVED`, `SOLD`; database migration V3_0_1 còn có `ARCHIVED` cho marketplace configurations không gắn showroom.
7. `deposit_code` unique.
8. QR là mô phỏng, không có payment gateway thật.
9. `hasTestDrive` là boolean trên Appointment, không phải workflow độc lập.
10. JWT là nguồn identity chính thức theo security contract; `X-User-Id` còn sót trong controller là mismatch cần owner sửa.

## 6. Non-Functional Requirements

| ID | Yêu cầu | Status |
|---|---|---|
| NFR-01 | Search/filter phản hồi phù hợp trong demo bình thường | IMPLEMENTED/needs runtime benchmark |
| NFR-02 | Deposit/vehicle transition transaction-safe | IMPLEMENTED in service |
| NFR-03 | Authentication + password hashing + authorization | IMPLEMENTED; regression pending |
| NFR-04 | Responsive React | IMPLEMENTED by UI; responsive evidence owned by TV2 |
| NFR-05 | Clean bootstrap + repeatable seed | PARTIAL — migration chain có nhưng bootstrap chưa gộp |

## 7. Phạm vi loại bỏ

- Machine Learning / Regression / R Plumber
- Automatic valuation
- Recommendation
- Comparison
- Real payment gateway
- Shopping cart
- Standalone test-drive workflow

## 8. Traceability status rule

- `IMPLEMENTED`: source implementation tồn tại.
- `PARTIAL`: source có nhưng còn security/contract/validation/evidence gap.
- `VERIFIED`: có execution evidence thật được chỉ rõ nguồn.
- `PENDING`: chưa có implementation tương ứng.

Không chuyển `IMPLEMENTED` thành `VERIFIED` chỉ dựa vào việc class/endpoint tồn tại.
