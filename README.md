# AutoTrade - Hệ thống quản lý kinh doanh ô tô đã qua sử dụng

Đồ án cuối kỳ môn Công nghệ phần mềm - HCMUTE.

AutoTrade gồm Backend Spring Boot, Frontend React/Vite và PostgreSQL. Hệ thống hỗ trợ showroom xe, tài khoản JWT theo vai trò `CUSTOMER`/`STAFF`/`ADMIN`, đăng ký và OTP email, đặt lại mật khẩu, đặt cọc giả lập, lịch hẹn và các màn hình quản trị tối thiểu.

## Môi trường cần có

- Java JDK 17
- Maven 3.9 trở lên, chạy bằng Java 17
- Node.js 20 trở lên và npm
- PostgreSQL 17 trở lên
- Git

Kiểm tra trong PowerShell:

```powershell
java -version
mvn -version
node --version
npm --version
psql --version
Test-NetConnection localhost -Port 5432
```

`mvn -version` phải hiển thị Java 17. Nếu workspace có đường dẫn tiếng Việt và Maven báo lỗi encoding, đặt biến sau trong terminal chạy Backend:

```powershell
$env:JAVA_TOOL_OPTIONS = '-Dfile.encoding=UTF-8'
```

## Database

Database tích hợp chính thức là `autotrade_final` do TV3 quản lý. Thành viên phải join cùng mạng Radmin VPN và chỉ dùng cấu hình sau. Từ máy thành viên, **không chạy** `schema.sql`, migration, seed hoặc acceptance runner trên database này.

```powershell
$env:DB_HOST = '26.181.182.25'
$env:DB_PORT = '5432'
$env:DB_NAME = 'autotrade_final'
$env:DB_USERNAME = 'autotrade_app'
$env:DB_PASSWORD = Read-Host 'Nhập DB_PASSWORD'
$env:HIBERNATE_DDL_AUTO = 'validate'
```

Trước khi chạy Backend, xác nhận kết nối Radmin và PostgreSQL. Nhập mật khẩu của
`autotrade_app` do TV3 cấp tại prompt, không nhập mật khẩu PostgreSQL local:

```powershell
Test-NetConnection 26.181.182.25 -Port 5432
psql -X -W -h 26.181.182.25 -p 5432 -U autotrade_app -d autotrade_final `
  -v ON_ERROR_STOP=1 -c "SELECT current_database(), current_user, version();"
```

Expected: `TcpTestSucceeded : True`, database `autotrade_final`, user
`autotrade_app` và PostgreSQL 18.6.

`used_car_db` chỉ là database local lịch sử/isolated. Không dùng nó khi kiểm thử
tích hợp hoặc báo PASS hệ thống.

### Chỉ bootstrap database local mới (không áp dụng integration)

Chỉ thực hiện phần này khi `used_car_db` chưa tồn tại hoặc là database local mới hoàn toàn. `database/schema/schema.sql` có `DROP TABLE`, nên tuyệt đối không chạy trên database có dữ liệu cần giữ.

```powershell
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE used_car_db WITH ENCODING 'UTF8' TEMPLATE template0;"

psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/schema/schema.sql
psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_0__showroom_deposit_appointment.sql
psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_1__archive_inventory_boundary.sql
psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_2__deposit_integrity.sql
psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_3__appointment_ledger_integrity.sql
psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_4__auth_and_otp.sql
psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_5__auth_identity_integrity.sql
```

Hướng dẫn seed showroom và tài khoản demo nằm trong [database/guides/Auth_Identity_Integration.md](database/guides/Auth_Identity_Integration.md). Không tự ghi hoặc chia sẻ password/hash seed trong Git.

## Chạy Backend

Mở PowerShell thứ nhất tại **đúng thư mục repository hiện tại**. Không chạy backend từ một bản sao cũ như `C:\AutoTrade`, vì frontend có thể kết nối nhầm backend/database đang chiếm cổng `8080`.

Nếu máy đã có cấu hình SMTP trong `C:\apache-tomcat-11.0.25\bin\setenv.bat`, nạp riêng các biến `SMTP_*` vào terminal hiện tại. Lệnh dưới đây không in SMTP password ra màn hình:

```powershell
$tomcatSetenv = 'C:\apache-tomcat-11.0.25\bin\setenv.bat'
if (Test-Path $tomcatSetenv) {
  cmd /c "call `"$tomcatSetenv`" >nul && set" | ForEach-Object {
    if ($_ -match '^(SMTP_[A-Z_]+)=(.*)$') {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
  }
}
```

Chạy integration với database chung TV3:

```powershell
cd backend
$env:DB_HOST = '26.181.182.25'
$env:DB_PORT = '5432'
$env:DB_NAME = 'autotrade_final'
$env:DB_USERNAME = 'autotrade_app'
$secureDbPassword = Read-Host 'Nhập DB_PASSWORD của autotrade_app' -AsSecureString
$dbPasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureDbPassword)
try {
  $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($dbPasswordPointer)
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($dbPasswordPointer)
}
$env:DB_SSLMODE = 'disable'
$env:HIBERNATE_DDL_AUTO = 'validate'
$bytes = New-Object byte[] 48
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
$env:JAVA_TOOL_OPTIONS = '-Dfile.encoding=UTF-8'

mvn clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.war
```

Backend dùng embedded Spring Boot server tại `http://localhost:8080`; không cần khởi động external Tomcat. Giữ `HIBERNATE_DDL_AUTO=validate`. Chỉ tiếp tục test API khi log có `Started BackendApplication` và không có Hibernate validation error. Mở trực tiếp URL gốc có thể trả `401 Unauthorized`, đó là hành vi bình thường của Spring Security.

Các biến SMTP cần có để gửi OTP thật là `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_STARTTLS` và tùy chọn `SMTP_FROM_NAME=AutoTrade`. Xem thêm [backend/README.md](backend/README.md). Không commit hoặc gửi các secret này qua chat.

## Chạy Frontend

Mở PowerShell thứ hai từ đúng repository đang chạy Backend:

```powershell
cd frontend
npm install
npm run dev
```

Mở giao diện tại [http://localhost:5173/](http://localhost:5173/). Nếu trang trắng hoặc dữ liệu không khớp, kiểm tra xem cổng `5173`/`8080` có đang bị một process từ thư mục khác chiếm không:

```powershell
Get-NetTCPConnection -LocalPort 5173,8080 -State Listen -ErrorAction SilentlyContinue |
  Select-Object LocalPort, OwningProcess
```

Dừng đúng terminal/process cũ, sau đó chạy lại Backend và Frontend từ repository này. Không tạo hoặc dùng một thư mục `C:\AutoTrade` độc lập để chạy Vite.

## Kiểm tra API và các luồng chính

- Giao diện: [http://localhost:5173/login](http://localhost:5173/login)
- Swagger API: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

Swagger là giao diện tài liệu và kiểm thử API. Dùng **Try it out** để gửi request trực tiếp, xem payload/response và kiểm tra các mã lỗi `401`/`403` mà không cần đi qua React.

Các endpoint xác thực hiện có:

- `POST /api/v1/auth/register`, `/verify-email`, `/resend-verification`
- `POST /api/v1/auth/login`, `/logout`, `GET /api/v1/auth/me`
- `POST /api/v1/auth/forgot-password`, `/verify-reset-otp`, `/reset-password`

Kiểm thử OTP theo thứ tự: đăng ký → kiểm tra Inbox và **Spam/Thư rác** → xác minh OTP → đăng nhập → quên mật khẩu → xác minh OTP → đặt mật khẩu khác mật khẩu cũ → đăng nhập lại. OTP có sáu chữ số, hết hạn sau năm phút, dùng một lần; gửi lại OTP phải chờ cooldown. `emailSent=true` chỉ xác nhận SMTP đã nhận yêu cầu gửi, không bảo đảm email xuất hiện ở Inbox.

## Phân quyền

- `CUSTOMER`: xem xe và thực hiện các luồng đặt cọc của khách hàng.
- `STAFF`: xem/check-in lịch hẹn.
- `ADMIN`: quản lý xe và xem/hoàn tiền ledger theo endpoint quản trị.

Backend lấy danh tính từ JWT Bearer token, không nhận `X-User-Id` do client tự gửi. Role không kế thừa ngầm: endpoint yêu cầu role nào phải đăng nhập bằng role đó.
