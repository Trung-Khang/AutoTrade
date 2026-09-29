# TV4 - Backend xác thực và phân quyền

## 1. Vai trò hiện tại

TV4 sở hữu authentication, user identity và authorization của Spring Boot. Mục tiêu là mọi endpoint có quyền đúng, mật khẩu an toàn và TV1 có thể lấy current user mà không tự xử lý security.

## 2. Phạm vi sở hữu

- Đăng ký, đăng nhập, đăng xuất, password hash và tài khoản khóa.
- JWT hoặc cơ chế xác thực phù hợp codebase, `CUSTOMER`, `STAFF`, `ADMIN`.
- Security filter/configuration, `401/403`, current-user contract.
- OTP/quên mật khẩu theo thời gian; fallback OTP demo có expiry nếu email chưa ổn.
- Unit/integration test authentication và authorization.

## 3. Không thuộc trách nhiệm

- Không tiếp tục phát triển Machine Learning, Regression, Plumber, Recommendation hoặc Comparison.
- Không sửa trực tiếp nghiệp vụ deposit/appointment/state của TV1.
- Không sở hữu migration/seed, frontend UI hay UML/SRS.

## 4. Ngày 1 - Auth lõi và contract

1. Chốt contract `/auth` với TV1/TV2/TV3: payload, error response, role và current-user API/interface.
2. Xây dựng password hash, login, token/session, Security config/filter và bảo vệ URL/API.
3. Cung cấp ba tài khoản demo CUSTOMER/STAFF/ADMIN phối hợp TV3 seed.
4. Bàn giao `/auth/login`, token use guide và kiểm tra `401/403` trước 15:00; hoàn thiện role protection trước 17:00.

## 5. Ngày 2 - Registration, OTP và hardening

1. Hoàn thiện register/logout, lock account và forgot-password/OTP khi P0 auth đã ổn.
2. Nếu email thực không ổn trước 11:00, dùng OTP demo có thời hạn, không công bố là email production.
3. Bảo vệ endpoint TV1 theo role/current user, review ownership integration và hỗ trợ TV2 mapping token.
4. Viết test token thiếu/sai/hết hạn, sai role, account lock, OTP sai/hết hạn/dùng lại.

## 6. Ngày 3 - Security test và release candidate

1. Code freeze auth; chỉ sửa security/authorization lỗi Critical/High.
2. Chạy test và test chéo: bypass role, password hash, session/token expiry, account lock, OTP expiry.
3. Bàn giao auth integration guide, test evidence và known limitations cho TV2/TV5.

## 7. Dependency

| Cần nhận | Từ ai | Thời điểm |
|---|---|---|
| User/role schema và seed | TV3 | Trước 12:00 Ngày 1 |
| Endpoint nghiệp vụ cần bảo vệ | TV1 | Ngày 1-2 |
| UI contract/error states | TV2 | Trước integration |
| FR/UC auth và acceptance | TV5 | Trước Gate 2 |

## 8. Bàn giao

- TV1: current-user/role interface và policy endpoint.
- TV2: login/register/error payload, token handling instructions và demo accounts.
- TV3: password format/role/lock fields cần migration.
- TV5: auth flow, state/error evidence và tên class thực tế cho UML.

## 9. Tiêu chí hoàn thành

- CUSTOMER, STAFF, ADMIN đăng nhập và chỉ truy cập đúng tài nguyên.
- Password không được lưu plaintext.
- Token thiếu/sai/hết hạn và role sai trả lỗi đúng; không bypass được endpoint.
- OTP fallback có hạn dùng rõ nếu áp dụng.

## 10. Kiểm thử phải thực hiện

- Login đúng/sai, duplicate registration, password hash, lock account.
- Token missing/malformed/expired; CUSTOMER gọi Staff/Admin API.
- OTP sai/hết hạn/dùng lại, reset password không hợp lệ.
- Test chéo deposit/Admin endpoint của TV1.

## 11. Rủi ro và cắt giảm

- Nếu mail service chặn tiến độ, chuyển OTP demo có expiry và ghi hạn chế.
- Không cắt password hash, role protection, `401/403` hoặc test bypass.
- Không nhận thêm chức năng ML hay payment.

## 12. Checklist cuối ngày

### Ngày 1
- [ ] Login, role protection và demo accounts chạy được.
- [ ] Current-user contract đã gửi TV1/TV2.

### Ngày 2
- [ ] Register/OTP/reset hoặc fallback được ghi rõ.
- [ ] Authorization tests đã chạy.

### Ngày 3
- [ ] Security evidence đã bàn giao.
- [ ] Không còn lỗi Critical/High auth mở.
