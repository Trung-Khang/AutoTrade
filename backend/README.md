## TV3 consolidated schema

Apply official V3_0_0..5 after clean schema.sql; existing V3_0_4 requires only V3_0_5. Keep `HIBERNATE_DDL_AUTO=validate`. See database/guides/Auth_Identity_Integration.md. OTP DB regression fixtures do not prove real SMTP delivery.

# AutoTrade Backend

## Xác thực và phân quyền

Backend dùng Spring Security, JWT và PostgreSQL. Áp dụng migration
`database/migrations/V3_0_4__auth_and_otp.sql` sau `V3_0_3` trước khi đặt
`spring.jpa.hibernate.ddl-auto=validate`.

Các endpoint công khai nằm dưới `/api/v1/auth`:

- `POST /register`, `POST /verify-email`, `POST /resend-verification`
- `POST /login`, `POST /logout`, `GET /me`
- `POST /forgot-password`, `POST /verify-reset-otp`, `POST /reset-password`

Access token là JWT Bearer. API xe đọc công khai; API cọc yêu cầu `CUSTOMER`,
API staff yêu cầu `STAFF`, và API admin yêu cầu `ADMIN`. Các role không kế thừa
ngầm. Backend lấy danh tính từ JWT, không nhận `X-User-Id` từ client.

## Cấu hình môi trường

Không commit password, OTP hoặc SMTP App Password. External Tomcat nạp biến
môi trường qua `C:\apache-tomcat-11.0.25\bin\setenv.bat`; file này đã được kiểm
tra theo tên biến, không đọc hay ghi giá trị credential.

Biến cần có: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`,
`JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`,
`SMTP_FROM`, `SMTP_STARTTLS`, và tùy chọn `SMTP_FROM_NAME=AutoTrade`.

`DB_SSLMODE` mặc định là `disable` cho PostgreSQL local; đặt thành mode phù hợp
khi dùng database có SSL.

`JWT_SECRET` phải là chuỗi Base64 sinh ngẫu nhiên từ tối thiểu 32 byte. Nó không
có default trong source. Gmail gửi bằng địa chỉ đã cấu hình ở `SMTP_FROM`; tên
hiển thị mặc định là **AutoTrade**. Các tiêu đề email là:

- `[AUTOTRADE] Mã xác nhận tạo tài khoản`
- `[AUTOTRADE] Mã xác nhận đặt lại mật khẩu`

Nếu SMTP lỗi, tài khoản/OTP vẫn được lưu nhưng chưa xác minh sẽ không đăng
nhập được. Người dùng có thể gửi lại OTP sau 60 giây.

Khi SMTP gửi thành công, Gmail hoặc mail trường vẫn có thể phân loại OTP vào
Spam, nhất là khi kiểm thử gửi lặp lại. `emailSent=true` chỉ xác nhận SMTP đã
nhận yêu cầu gửi; người kiểm thử cần kiểm tra Inbox và Spam. Không thay đổi
JWT, OTP hoặc database chỉ để xử lý việc phân loại thư của nhà cung cấp.

## Quy tắc OTP

- Sáu chữ số từ `SecureRandom`, chỉ lưu SHA-256 hash.
- Hết hạn sau 5 phút, dùng một lần, tối đa năm lần nhập sai.
- OTP mới làm OTP cũ cùng user và purpose hết hiệu lực.
- Reset token chỉ trả về sau khi OTP reset hợp lệ; frontend giữ trong memory,
  không đặt trên URL hoặc localStorage.

## Build và deploy

```powershell
cd backend
mvn package -DskipTests
```

Artifact WAR ở `backend/target/backend-0.0.1-SNAPSHOT.war` có thể deploy vào
external Tomcat. Sau khi đã chạy migration và cấu hình biến môi trường, restart
Tomcat để nạp `setenv.bat`. Không sửa hoặc commit `setenv.bat` từ repository.
