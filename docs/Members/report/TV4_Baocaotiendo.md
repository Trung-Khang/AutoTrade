# TV4 - Báo cáo tiến độ xác thực và phân quyền AutoTrade

Ngày cập nhật: 30/09/2026
Người phụ trách: TV4
Phạm vi: Authentication, identity, authorization và tích hợp UI xác thực theo `TV4.md` và `Workflow_4_Increment.md`.

## Phần I - Báo cáo chi tiết

### 1. Mục tiêu và phạm vi đã đối chiếu

TV4 chịu trách nhiệm cho luồng đăng ký, xác minh email OTP, đăng nhập, đăng xuất, quên/đặt lại mật khẩu, JWT, phân quyền `CUSTOMER`/`STAFF`/`ADMIN`, lỗi `401`/`403` và contract current user.

Không thuộc phạm vi TV4: CRUD xe, nghiệp vụ trạng thái deposit/appointment, migration/seed database chính thức, frontend tổng thể và UML/SRS. Machine Learning, Regression, Recommendation và Comparison đã loại khỏi phạm vi nộp AutoTrade.

### 2. Kết quả implementation

#### Backend

- Thêm Spring Security, Mail, Validation và JJWT vào Maven; đóng gói WAR để tương thích external Tomcat.
- Thêm `SecurityConfig`, JWT filter, authentication entry point và access-denied handler.
- API công khai: `POST /api/v1/auth/register`, `verify-email`, `resend-verification`, `login`, `forgot-password`, `verify-reset-otp`, `reset-password`; `GET /api/v1/auth/me` cần JWT.
- JWT chứa user ID, username và role; Backend tải lại user từ database trước khi xác thực request để account inactive, locked hoặc chưa xác minh không tiếp tục dùng token.
- Role policy đã khóa theo method/URL, không có kế thừa role ngầm:
  - `GET /api/v1/vehicles/**`, `GET /api/v1/listings/**` và các endpoint đăng ký/xác minh/login/reset OTP: công khai.
  - `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`: cần JWT hợp lệ.
  - `POST /api/v1/deposits`, `POST /api/v1/deposits/{id}/confirm`, `GET /api/v1/deposits/my`, `GET /api/v1/deposits/{id}/receipt`: chỉ `CUSTOMER`.
  - `GET`/`PUT /api/v1/staff/appointments/**`: chỉ `STAFF`.
  - `/api/v1/admin/**` và endpoint mutate xe/tin legacy: chỉ `ADMIN`.
- Bỏ tin cậy `X-User-Id` từ browser. Tất cả endpoint cọc do TV4 tích hợp (`create`, `my`, `confirm`, `receipt`) lấy identity từ JWT; `confirm` và `receipt` trả `403` khi deposit không thuộc current user.

#### User và OTP

- Migration `V3_0_4__auth_and_otp.sql` bổ sung `app_users`, `auth_otps`, `password_reset_sessions`.
- Username/email unique; user đăng ký có role `CUSTOMER`, `active=true`, `emailVerified=false`, `locked=false`.
- Mật khẩu lưu BCrypt strength 12, không plaintext.
- OTP gồm sáu chữ số từ `SecureRandom`, chỉ lưu SHA-256 hash; hết hạn năm phút, cooldown gửi lại 60 giây, tối đa năm lần sai, dùng một lần. OTP mới vô hiệu hóa OTP cũ cùng user và purpose.
- OTP đăng ký được tạo sau khi user đã lưu. Nếu SMTP lỗi, user vẫn tồn tại nhưng không đăng nhập đến khi xác minh; có thể gửi lại OTP.
- Quên mật khẩu trả cùng một thông điệp cho email tồn tại/không tồn tại. OTP reset gắn với đúng email/user/purpose. Sau khi xác minh, reset token ngắn hạn chỉ được trả một lần, giữ trong memory của trang và không ở URL/localStorage.
- Reset password không mở khóa account bị khóa và không tự đăng nhập.

#### SMTP và nhận diện thương hiệu

- SMTP đọc từ environment của Tomcat, không ghi App Password hoặc SMTP secret vào source, README hay report.
- `C:\apache-tomcat-11.0.25\bin\setenv.bat` chỉ được kiểm tra trạng thái: các biến SMTP bắt buộc đã có; không đọc, sửa hoặc commit file này.
- Tên hiển thị: `AutoTrade <trungkhang98pth@gmail.com>`.
- Tiêu đề: `[AUTOTRADE] Mã xác nhận tạo tài khoản` và `[AUTOTRADE] Mã xác nhận đặt lại mật khẩu`.
- Đã quét source không phân biệt hoa/thường: không còn nhận diện thương hiệu cũ trong source triển khai AutoTrade.

### 3. Đối chiếu với giao diện Login/Register

Đã đối chiếu với hai giao diện được cung cấp tại `/login` và `/register`.

| Hạng mục | Kết quả | Điều chỉnh đã thực hiện |
|---|---|---|
| Bố cục navbar, card, màu sắc, nút chính | Khớp | Giữ CSS/card và các route hiện có. |
| Tiêu đề Login | Khớp | Dùng `Đăng nhập` và mô tả `Hệ thống Quản lý Kinh doanh Ô tô AutoTrade`. |
| Placeholder Login | Khớp | Khôi phục gợi ý `VD: admin, staff, customer` và `Nhập mật khẩu...`. |
| Tiêu đề/Register fields | Khớp | Dùng `Đăng ký tài khoản`, đủ username, họ tên, email, điện thoại, password, confirm password. |
| Điện thoại bắt buộc | Khớp | UI và Backend đều bắt buộc, kiểm tra định dạng 8-30 ký tự số/ký tự điện thoại hợp lệ. |
| Mật khẩu | Đã làm rõ | UI hiển thị tối thiểu 8 ký tự, khớp validation Backend; không giữ nội dung cũ sáu ký tự. |
| Demo account box | Cố ý loại bỏ | Không còn mock login hoặc token giả. Seed account thật do TV3 chuẩn bị và chỉ hiển thị cho demo khi đã có dữ liệu thật. |
| Quên mật khẩu/OTP | Bổ sung | Login có link quên mật khẩu; có route xác minh email và đặt lại mật khẩu cùng style card hiện hữu. |

### 4. Kiểm thử và bằng chứng hiện có

| Kiểm tra | Trạng thái | Kết quả thực tế |
|---|---|---|
| Build Backend | PASS | `mvn package -DskipTests` tạo `backend-0.0.1-SNAPSHOT.war`. |
| Build Frontend | PASS | `npm run build` hoàn thành Vite production build. |
| BCrypt/OTP hash unit test | PASS | `AuthSecurityUnitTest`: 2/2 pass. |
| Full Maven test | PASS | `mvn test`: 22/22 pass trên PostgreSQL thật với Java 17 và database UTF-8. Đã sửa compatibility cấu hình để Spring đọc được cả `DB_USERNAME` lẫn tên biến `DB_USER` đang có ở local. |
| Migration PostgreSQL | PASS | Đã áp dụng `schema.sql`, `V3_0_0` và `V3_0_1` vào `used_car_db`; JPA `validate` khởi động thành công. |
| Seed ba role demo | PASS | Đã tạo account demo thật `ADMIN`, `STAFF`, `CUSTOMER`, đều active và email verified. |
| Runtime API/JWT/RBAC | PASS (smoke) | Đã chạy server từ WAR mới: public vehicles `200`; `/auth/me` không token `401`; CUSTOMER `/me` và `/deposits/my` `200`, Staff API `403`; STAFF appointments `200`, deposits/admin `403`; ADMIN ledger `200`, deposits `403`; logout CUSTOMER `200`. |
| Gửi OTP Gmail thật | PASS | Đăng ký alias mailbox thật và resend sau cooldown đều trả `emailSent=true`; không đọc/log OTP, bản ghi test đã xóa. |
| Browser E2E register/login/OTP/reset | IN PROGRESS | Frontend và backend đang chạy; cần kiểm thử click-through register/verify/reset tại browser để lưu ảnh bằng chứng. |

Không có kết quả runtime nào bị ghi là PASS khi chưa chạy.

### 5. Dependency và bàn giao

| Bên nhận/gửi | Nội dung cần nhận hoặc bàn giao | Trạng thái |
|---|---|---|
| TV3 -> TV4 | Schema auth đã được áp dụng local. TV3 cần đưa migration/seed vào quy trình bootstrap chung và xác nhận môi trường nhóm dùng database UTF-8. | Cần phối hợp. |
| TV4 -> TV1 | JWT/current-user contract, ma trận RBAC và ownership confirm/receipt đã áp dụng tối thiểu ở controller/service cọc. TV1 cần xác nhận contract, không dùng `X-User-Id`, và giữ invariant state/transaction khi tích hợp. | Đã bàn giao tại `TV4_Handoff.md`; chờ xác nhận. |
| TV4 -> TV2 | Auth API payload/error, route OTP/reset, Bearer token usage; không bật lại mock fallback. | Sẵn sàng bàn giao. |
| TV4 -> TV5 | Class/endpoint/auth state hiện có để vẽ Use Case, Sequence, Collaboration, Class Diagram và traceability. | Sẵn sàng bàn giao. |
| Hạ tầng -> TV4 | `JWT_SECRET` Base64 >= 32 byte phải được lưu trong environment deploy lâu dài; bản chạy local hiện dùng key tạm ngoài source. | Cần hoàn tất trước deploy. |

### 6. Rủi ro, giới hạn và bước tiếp theo

1. PostgreSQL local phải được tạo với encoding UTF-8; encoding WIN1252 làm test và dữ liệu tiếng Việt lỗi.
2. External Tomcat không tự có `JWT_SECRET`; cần cấu hình ở môi trường chạy nhưng không commit secret.
3. Authorization chủ sở hữu đã được thêm cho `confirm payment` và `receipt`; TV1 vẫn phải giữ nguyên invariant state/transaction và bổ sung test tích hợp cọc khi endpoint hoàn thiện.
4. Test tự động/nghiệm thu Ngày 3 còn thiếu: token hết hạn, role sai theo toàn bộ ma trận, account locked, OTP sai/hết hạn/đã dùng, reset cross-account và ownership deposit qua HTTP thật.
5. SMTP Gmail đã gửi thành công trong môi trường local; cần lưu ảnh inbox/browse flow khi TV2 test hệ thống.

## Phần II - Progress Log

| Giai đoạn | Trạng thái | Nội dung hoàn thành/đang làm | Bằng chứng hoặc bàn giao | Dependency/việc tiếp theo |
|---|---|---|---|---|
| P0.1 - Đọc scope và khóa contract | DONE | Đối chiếu `TV4.md`, Workflow, UI và `TV1_Handoff_Day1.md`; khóa Auth Contract v3.1.0, roles, error behavior, current-user. | `docs/API/API_Specification_Official_v3.md`, `TV4_Handoff.md`. | TV1/TV2/TV3 xác nhận phần sử dụng. |
| P0.2 - User/OTP schema | DONE | Tạo migration user, OTP, reset session; unique/check/FK/index phù hợp và đã áp dụng local. | `database/migrations/V3_0_4__auth_and_otp.sql`, PostgreSQL UTF-8. | TV3 tích hợp bootstrap chung. |
| P0.3 - Login/JWT/RBAC | DONE (cần regression Ngày 3) | Spring Security, JWT filter, matcher theo method/role, current-user, `401/403`; không tự cấp quyền ADMIN cho CUSTOMER/STAFF hoặc ngược lại. | `SecurityConfig`, `JwtAuthenticationFilter`, `AuthController`. | Chạy lại ma trận role qua HTTP sau build cuối. |
| P0.4 - Bỏ identity giả và ownership | DONE (cần integration test) | Gỡ mock auth và `X-User-Id`; create/my/confirm/receipt deposit lấy ID JWT; confirm/receipt kiểm tra chủ sở hữu. | `AuthContext.jsx`, `api.js`, `DepositController`, `DepositService`. | TV1 giữ transaction/state và test cọc end-to-end. |
| P1.1 - Register và verify email | DONE (runtime local) | BCrypt, user unverified, OTP hash, verify, resend/cooldown, SMTP failure recovery. | `AuthService`, `OtpService`, `OtpMailService`. | TV2 thực hiện browser E2E/evidence. |
| P1.2 - Forgot/reset password | DONE (source/build) | Generic response, verify reset OTP, reset token short-lived/single use, BCrypt password mới. | Auth endpoint và UI route `/forgot-password`. | E2E test, negative cases Ngày 3. |
| P1.3 - Đồng bộ UI | DONE | Login/Register khớp card giao diện tham chiếu; bổ sung verify/reset UI cùng style; làm rõ password 8 ký tự. | `LoginPage.jsx`, `RegisterPage.jsx`, `VerifyEmailPage.jsx`, `ForgotPasswordPage.jsx`. | TV2 browser/responsive test. |
| P1.4 - Branding AutoTrade | DONE | Email subject/body, sender display config, UI/footer/backend run message dùng AutoTrade; không còn nhận diện thương hiệu cũ. | `OtpMailService`, `application.properties`, UI. | Review lại trước commit. |
| P2.1 - Unit/build check | DONE | Backend package, frontend production build, BCrypt/OTP hash test. | Maven/Vite output, `AuthSecurityUnitTest`. | Giữ evidence cho TV2/TV5. |
| P2.2 - DB migration/runtime API | DONE | Database UTF-8, schema/migration và seed role demo đã sẵn sàng; JPA validate và full Maven test pass. | `mvn test`: 22/22 pass. | TV3 đưa vào bootstrap chung. |
| P2.3 - SMTP/Tomcat live test | DONE (local) | Embedded Tomcat NIO2 chạy tại `8080`; đăng ký và resend OTP tới mailbox thật đều trả `emailSent=true`; bản ghi test đã xóa. | API `/login`, `/me`, Swagger và SMTP runtime. | Cấu hình JWT deploy lâu dài; TV2 chụp evidence browser. |
| P2.4 - Security regression | PENDING NGÀY 3 | Smoke HTTP của ma trận role mới đã PASS; còn expiry, lock account, OTP boundary, reset cross-account, ownership deposit qua HTTP và automated security test. | Test report do TV2 điều phối; TV4 bổ sung automated security test. | Chạy sau build/integration cuối; không ghi PASS trước khi chạy. |
| P2.5 - Handoff Ngày 2 | DONE | Bàn giao contract, JWT/current-user, RBAC, frontend mapping, migration/seed requirements, known limitations và backlog Ngày 3. | `TV4_Handoff.md`, API specification, README. | Chờ TV1/TV2/TV3 xác nhận ngắn gọn. |

### Checklist xác nhận cuối ngày

- [x] Source auth duy nhất, không có login song song hoặc mock fallback.
- [x] Mật khẩu/OTP/SMTP secret không được log hoặc hard-code.
- [x] UI Login/Register khớp bố cục và nội dung nghiệp vụ hiện hành.
- [x] Frontend/Backend build được.
- [x] PostgreSQL migration và seed chạy trên database thật với UTF-8.
- [x] JWT và ba role chạy end-to-end qua API thật.
- [x] Gmail SMTP gửi OTP thật thành công; OTP không được in/log.
- [x] Auth Contract v3.1.0 và biên bản bàn giao TV4 đã tạo.
- [x] RBAC strict theo matrix leader và ownership `confirm`/`receipt` đã được áp dụng ở phạm vi TV4.
- [ ] TV2 test chéo và ghi Test Report/Defect Log.
- [ ] TV5 cập nhật UML/traceability theo source code cuối.
- [ ] Regression/security test Ngày 3 chạy và lưu bằng chứng thật.
