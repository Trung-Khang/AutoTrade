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

## Tài khoản demo

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| ADMIN | `admin` | `AutoTrade@Admin2026` |
| STAFF | `staff` | `AutoTrade@Staff2026` |
| CUSTOMER | `customer` | `AutoTrade@Customer2026` |

Ba tài khoản trên thuộc seed chính thức của `autotrade_final`. Nếu cả ba cùng
không đăng nhập được hoặc trả lỗi `500`, kiểm tra máy TV3, Radmin VPN và kết nối
database trước khi kết luận tài khoản sai.

OTP được gửi qua email đã đăng ký. Nếu chưa thấy email, kiểm tra cả Inbox và
Spam. Luồng quên mật khẩu yêu cầu username và gửi OTP tới email liên kết với
username đó.

Không chạy schema, migration hoặc seed trên `autotrade_final` từ máy thành viên.
