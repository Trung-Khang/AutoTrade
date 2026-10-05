# AutoTrade

Hệ thống quản lý kinh doanh ô tô đã qua sử dụng, sử dụng Spring Boot, React/Vite
và PostgreSQL.

## Yêu cầu

- Java JDK 17
- Maven 3.9+
- Node.js 20+ và npm
- Radmin VPN
- Quyền truy cập database và SMTP do nhóm cung cấp

## 1. Kết nối hệ thống

Kết nối vào mạng Radmin VPN của nhóm. Máy TV3 và PostgreSQL phải đang hoạt động.

Mở PowerShell tại thư mục gốc repository và nạp cấu hình SMTP đã lưu trên máy:

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

Không ghi password hoặc secret vào source và Git.

## 2. Chạy Backend

Tiếp tục trong cùng cửa sổ PowerShell:

```powershell
cd backend
$env:GEMINI_API_KEY = 'liên hệ leader để biết api key'
$env:GEMINI_MODEL = 'gemini-flash-latest'

$env:DB_HOST = '26.181.182.25'
$env:DB_PORT = '5432'
$env:DB_NAME = 'autotrade_final'
$env:DB_USERNAME = 'autotrade_app'
$securePassword = Read-Host 'Nhập DB_PASSWORD do TV3 cấp' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
$env:DB_SSLMODE = 'disable'
$env:HIBERNATE_DDL_AUTO = 'validate'
$bytes = New-Object byte[] 48
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
$env:JAVA_TOOL_OPTIONS = '-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8'

mvn clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.war
```

Giữ cửa sổ này đang chạy. Backend sẵn sàng khi log có
`Started BackendApplication`.

## 3. Chạy Frontend

Mở cửa sổ PowerShell thứ hai tại thư mục gốc repository:

```powershell
cd frontend
npm install
npm run dev
```

## Địa chỉ sử dụng

- Giao diện: [http://localhost:5173](http://localhost:5173)
- Đăng nhập: [http://localhost:5173/login](http://localhost:5173/login)
- Swagger: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

## Tài khoản demo & Chuyên viên Showroom

Tất cả các tài khoản quản trị và chuyên viên showroom nạp sẵn trong database `autotrade_final` đều sử dụng mật khẩu đăng nhập chuẩn: **`Password@123`**.

| STT | Vai trò (Role) | Tên đăng nhập | Email đăng nhập | Mật khẩu chuẩn | Chi nhánh Showroom | Họ và tên |
|:---:|:---|:---|:---|:---:|:---|:---|
| 1 | `ADMIN` | `admin` | `admin@example.test` | `Password@123` | Toàn hệ thống | Quản trị viên hệ thống |
| 2 | `STAFF` | `staff_hn_01` | `staff_hn1@autotrade.vn` | `Password@123` | Hà Nội - Cầu Giấy (ID 2) | Nguyễn Văn Tuấn (0912.345.601) |
| 3 | `STAFF` | `staff_hn_02` | `staff_hn2@autotrade.vn` | `Password@123` | Hà Nội - Cầu Giấy (ID 2) | Trần Thị Thu Hà (0912.345.602) |
| 4 | `STAFF` | `staff_hcm_01` | `staff_hcm1@autotrade.vn` | `Password@123` | Sài Gòn - Thủ Đức (ID 1) | Lê Hoàng Nam (0987.654.301) |
| 5 | `STAFF` | `staff_hcm_02` | `staff_hcm2@autotrade.vn` | `Password@123` | Sài Gòn - Thủ Đức (ID 1) | Phạm Minh Đức (0987.654.302) |
| 6 | `STAFF` | `staff_hcm_03` | `staff_hcm3@autotrade.vn` | `Password@123` | Sài Gòn - Thủ Đức (ID 1) | Đỗ Thùy Linh (0987.654.303) |
| 7 | `STAFF` | `staff_dn_01` | `staff_dn1@autotrade.vn` | `Password@123` | Đà Nẵng - Hải Châu (ID 3) | Võ Quốc Huy (0905.123.401) |
| 8 | `STAFF` | `staff_dn_02` | `staff_dn2@autotrade.vn` | `Password@123` | Đà Nẵng - Hải Châu (ID 3) | Ngô Bảo Trân (0905.123.402) |
| 9 | `CUSTOMER` | `customer` | `customer@example.test` | `Password@123` | Khách cá nhân | Khách hàng Demo |

Các tài khoản trên thuộc seed chính thức của `autotrade_final`. Nếu không đăng nhập được hoặc trả lỗi `500`, kiểm tra máy TV3, Radmin VPN và kết nối database trước khi kết luận tài khoản sai.

OTP được gửi qua email đã đăng ký. Nếu chưa thấy email, kiểm tra cả Inbox và
Spam. Luồng quên mật khẩu yêu cầu username và gửi OTP tới email liên kết với
username đó.

Mật khẩu khi đăng ký hoặc đặt lại phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ
thường, chữ số và một ký tự trong `@#$%^&+=!`. Backend luôn kiểm tra lại các
quy tắc này; không ghi hoặc log mật khẩu.

Không chạy schema, migration hoặc seed trên `autotrade_final` từ máy thành viên.
