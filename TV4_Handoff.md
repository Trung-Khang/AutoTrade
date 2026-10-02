# BIÊN BẢN BÀN GIAO TV4 - AUTH, JWT, RBAC VÀ OTP

Ngày cập nhật: 01/10/2026

Người bàn giao: TV4

Đề tài: Xây dựng hệ thống quản lý kinh doanh ô tô đã qua sử dụng

Baseline tài liệu: `origin/main` tại `efe2349` (PR #30 của TV3 đã merge)

> Biên bản mô tả contract và kết quả đã kiểm tra. Các thay đổi local chưa commit
> chỉ được xem là bản đang kiểm thử, chưa phải bàn giao chính thức cho thành viên
> khác cho đến khi được review và đưa lên repository.

## 1. Phạm vi TV4 đã bàn giao

- Đăng ký CUSTOMER và xác minh email bằng OTP.
- Đăng nhập bằng username hoặc email; mật khẩu lưu BCrypt.
- JWT Bearer, current-user và xử lý `401 Unauthorized`/`403 Forbidden`.
- Phân quyền `CUSTOMER`, `STAFF`, `ADMIN` tại Backend.
- Quên mật khẩu, xác minh OTP reset và đặt mật khẩu mới.
- Tích hợp identity từ JWT cho API đặt cọc; không nhận `X-User-Id` từ client.
- SMTP Gmail dùng biến môi trường; không hard-code hoặc bàn giao App Password.

TV4 không sở hữu CRUD xe, state machine đặt cọc/lịch hẹn, migration database
chính thức, giao diện tổng thể hoặc UML.

## 2. Auth API contract

Base URL: `/api/v1/auth`

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `POST` | `/register` | Public | Tạo CUSTOMER chưa xác minh và gửi OTP |
| `POST` | `/verify-email` | Public | Xác minh OTP đăng ký |
| `POST` | `/resend-verification` | Public | Gửi lại OTP sau cooldown |
| `POST` | `/login` | Public | Nhận JWT sau khi kiểm tra account |
| `POST` | `/logout` | Authenticated | Client xóa JWT; Backend stateless |
| `GET` | `/me` | Authenticated | Lấy current user từ JWT |
| `POST` | `/forgot-password` | Public | Gửi OTP reset với thông báo chống dò email |
| `POST` | `/verify-reset-otp` | Public | Xác minh OTP và cấp reset token ngắn hạn |
| `POST` | `/reset-password` | Public | Đặt mật khẩu mới bằng reset token |

Các endpoint gửi email giữ nguyên response:

```text
MessageResponse(message, emailSent, retryAfterSeconds)
```

`emailSent=true` nghĩa là Backend đã gửi thành công tới SMTP. Giá trị này không
cam kết thư nằm trong Inbox; người dùng phải kiểm tra cả Spam/Thư rác.

Header cho endpoint cần đăng nhập:

```http
Authorization: Bearer <access-token>
```

Không gửi user ID bằng header hoặc request body để thay thế identity trong JWT.

### Contract quên mật khẩu

`POST /forgot-password` nhận username, không nhận một email do người dùng tự
nhập. Khi username hợp lệ, OTP được gửi tới email đã liên kết với chính account
đó; message chỉ hiển thị email đã che bớt. Điều này ngăn việc dùng username của
người A với email của người B để reset nhầm account.

```json
{ "username": "customer" }
```

`POST /verify-reset-otp` nhận `{ "username": "customer", "code": "123456" }`.
`POST /reset-password` vẫn nhận `resetToken`, `newPassword` và
`confirmPassword`.

## 3. Ma trận phân quyền đã khóa

| Phạm vi | Quyền |
|---|---|
| `GET /api/v1/vehicles/**`, `GET /api/v1/listings/**` | Public |
| `POST /api/v1/deposits` | CUSTOMER |
| `GET /api/v1/deposits/my` | CUSTOMER |
| `POST /api/v1/deposits/{id}/confirm` | CUSTOMER và phải đúng owner |
| `GET /api/v1/deposits/{id}/receipt` | CUSTOMER và phải đúng owner |
| `GET`, `PUT /api/v1/staff/appointments/**` | STAFF |
| `/api/v1/admin/**` | ADMIN |
| Mutate vehicle/listing | ADMIN |

Role không kế thừa ngầm: ADMIN không tự động được gọi endpoint CUSTOMER và
STAFF nếu matcher không cho phép rõ ràng.

## 4. Quy tắc OTP và account

- OTP gồm sáu chữ số, chỉ lưu SHA-256 hash.
- OTP hết hạn sau 5 phút, cooldown gửi lại 60 giây và chỉ dùng một lần.
- Tối đa 5 lần nhập sai; OTP mới vô hiệu OTP cũ cùng user và purpose.
- User đăng ký có role `CUSTOMER`, chưa được đăng nhập trước khi xác minh email.
- Forgot-password không tiết lộ email có tồn tại hay không.
- Reset token không được đặt trong URL hoặc localStorage và không được dùng lại.
- Đặt lại mật khẩu không tự mở khóa account bị khóa.

## 5. Chính sách mật khẩu bắt buộc

- Áp dụng tại Backend cho cả `POST /register` và `POST /reset-password`; UI chỉ
  là hỗ trợ phản hồi sớm, không phải lớp bảo vệ duy nhất.
- Có tối thiểu 8 ký tự, một chữ hoa, chữ thường, chữ số và ký tự đặc biệt thuộc
  `@#$%^&+=!`.
- `confirmPassword` phải trùng `password`/`newPassword`. Reset cũng không được
  dùng lại mật khẩu hiện tại.
- Không lưu, log hoặc bàn giao plaintext password. Mật khẩu tiếp tục hash BCrypt.

## 6. Trạng thái SMTP thực tế

- Gmail SMTP, STARTTLS port 587 và App Password từ environment đang hoạt động.
- Tên gửi hiển thị là AutoTrade; subject đăng ký/reset đúng thương hiệu.
- Kiểm thử chẩn đoán: 9/9 submissions được Gmail SMTP chấp nhận cho ba mailbox.
- TV4 đã chạy thành công hai browser flow:
  - đăng ký → nhận OTP → xác minh → đăng nhập;
  - quên mật khẩu → nhận OTP → đặt mật khẩu mới.
- Một số email nằm trong Spam do gửi kiểm thử lặp lại nhiều lần. Đây không phải
  lỗi JWT, API, OTP hoặc PostgreSQL.
- Quyết định: không refactor thêm SMTP/OTP chỉ để tác động bộ lọc Spam.

## 7. Bàn giao cho TV1

1. Lấy identity bằng `SecurityUtils.currentUser().id()`; không dùng
   `X-User-Id` hoặc user ID do frontend tự gửi.
2. Giữ ownership check cho deposit/appointment của CUSTOMER.
3. Khi thêm endpoint authenticated mới, báo TV4 để bổ sung matcher và test
   `401/403`; không dựa riêng vào việc ẩn nút ở frontend.
4. Giữ transaction, trạng thái xe và chống đặt cọc trùng thuộc phạm vi TV1.
5. Regression bắt buộc: CUSTOMER chỉ đọc/thao tác deposit của chính mình.

## 8. Bàn giao cho TV2

1. Lưu JWT theo contract hiện tại và gắn `Authorization: Bearer ...` qua API
   client; không tạo mock token hoặc mock role.
2. Khi `401`, xóa phiên local và chuyển về đăng nhập; khi `403`, hiển thị lỗi
   không đủ quyền, không tự đổi role.
3. Register/Verify/Forgot phải dùng đúng `message`, `emailSent` và
   `retryAfterSeconds`; không hard-code kết quả gửi mail.
4. Trên trang Verify Email và Forgot Password, bổ sung hướng dẫn ngắn:
   “Nếu chưa thấy email, vui lòng kiểm tra mục Spam/Thư rác.”
5. Test loading, cooldown, OTP sai/hết hạn/dùng lại và mất kết nối Backend.
6. Lưu screenshot/test evidence cho cả Inbox hoặc Spam, không công bố
   production delivery chỉ từ `emailSent=true`.
7. Register gửi đủ `password` và `confirmPassword`; không bỏ qua trạng thái
   disabled/checklist. Reset password dùng `newPassword` và `confirmPassword`.

## 9. Xác nhận với TV3

- Database acceptance của TV3 đã PASS trên PostgreSQL 18.6, database
  `autotrade_final`, theo `database/guides/Final_Acceptance_Handoff.md`.
- Schema auth chính thức nằm trong `V3_0_4__auth_and_otp.sql` và
  `V3_0_5__auth_identity_integrity.sql`.
- Thứ tự clean bootstrap: `schema.sql` → `V3_0_0` ... `V3_0_5` → showroom
  seed → auth seed.
- `app_users.id` là `BIGINT`/Java `Long`; FK nghiệp vụ dùng cùng kiểu.
- `auth_otps` và `password_reset_sessions` thuộc contract đã khóa.
- Không cần migration mới cho việc email vào Spam.
- TV4 không yêu cầu outbox, async worker hoặc thay đổi bảng trước Final Gate.
- Secret SMTP/JWT chỉ đi qua environment, không nằm trong seed hoặc SQL.
- TV4 chưa chạy Hibernate validate/auth browser flow trên `autotrade_final` vì
  instance TV3 mới cho loopback; chờ TV3 cấp route VPN/tunnel giới hạn theo IP.

## 10. Bàn giao cho TV5

- UML/SRS dùng đúng ba role và auth endpoint ở biên bản này.
- Sequence OTP phải thể hiện SMTP submission và người dùng nhập OTP; không mô
  tả hệ thống kiểm soát được Inbox/Spam của nhà cung cấp email.
- Deposit sequence lấy current user từ JWT, không dùng header identity giả.
- Không thêm class/outbox/migration chưa tồn tại vào sơ đồ chính thức.

## 11. Bằng chứng và việc còn lại

| Hạng mục | Trạng thái |
|---|---|
| Unit test email/transaction OTP | PASS 7/7 |
| SMTP diagnostic | PASS 9/9 submissions; inbox placement do provider |
| Browser register/verify/login | PASS thủ công bởi TV4 |
| Browser forgot/reset/login mới | PASS thủ công bởi TV4 |
| Frontend production build | PASS, 135 modules |
| Full regression sau merge mới nhất | PENDING Final Gate |
| TV2 Test Report và screenshot | PENDING |
| JWT expiry/account lock/role bypass matrix cuối | PENDING Ngày 3 |
| Password policy unit regression | PASS 9/9 selected tests |

## 12. Known limitations

- Gmail hoặc mail trường có thể đưa OTP vào Spam, đặc biệt khi gửi thử liên tục.
- `POST /logout` là logout stateless; client phải xóa token.
- Demo account chỉ tồn tại sau khi chạy auth seed đúng hướng dẫn TV3.
- Không đánh dấu PASS cho clean bootstrap/full regression cho đến khi chạy lại
  trên database chính thức sau code freeze.

## 13. Checklist bên nhận

- [ ] TV1 xác nhận không dùng identity do client tự khai.
- [ ] TV2 xác nhận mapping JWT, `MessageResponse` và cảnh báo kiểm tra Spam.
- [ ] TV3 xác nhận bootstrap/seed V3.0.5 không đổi.
- [ ] TV5 đồng bộ UML/SRS với contract thật.
- [ ] Cả nhóm chạy Final Gate và lưu bằng chứng thực tế.
