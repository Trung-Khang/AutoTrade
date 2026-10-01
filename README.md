# AutoTrade - Hệ thống quản lý kinh doanh ô tô đã qua sử dụng

Đồ án cuối kỳ môn Công nghệ phần mềm - HCMUTE.

## Môi trường và khởi động local

Mỗi thành viên cần cài Java JDK 17, Maven 3.9 trở lên, Node.js 20 trở lên,
PostgreSQL 17 và Git. Backend là Spring Boot/Maven, Frontend là React/Vite,
database là PostgreSQL; không cần chạy external Tomcat để phát triển local.

Kiểm tra môi trường trong PowerShell:

```powershell
java -version
mvn -version
node --version
npm --version
psql --version
Test-NetConnection localhost -Port 5432
```

Maven phải hiển thị Java 17. Nếu máy dùng đường dẫn workspace có tiếng Việt và
Maven báo lỗi encoding, đặt thêm biến sau trong terminal đang chạy Backend:

```powershell
$env:JAVA_TOOL_OPTIONS = '-Dfile.encoding=UTF-8'
```

### Chuẩn bị PostgreSQL lần đầu

Database local tên `used_car_db` phải dùng encoding **UTF8**. TV3 quản lý
schema/migration chính thức. Chỉ tạo database khi nó chưa tồn tại:

```powershell
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE used_car_db WITH ENCODING 'UTF8' TEMPLATE template0;"
```

Khi bootstrap một database development mới, chạy theo thứ tự:

```powershell
psql -h localhost -p 5432 -U postgres -d used_car_db -f database/schema/schema.sql
psql -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_0__showroom_deposit_appointment.sql
psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_1__archive_inventory_boundary.sql
psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_2__deposit_integrity.sql
psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_3__appointment_ledger_integrity.sql
psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_4__auth_and_otp.sql
psql -X -v ON_ERROR_STOP=1 -h localhost -p 5432 -U postgres -d used_car_db -f database/migrations/V3_0_5__auth_identity_integrity.sql
```

> Cảnh báo: `database/schema/schema.sql` là bootstrap/reset và có `DROP TABLE`.
> Không chạy file này trên database đã có dữ liệu cần giữ.

Sau migration, seed showroom và auth theo [hướng dẫn TV3](database/guides/Auth_Identity_Integration.md); credential demo chỉ qua environment. V2_0_1 không chạy sau clean schema.

### Mở Backend

Mở PowerShell thứ nhất tại thư mục dự án. Cấu hình thông tin database từ môi
trường local của bạn, không ghi password/SMTP App Password vào source hoặc Git.
`JWT_SECRET` dưới đây được tạo ngẫu nhiên cho phiên chạy local hiện tại.

Nếu máy đã lưu cấu hình Gmail SMTP trong Tomcat `setenv.bat`, phải nạp các biến
đó vào chính PowerShell chạy `java -jar`. Chạy đoạn sau trước khi build/start;
đoạn lệnh không in SMTP password ra màn hình:

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

Thành viên không có file trên phải tự cấu hình các biến `SMTP_*` bằng Gmail và
App Password của mình. Chỉ chạy được Backend không có nghĩa SMTP đã được cấu
hình; API đăng ký sẽ trả `emailSent=false` khi thiếu biến SMTP.

```powershell
cd backend
$env:DB_HOST = 'localhost'
$env:DB_PORT = '5432'
$env:DB_NAME = 'used_car_db'
$env:DB_USERNAME = 'postgres'
$env:DB_PASSWORD = Read-Host 'Nhập DB_PASSWORD'
$env:DB_SSLMODE = 'disable'
$bytes = [byte[]]::new(48)
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
$env:JAVA_TOOL_OPTIONS = '-Dfile.encoding=UTF-8'
mvn clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.war
```

Backend chạy tại `http://localhost:8080`. Muốn gửi/xác minh OTP email, cấu hình
thêm các biến `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`,
`SMTP_FROM`, `SMTP_STARTTLS` và tùy chọn `SMTP_FROM_NAME=AutoTrade` theo hướng
dẫn [backend/README.md](backend/README.md). Không chia sẻ các secret này trong
chat hoặc commit chúng vào repository.

### Mở Frontend

Mở PowerShell thứ hai tại thư mục dự án:

```powershell
cd frontend
npm install
npm run dev
```

## Chạy thử giao diện và API

- Giao diện web: [http://127.0.0.1:5173/login](http://127.0.0.1:5173/login)
- Swagger API: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

Swagger là giao diện tài liệu và kiểm thử API của Backend. Công cụ này giúp xem
toàn bộ endpoint như `/auth/login`, `/auth/register`, `/vehicles`; request/
response mẫu; field bắt buộc; mã lỗi; và gửi request trực tiếp mà không cần giao
diện React. Swagger hữu ích khi demo hoặc kiểm thử phân quyền JWT, `401`,
`403`, đăng ký và OTP. Mở Swagger UI, chọn API rồi bấm **Try it out** để nhập
JSON và gửi thử.

## Tài khoản demo

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| `ADMIN` | `admin` | `AutoTrade@Admin2026` |
| `STAFF` | `staff` | `AutoTrade@Staff2026` |
| `CUSTOMER` | `customer` | `AutoTrade@Customer2026` |

## Kiểm thử OTP qua email

1. Mở trang `/register` và đăng ký bằng một email bạn có thể truy cập.
2. Mở hộp thư, lấy mã OTP sáu chữ số rồi nhập ở trang xác minh.
3. Sau khi xác minh thành công, đăng nhập bằng tài khoản vừa tạo.
4. Tại trang đăng nhập, chọn **Quên mật khẩu?** để kiểm thử OTP đặt lại mật khẩu.

Lưu ý: mã OTP có hiệu lực năm phút, chỉ dùng một lần và gửi lại phải chờ 60 giây.
