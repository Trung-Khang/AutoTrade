# TV4 - Báo cáo tiến độ xác thực và phân quyền AutoTrade

Ngày cập nhật: 02/10/2026
Người phụ trách: TV4
Phạm vi: Authentication, identity, authorization và tích hợp UI xác thực theo `TV4.md` và `Workflow_4_Increment.md`.

## Addendum 02/10/2026 - Deposit/Appointment sau merge TV2

- Theo yêu cầu audit hậu merge `795f1878e66802f75bc3bb35324be44cfff30f61`, khóa các API deposit theo JWT CUSTOMER; tạo, danh sách của tôi, confirm và receipt lấy identity từ Security Context. Không nhận `X-User-Id` hoặc user mặc định. Confirm/receipt xác minh ownership.
- Xóa mock/localStorage fallback khỏi `depositApi.js`; mọi lỗi API giờ được đưa tới UI thay vì báo thành công giả. Trang lịch sử CUSTOMER nhận DTO từ DB gồm xe và lịch hẹn.
- Bổ sung Admin API đọc appointment từ cùng bảng PostgreSQL với Staff, đổi lịch PENDING, hủy lịch PENDING gắn với deposit DEPOSITED, hoàn tiền, mở lại xe và ghi một ledger REFUND âm/CONFIRMED trong cùng transaction. Pessimistic lock trên deposit/appointment và điều kiện HOLD ngăn xử lý lặp; Staff check-in chỉ nhận PENDING.
- Thêm UI Admin đổi/hủy lịch, thông báo lỗi/thành công; trang Admin gọi riêng Admin appointments và ledger. Bổ sung A4 print receipt, ẩn `.footer-exact`, navbar và action controls.
- Xác minh: Maven package `BUILD SUCCESS`; focused `DepositServiceUnitTest,AuthSecurityUnitTest` **15/15 PASS**; frontend `npm run build` **PASS**; Chrome headless print fixture **1 trang A4**, nội dung còn đủ và không in footer. `git diff --check` sạch; source trong phạm vi đã quét không còn `X-User-Id`, user mặc định `1`, hoặc deposit/appointment localStorage fallback.
- Full Maven suite chưa PASS: 10 case `AuthDatabaseIntegrationTest` bị gate do thiếu database fixture do official isolated runner tạo. Không chạy runner/schema/migration/seed trên `autotrade_final`; do đó HTTP role matrix, DB rollback thật và integration trên database chung vẫn **PENDING**. Unit test có kiểm tra các nhánh trạng thái/lỗi, không thay thế transaction integration.
- Không sửa README; giữ nguyên README đang có thay đổi và file `Huong_dan_test_autotrade_final.md` untracked. Không xử lý multi-tab. Không commit/push.

## Phần I - Báo cáo chi tiết

### Cập nhật 01/10 - Củng cố chính sách mật khẩu

- Backend dùng một `PasswordPolicyValidator` chung cho đăng ký và đặt lại mật khẩu. Mật khẩu phải có tối thiểu 8 ký tự, gồm ít nhất một chữ hoa, chữ thường, chữ số và ký tự đặc biệt trong `@#$%^&+=!`.
- `POST /register` nhận thêm `confirmPassword`; Backend từ chối khi hai mật khẩu không khớp, nên không phụ thuộc riêng vào validation của trình duyệt.
- `POST /reset-password` áp dụng cùng policy sau khi reset token hợp lệ được tìm thấy. Token không bị consume, password hash không đổi khi policy không hợp lệ; đồng thời vẫn chặn dùng lại mật khẩu hiện tại.
- UI Register và Reset Password dùng một checklist chung, chặn submit khi chưa đạt rule, báo lỗi confirm password và có nút Hiện/Ẩn mật khẩu. Reset UI chỉ biết username để không tiết lộ email liên kết; Backend vẫn kiểm tra email thật khi lưu mật khẩu.
- Không thêm bảng, migration, secret, log plaintext hoặc thay đổi JWT/RBAC/OTP/contract `MessageResponse`.
- Kiểm thử unit đã chạy: `PasswordPolicyValidatorTest`, `AuthServicePasswordPolicyTest`, `AuthServiceResetPasswordTest`, `AuthSecurityUnitTest`: **9/9 PASS**. Full integration trên `autotrade_final` vẫn chờ Final Gate theo điều kiện database chung.

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
- Gmail SMTP đã chấp nhận các thư OTP đăng ký và đặt lại mật khẩu. Người dùng đã xác nhận nhận được thư; một số thư được Gmail phân loại vào mục Spam do gửi kiểm thử lặp lại nhiều lần.
- `emailSent=true` được hiểu là Backend đã gửi thành công tới SMTP, không phải cam kết thư luôn nằm trong Inbox. Quyết định hiện tại là đóng băng luồng đang ổn định, không refactor thêm chỉ để xử lý phân loại Spam.

### 3. Đối chiếu với giao diện Login/Register

Đã đối chiếu với hai giao diện được cung cấp tại `/login` và `/register`.

| Hạng mục | Kết quả | Điều chỉnh đã thực hiện |
|---|---|---|
| Bố cục navbar, card, màu sắc, nút chính | Khớp | Giữ CSS/card và các route hiện có. |
| Tiêu đề Login | Khớp | Dùng `Đăng nhập` và mô tả `Hệ thống Quản lý Kinh doanh Ô tô AutoTrade`. |
| Placeholder Login | Khớp | Khôi phục gợi ý `VD: admin, staff, customer` và `Nhập mật khẩu...`. |
| Tiêu đề/Register fields | Khớp | Dùng `Đăng ký tài khoản`, đủ username, họ tên, email, điện thoại, password, confirm password. |
| Điện thoại bắt buộc | Khớp | UI và Backend đều bắt buộc, kiểm tra định dạng 8-30 ký tự số/ký tự điện thoại hợp lệ. |
| Mật khẩu | Đã củng cố | UI checklist và Backend cùng áp dụng tối thiểu 8 ký tự, hoa, thường, số, ký tự đặc biệt; Backend xác nhận lại confirm password. |
| Demo account box | Cố ý loại bỏ | Không còn mock login hoặc token giả. Seed account thật do TV3 chuẩn bị và chỉ hiển thị cho demo khi đã có dữ liệu thật. |
| Quên mật khẩu/OTP | Bổ sung | Login có link quên mật khẩu; có route xác minh email và đặt lại mật khẩu cùng style card hiện hữu. |

### 4. Kiểm thử và bằng chứng hiện có

| Kiểm tra | Trạng thái | Kết quả thực tế |
|---|---|---|
| Build Backend | PASS | `mvn package -DskipTests` tạo `backend-0.0.1-SNAPSHOT.war`. |
| Build Frontend | PASS | `npm run build` hoàn thành Vite production build. |
| BCrypt/OTP hash unit test | PASS | `AuthSecurityUnitTest`: 2/2 pass. |
| Full Maven test | CẦN CHẠY LẠI NGÀY 3 | Mốc trước đã có `22/22` test pass. Sau khi merge migration chính thức V3.0.5 và các thay đổi tích hợp mới, chưa chạy lại toàn bộ suite trên database sạch chính thức. |
| Database acceptance `autotrade_final` | PASS BY TV3 | PR #30 đã nghiệm thu PostgreSQL 18.6 trên `autotrade_final`: bootstrap/seed lặp lại, catalog, auth, deposit, appointment và ledger đều PASS. Instance hiện chỉ cho loopback; TV4 chưa kết nối để chạy integration auth trên cùng DB. |
| Seed ba role demo | PASS | Đã tạo account demo thật `ADMIN`, `STAFF`, `CUSTOMER`, đều active và email verified. |
| Runtime API/JWT/RBAC | PASS (smoke) | Đã chạy server từ WAR mới: public vehicles `200`; `/auth/me` không token `401`; CUSTOMER `/me` và `/deposits/my` `200`, Staff API `403`; STAFF appointments `200`, deposits/admin `403`; ADMIN ledger `200`, deposits `403`; logout CUSTOMER `200`. |
| OTP email unit/transaction test | PASS | `OtpEmailDeliveryServiceTest` và `OtpServiceAfterCommitTest`: 7/7 test pass, không có failure/error. |
| Gửi OTP Gmail thật | PASS - SMTP SUBMITTED | Chẩn đoán 9/9 lần submit thành công cho ba mailbox, gồm plain text, multipart và OTP đăng ký. Người dùng xác nhận thư đến nhưng có trường hợp nằm trong Spam. Không kết luận Inbox delivery chỉ từ kết quả SMTP. |
| Browser E2E register/login/OTP/reset | PASS (TV4 kiểm thử thủ công) | TV4 đã chạy thành công đăng ký → nhận OTP → xác minh → đăng nhập và quên mật khẩu → nhận OTP → đặt mật khẩu mới trên giao diện thật. Cần TV2 lưu ảnh/test case vào Test Report chung. |
| Build Frontend sau cập nhật | PASS | `npm run build`: 135 module được transform, production bundle tạo thành công. |

Không có kết quả runtime nào bị ghi là PASS khi chưa chạy.

### 5. Dependency và bàn giao

| Bên nhận/gửi | Nội dung cần nhận hoặc bàn giao | Trạng thái |
|---|---|---|
| TV3 -> TV4 | TV3 đã nghiệm thu `autotrade_final`, khóa migration/seed/evidence và công bố route kết nối. TV3 cần cấp tunnel hoặc VPN allowlist theo IP để TV4 chạy Hibernate validate/auth integration trên đúng instance. | DATABASE ACCEPTANCE PASS; ROUTE LIÊN MÁY PENDING. |
| TV4 -> TV1 | JWT/current-user contract, ma trận RBAC và ownership confirm/receipt đã áp dụng tối thiểu ở controller/service cọc. TV1 cần xác nhận contract, không dùng `X-User-Id`, và giữ invariant state/transaction khi tích hợp. | Đã bàn giao tại `TV4_Handoff.md`; chờ xác nhận. |
| TV4 -> TV2 | Auth API payload/error, route OTP/reset, Bearer token usage; không bật lại mock fallback. | Sẵn sàng bàn giao. |
| TV4 -> TV5 | Class/endpoint/auth state hiện có để vẽ Use Case, Sequence, Collaboration, Class Diagram và traceability. | Sẵn sàng bàn giao. |
| Hạ tầng -> TV4 | `JWT_SECRET` Base64 >= 32 byte phải được lưu trong environment deploy lâu dài; bản chạy local hiện dùng key tạm ngoài source. | Cần hoàn tất trước deploy. |

### 6. Rủi ro, giới hạn và bước tiếp theo

1. PostgreSQL local phải được tạo với encoding UTF-8; encoding WIN1252 làm test và dữ liệu tiếng Việt lỗi.
2. External Tomcat không tự có `JWT_SECRET`; cần cấu hình ở môi trường chạy nhưng không commit secret.
3. Authorization chủ sở hữu đã được thêm cho `confirm payment` và `receipt`; TV1 vẫn phải giữ nguyên invariant state/transaction và bổ sung test tích hợp cọc khi endpoint hoàn thiện.
4. Test tự động/nghiệm thu Ngày 3 còn thiếu: token hết hạn, role sai theo toàn bộ ma trận, account locked, OTP sai/hết hạn/đã dùng, reset cross-account và ownership deposit qua HTTP thật.
5. Gmail có thể đưa OTP vào Spam khi gửi thử liên tiếp. UI/Test Plan phải nhắc kiểm tra Spam; không tự động gửi dồn dập và không mô tả `emailSent=true` là chắc chắn đã vào Inbox.
6. Không refactor thêm SMTP/OTP chỉ để xử lý Spam. Mọi thay đổi transaction, API, DTO hoặc database phải được review riêng và chạy regression đầy đủ trước khi merge.
7. `autotrade_final` là database shared chính thức của TV3, không chạy `schema.sql`, migration, seed hay acceptance runner từ branch TV4/local DB. Chỉ kết nối với credential/route do TV3 cấp riêng.

## Phần II - Progress Log

| Giai đoạn | Trạng thái | Nội dung hoàn thành/đang làm | Bằng chứng hoặc bàn giao | Dependency/việc tiếp theo |
|---|---|---|---|---|
| P0.1 - Đọc scope và khóa contract | DONE | Đối chiếu `TV4.md`, Workflow, UI và `TV1_Handoff_Day1.md`; khóa Auth Contract v3.1.0, roles, error behavior, current-user. | `docs/API/API_Specification_Official_v3.md`, `TV4_Handoff.md`. | TV1/TV2/TV3 xác nhận phần sử dụng. |
| P0.2 - User/OTP schema | DONE | Tạo migration user, OTP, reset session; unique/check/FK/index phù hợp và đã áp dụng local. | `database/migrations/V3_0_4__auth_and_otp.sql`, PostgreSQL UTF-8. | TV3 tích hợp bootstrap chung. |
| P0.3 - Login/JWT/RBAC | DONE (cần regression Ngày 3) | Spring Security, JWT filter, matcher theo method/role, current-user, `401/403`; không tự cấp quyền ADMIN cho CUSTOMER/STAFF hoặc ngược lại. | `SecurityConfig`, `JwtAuthenticationFilter`, `AuthController`. | Chạy lại ma trận role qua HTTP sau build cuối. |
| P0.4 - Bỏ identity giả và ownership | DONE (cần integration test) | Gỡ mock auth và `X-User-Id`; create/my/confirm/receipt deposit lấy ID JWT; confirm/receipt kiểm tra chủ sở hữu. | `AuthContext.jsx`, `api.js`, `DepositController`, `DepositService`. | TV1 giữ transaction/state và test cọc end-to-end. |
| P1.1 - Register và verify email | DONE (runtime local) | BCrypt, user unverified, OTP hash, verify, resend/cooldown và email Gmail thật đã chạy thành công. Thư có thể vào Spam. | `AuthService`, `OtpService`, email service và browser flow. | TV2 lưu screenshot/test evidence và thêm nhắc kiểm tra Spam. |
| P1.2 - Forgot/reset password | DONE (runtime local) | Generic response, verify reset OTP, reset token short-lived/single use, BCrypt password mới; browser flow đã được TV4 kiểm thử thành công. | Auth endpoint và UI route `/forgot-password`. | TV2 test chéo; negative cases còn lại chạy Ngày 3. |
| P1.3 - Đồng bộ UI | DONE | Login/Register khớp card giao diện tham chiếu; bổ sung verify/reset UI cùng style; làm rõ password 8 ký tự. | `LoginPage.jsx`, `RegisterPage.jsx`, `VerifyEmailPage.jsx`, `ForgotPasswordPage.jsx`. | TV2 browser/responsive test. |
| P1.4 - Branding AutoTrade | DONE | Email subject/body, sender display config, UI/footer/backend run message dùng AutoTrade; không còn nhận diện thương hiệu cũ. | `OtpMailService`, `application.properties`, UI. | Review lại trước commit. |
| P2.1 - Unit/build check | DONE | Backend package, frontend production build, BCrypt/OTP hash test. | Maven/Vite output, `AuthSecurityUnitTest`. | Giữ evidence cho TV2/TV5. |
| P2.2 - DB migration/runtime API | DONE BY TV3 / REGRESSION PENDING | TV3 đã khóa official migration đến V3.0.5 và có evidence `ddl-auto=validate`; TV4 chưa chạy lại full suite trên clean DB sau merge mới nhất. | `database/evidence/official_20261001_030621_7a31e3/`. | Chạy full regression ở Final Gate. |
| P2.3 - SMTP/Tomcat live test | DONE (local) | Backend `8080`; 9/9 SMTP submissions được Gmail chấp nhận; đăng ký và reset OTP qua browser hoạt động. Một số thư vào Spam do kiểm thử lặp lại. | API auth, browser flow và SMTP diagnostic có địa chỉ được che. | TV2 bổ sung cảnh báo Spam và lưu evidence. |
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
- [x] Browser flow đăng ký/xác minh và quên/đặt lại mật khẩu đã được TV4 chạy thành công.
- [x] Đã xác định thư thất lạc trước đây nằm trong Spam, không phải lỗi JWT/API/database.
- [x] Auth Contract v3.1.0 và biên bản bàn giao TV4 đã tạo.
- [x] RBAC strict theo matrix leader và ownership `confirm`/`receipt` đã được áp dụng ở phạm vi TV4.
- [ ] TV2 test chéo và ghi Test Report/Defect Log.
- [ ] TV5 cập nhật UML/traceability theo source code cuối.
- [ ] Regression/security test Ngày 3 chạy và lưu bằng chứng thật.
