## Consolidation chính thức TV3 — 01/10/2026

Baseline: `origin/main` tại `cb2c520`; checkout `AutoTrade-TV3` là worktree branch `TV3` (cùng repository với `AutoTrade`). Lịch sử TV3 `5ba28b9` đã là ancestor của main; fast-forward giữ nguyên commit cũ. Auth TV4 `48c8f88` đã merge upstream, không copy Backend/Frontend cũ từ AutoTrade-main. Không có AGENTS.md trong ba checkout hoặc các thư mục cha đã kiểm tra.

Thứ tự bootstrap mới: **schema.sql → V3_0_0 → V3_0_1 → V3_0_2 → V3_0_3 → V3_0_4 → V3_0_5 → showroom seed → auth seed**. `V2_0_1` chỉ upgrade v2.0.0, không replay sau clean schema. Existing V3_0_4 chỉ chạy `V3_0_5__auth_identity_integrity.sql` sau preflight/backup riêng. Không chạy schema/reset/seed lên database shared/audit. Repository hiện chạy migration bằng psql, chưa cấu hình Flyway; migration mới là SQL PostgreSQL thuần, không có psql include, có BEGIN/COMMIT và locks.

V3_0_4 và các migration cũ giữ nguyên. V3_0_5 kiểm tra exact 29 columns/types/defaults/nullability, từ chối incompatible schema, invalid/duplicate identities và orphan trước khi thêm integrity; không sửa/xóa rows hoặc tạo user vá dữ liệu. Giữ OTP/reset CASCADE, reset UNIQUE, OTP index `idx_auth_otps_active_lookup`; thêm username/email LOWER UNIQUE và business user RESTRICT. Chỉ bỏ ordinary `idx_password_reset_sessions_token` sau khi xác nhận đúng định nghĩa V3_0_4. Thêm CHECK required identity (email hợp lệ, full_name/password_hash không trống), username và normalized email; không thêm lifecycle trigger hoặc time-based CHECK.

Demo accounts `customer/staff/admin` chỉ local, hash BCrypt cost12 truyền qua environment; seed từ chối collision, không overwrite password/role/state. Operator phải cấp credential/hash riêng qua kênh riêng; random credential dùng trong verification không phải credential bàn giao. Schema giữ một role/user, không có staff-showroom. Soft disable bảo toàn lịch sử.

Auth fix: lưu failed OTP attempt/expiry invalidation qua cả hai transaction boundaries, khóa user khi verify để serial hóa với resend và ngăn dùng OTP đồng thời. Email normalization dùng Locale.ROOT; length validation khớp DB. Race đăng ký trả 409 cho identity UNIQUE thay vì 500. SMTP_FROM lấy từ SMTP_USERNAME nếu không được cấu hình riêng; không hard-code địa chỉ gửi hoặc secrets.

Evidence mới cho official sequence: `database/evidence/official_20261001_030621_7a31e3/`. Các bằng chứng candidate nhập dưới `database/evidence/historical/` chỉ có giá trị lịch sử. Những mô tả pending/candidate ở phần lịch sử phía dưới đã được supersede bởi mục này; không dùng candidate để bootstrap chính thức.

Dependency còn thiếu: **SMTP_USERNAME, SMTP_PASSWORD**, mailbox access/recipient để kiểm chứng nhận OTP thật. Host/port default smtp.gmail.com:587 STARTTLS; SMTP_FROM fallback SMTP_USERNAME. Activation email receipt → verify delivered OTP → login → /auth/me và real reset email: **NOT RUN**. Không fake delivery, không lộ OTP, không bypass verification. Không tuyên bố TV3/Gate2 đã hoàn tất toàn bộ.

## Lịch sử thiết kế/bàn giao (giữ nguyên nội dung nguồn)

# BIÊN BẢN BÀN GIAO CÔNG VIỆC — TV4 (CUỐI NGÀY 2)

## Đề tài: Hệ thống quản lý kinh doanh ô tô đã qua sử dụng

- Người bàn giao: TV4 — Backend xác thực và phân quyền.
- Phạm vi: Auth, JWT, RBAC, OTP email, current-user contract và tích hợp quyền tối thiểu với API cọc.
- Auth Contract: `docs/API/API_Specification_Official_v3.md`, mục **Auth Contract v3.1.0**.
- Trạng thái: TV4/leader đã khóa kỹ thuật; đã phản hồi dependency Database của TV3 sau PR #25, tiếp tục chờ TV1/TV2 xác nhận tích hợp và TV3 bàn giao migration/seed auth chính thức.

## 1. Tổng quan đã hoàn thành

- Đăng ký, xác minh email OTP, đăng nhập, đăng xuất, quên và đặt lại mật khẩu.
- Mật khẩu BCrypt strength 12; không lưu plaintext.
- JWT Bearer stateless; token chứa user ID, username và role.
- Current user lấy từ JWT, không còn dùng `X-User-Id` từ browser.
- Role: `CUSTOMER`, `STAFF`, `ADMIN`.
- OTP Gmail sáu số từ `SecureRandom`, hash SHA-256, hết hạn năm phút, cooldown 60 giây, tối đa năm lần sai, single-use.
- SMTP Gmail đã test gửi thật; không dùng OTP demo 90 giây và không trả OTP qua API.
- Response lỗi JSON thống nhất cho `400`, `401`, `403`, `409`, `429`, `500`.
- CORS local cho `localhost:5173` và `127.0.0.1:5173`.
- API cọc create/my/confirm/receipt lấy identity từ JWT; confirm và receipt đã kiểm tra ownership.
- Migration auth hiện có: `database/migrations/V3_0_1__auth_and_otp.sql`.

## 2. Contract chính thức cần dùng

### 2.1. Bearer token và current user

Sau login, frontend gửi token ở mọi API cần quyền:

```http
Authorization: Bearer <jwt_token>
```

`GET /api/v1/auth/me` trả `id`, `username`, `fullName`, `email`, `role`.
Backend nghiệp vụ dùng `SecurityUtils.currentUser()` để lấy identity, không tự
parse JWT và không nhận `X-User-Id`.

### 2.2. Ma trận quyền đã khóa

| Nhóm endpoint | Quyền |
|---|---|
| `GET /api/v1/vehicles/**`, `GET /api/v1/listings/**` | Public |
| `GET /api/v1/auth/me`, `POST /api/v1/auth/logout` | Authenticated |
| `POST /api/v1/deposits`, `POST /api/v1/deposits/{id}/confirm`, `GET /api/v1/deposits/{id}/receipt`, `GET /api/v1/deposits/my` | CUSTOMER |
| `GET/PUT /api/v1/staff/appointments/**` | STAFF |
| `/api/v1/admin/**` và vehicle/listing mutation ngoài admin namespace | ADMIN |

Role không tự động kế thừa endpoint của role khác. Ví dụ ADMIN dùng API quản trị
`/api/v1/admin/**`, không gọi API CUSTOMER để xác nhận cọc.

### 2.3. Auth endpoint

| Endpoint | Request chính |
|---|---|
| `POST /api/v1/auth/register` | `username`, `fullName`, `email`, `phone`, `password` |
| `POST /api/v1/auth/verify-email` | `email`, `code` |
| `POST /api/v1/auth/resend-verification` | `email` |
| `POST /api/v1/auth/login` | `usernameOrEmail`, `password` |
| `POST /api/v1/auth/forgot-password` | `email` |
| `POST /api/v1/auth/verify-reset-otp` | `email`, `code` |
| `POST /api/v1/auth/reset-password` | `resetToken`, `newPassword`, `confirmPassword` |

Chi tiết response/error nằm trong API Specification v3.1.0. Không dùng payload
Auth cũ có `demoOtp`, `X-User-Id`, `email` thay cho `usernameOrEmail`, hoặc
reset password một bước.

## 3. Bàn giao cho TV1 — Backend nghiệp vụ

1. Dùng `SecurityUtils.currentUser()` hoặc contract current-user của TV4; không tự parse JWT và không dùng `X-User-Id`.
2. Giữ kiểm tra ownership cho mọi resource của CUSTOMER, đặc biệt deposit và appointment. TV4 đã bảo vệ confirm/receipt cọc hiện có; endpoint nghiệp vụ mới phải được kiểm tra tương tự.
3. Dùng `/api/v1/admin/**` cho thao tác quản trị. Không đưa quyền quản trị đi vòng qua API CUSTOMER/STAFF.
4. Báo TV4 trước khi thêm endpoint cần xác thực để bổ sung RBAC matcher và test `401/403`.
5. Không đổi role enum, Auth payload hoặc error contract mà không cập nhật Auth Contract.
6. Xác nhận Auth Contract v3.1.0 và ownership endpoint trước Gate 2.

## 4. Bàn giao cho TV2 — Frontend và Test Lead

1. Login gửi `usernameOrEmail`, `password`; lưu token và tự gắn Bearer token bằng Axios.
2. Sau reload, gọi `/api/v1/auth/me` để khôi phục current user; logout phải xóa token local.
3. Dùng đúng payload register, verify email, forgot/reset password trong Auth Contract v3.1.0.
4. Xử lý `401`, `403`, `409`, `429` bằng error state rõ ràng; không hard-code kết quả nghiệp vụ.
5. Điều hướng/ẩn chức năng theo `CUSTOMER`, `STAFF`, `ADMIN`, nhưng Backend vẫn là nơi quyết định quyền cuối cùng.
6. Không dùng mock auth, token giả, `X-User-Id`, demo OTP hoặc hiển thị/log OTP.
7. Thu thập screenshot/evidence browser cho login, register, verify OTP, forgot/reset và sai role.
8. Xác nhận payload/response/token/error mapping trước Gate 2.

## 5. Bàn giao cho TV3 — Database và dữ liệu

1. Không tích hợp file nháp `V3_0_1__auth_and_otp.sql` dưới tên hiện tại vì PR #25 đã có migration chính thức `V3_0_1` đến `V3_0_3`. TV3 tạo migration auth additive ở version tiếp theo chưa sử dụng, dự kiến `V3_0_4`, và cập nhật thứ tự bootstrap.
2. Database development phải có encoding UTF-8.
3. Tạo seed idempotent cho ba account local `CUSTOMER`, `STAFF`, `ADMIN`; password phải là BCrypt, không plaintext.
4. Seed phải đặt đúng `role`, `active`, `email_verified`, `locked`; tài khoản demo chỉ dành cho local/demo, không dùng production.
5. Giữ FK `auth_otps.user_id` và `password_reset_sessions.user_id`, không lưu OTP/password raw.
6. Bổ sung FK từ `deposits.user_id` và `appointments.user_id` đến `app_users.id` sau preflight orphan; dùng `ON DELETE RESTRICT` để bảo toàn lịch sử nghiệp vụ.
7. Xác nhận schema user/role/seed tương thích Auth Contract v3.1.0 và mục 5A dưới đây.

## 5A. TV4 xác nhận yêu cầu phối hợp của TV3 sau PR #25

### 5A.1. Phạm vi PR #25 đã được TV4 ghi nhận

- Commit merge đã đối chiếu: `b53b07f`, PR #25 `feat(db): add TV3 deposit appointment and ledger integrity`.
- TV4 ghi nhận V3_0_2 đã bổ sung ràng buộc tiền cọc dương và chống hai deposit `DEPOSITED` cho cùng xe.
- TV4 ghi nhận V3_0_3 giữ status appointment `PENDING/COMPLETED/CANCELLED`, bổ sung CHECK cho ledger và index phục vụ truy vấn appointment.
- Nhận định của TV3 rằng repository chưa có users/roles là đúng tại mốc PR #25: source/migration auth của TV4 hiện vẫn là thay đổi local chưa tracked. Database local của TV4 có `app_users` để kiểm thử runtime, nhưng không được dùng làm bằng chứng rằng clean bootstrap chính thức đã có auth schema.
- Các migration và evidence của TV3 không thay thế kiểm thử RBAC/current-user end-to-end của TV4/TV1.

### 5A.2. Identity contract v3.1.0 bàn giao cho TV3

| Nội dung TV3 yêu cầu | TV4 xác nhận chính thức | Yêu cầu Database |
|---|---|---|
| Identity | Cho phép đăng nhập bằng `username` hoặc `email`. `username`, `email`, `password_hash`, `full_name` bắt buộc; `phone` nullable. Username được trim, dài 3-50 và chỉ gồm chữ, số, `.`, `_`, `-`. Email được trim và chuyển lowercase trước khi lưu. | `username VARCHAR(50)`, `email VARCHAR(254)`, `password_hash VARCHAR(100)`, `full_name VARCHAR(120)`, `phone VARCHAR(30)`. Thêm UNIQUE không phân biệt hoa thường trên `LOWER(username)` và `LOWER(email)` để bảo vệ cả trường hợp request đồng thời. |
| Password hash | Spring Security `BCryptPasswordEncoder(12)`. Backend chỉ đọc BCrypt hash, không lưu mật khẩu thô. | `password_hash VARCHAR(100) NOT NULL`; seed chỉ chứa BCrypt hash tương thích cost 12. |
| Role/cardinality | Mỗi user có đúng một role: `CUSTOMER`, `STAFF` hoặc `ADMIN`. Authority runtime là `ROLE_CUSTOMER`, `ROLE_STAFF`, `ROLE_ADMIN`. | Dùng một cột `role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER'` với CHECK ba giá trị; chưa cần bảng nối nhiều role. |
| Trạng thái tài khoản | `active=true`, `email_verified=false`, `locked=false` khi khách tự đăng ký. Login chỉ thành công khi active, đã xác minh email và không locked. Account demo đã sẵn sàng đăng nhập phải có `email_verified=true`. | Ba cột BOOLEAN NOT NULL với default tương ứng; giữ CHECK/NOT NULL qua migration và seed. |
| STAFF và showroom | Scope hiện tại chưa có quan hệ staff-showroom. STAFF dùng role để truy cập API lịch hẹn chung; Backend chưa đọc `showroom_id` từ user. | Không thêm `showroom_id` vào `app_users` trong migration auth hiện tại. Chỉ bổ sung sau khi TV1 chốt nghiệp vụ phân công nhân viên theo showroom. |
| PK/current-user | `app_users.id` là `BIGSERIAL/BIGINT`, ánh xạ Java `Long`. JWT dùng ID này làm subject; `SecurityUtils.currentUser()` trả principal chứa `id`. TV1 dùng ID từ JWT làm `deposits.user_id` và `appointments.user_id`. | Hai cột nghiệp vụ giữ `BIGINT`; thêm FK sau preflight orphan, không tạo user giả để vá dữ liệu. |
| Xóa tài khoản | Với tài khoản đã có deposit/appointment, dùng soft disable bằng `active=false` hoặc `locked=true`; không hard-delete lịch sử người dùng. OTP và reset session là dữ liệu tạm, có thể cascade khi một tài khoản chưa có lịch sử nghiệp vụ được xóa có kiểm soát. | `deposits.user_id` và `appointments.user_id` dùng `ON DELETE RESTRICT`; `auth_otps.user_id` và `password_reset_sessions.user_id` dùng `ON DELETE CASCADE`. |
| Account demo | Ba username local là `customer`, `staff`, `admin`, mỗi account mang role tương ứng; `active=true`, `email_verified=true`, `locked=false`. | Seed phải idempotent và chứa BCrypt hash. Không ghi mật khẩu thô vào migration, log hoặc báo cáo bàn giao. |

### 5A.3. Việc TV3 thực hiện tiếp

1. Preflight dữ liệu `deposits.user_id` và `appointments.user_id`; báo orphan trước khi thêm FK, không tự xóa hoặc tạo fake user.
2. Tạo migration additive auth ở version tiếp theo chưa sử dụng. Không sửa hoặc đổi nội dung các migration V3_0_1 đến V3_0_3 đã merge/applied.
3. Tạo `app_users`, `auth_otps`, `password_reset_sessions`, index/constraint và hai FK nghiệp vụ theo contract trên.
4. Tạo seed demo idempotent bằng BCrypt hash, chạy lặp không sinh tài khoản trùng.
5. Test bootstrap sạch, migration upgrade, UNIQUE không phân biệt hoa thường, CHECK role, FK/RESTRICT/CASCADE, seed lặp và rollback.
6. Cập nhật Data Dictionary, schema README, ERD với TV5 và bàn giao migration/seed/test evidence cho TV1/TV4/TV2.

### 5A.4. Bàn giao tiếp cho TV1 và TV2

**TV1 cần chốt với TV3:**

- Giữ `user_id` lấy từ JWT cho deposit/appointment và kiểm tra ownership; không nhận ID do client tự khai.
- Thống nhất `PENDING` hay `SCHEDULED` cho appointment. Code/schema hiện dùng `PENDING`; trước khi có quyết định mới, TV4 xác nhận RBAC không phụ thuộc tên status này.
- Chốt validation ngày hẹn tương lai, ledger lifecycle/dấu tiền còn mở và callback/reference idempotency để TV3 biết có cần constraint bổ sung.
- Review chính sách `ON DELETE RESTRICT` và soft disable tài khoản vì đây là contract xuyên Auth và nghiệp vụ.

**TV2 cần nhận từ TV3/TV4:**

- Dùng ba account demo sau khi TV3 seed chính thức; không tự tạo mock account/token.
- Test đăng nhập theo role, reload `/auth/me`, `401/403`, CUSTOMER xem deposit của mình và STAFF xem appointment theo API thật.
- Ghi evidence migration/seed version được dùng trong lần system test; không đánh dấu PASS nếu DB chưa chạy migration auth chính thức.

## 6. Chuyển sang Ngày 3

- Automated security test suite cho JWT expiry, token malformed, role bypass và account state.
- Integration test locked/inactive/unverified user.
- OTP wrong/expired/reuse/max attempts/cooldown boundary.
- Reset token expiry, reuse và cross-account.
- Evidence test do TV2 tổng hợp; TV4 cung cấp security evidence.
- TV5 rà lại UML/traceability theo endpoint và role đã khóa.

## 7. Checklist xác nhận

| Thành viên | Nội dung cần xác nhận | Trạng thái |
|---|---|---|
| TV1 | Current-user, ownership deposit/appointment và RBAC endpoint | CHỜ XÁC NHẬN |
| TV2 | Payload/response/token/error mapping và UI role flow | CHỜ XÁC NHẬN |
| TV3 | TV4 đã bàn giao identity contract; TV3 tạo migration auth version mới, FK và seed idempotent | ĐÃ PHẢN HỒI TV3 — CHỜ TV3 TRIỂN KHAI |
