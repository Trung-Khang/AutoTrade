## Consolidation chính thức TV3 — 01/10/2026

Baseline: `origin/main` tại `cb2c520`; checkout `AutoTrade-TV3` là worktree branch `TV3` (cùng repository với `AutoTrade`). Lịch sử TV3 `5ba28b9` đã là ancestor của main; fast-forward giữ nguyên commit cũ. Auth TV4 `48c8f88` đã merge upstream, không copy Backend/Frontend cũ từ AutoTrade-main. Không có AGENTS.md trong ba checkout hoặc các thư mục cha đã kiểm tra.

Thứ tự bootstrap mới: **schema.sql → V3_0_0 → V3_0_1 → V3_0_2 → V3_0_3 → V3_0_4 → V3_0_5 → showroom seed → auth seed**. `V2_0_1` chỉ upgrade v2.0.0, không replay sau clean schema. Existing V3_0_4 chỉ chạy `V3_0_5__auth_identity_integrity.sql` sau preflight/backup riêng. Không chạy schema/reset/seed lên database shared/audit. Repository hiện chạy migration bằng psql, chưa cấu hình Flyway; migration mới là SQL PostgreSQL thuần, không có psql include, có BEGIN/COMMIT và locks.

V3_0_4 và các migration cũ giữ nguyên. V3_0_5 kiểm tra exact 29 columns/types/defaults/nullability, từ chối incompatible schema, invalid/duplicate identities và orphan trước khi thêm integrity; không sửa/xóa rows hoặc tạo user vá dữ liệu. Giữ OTP/reset CASCADE, reset UNIQUE, OTP index `idx_auth_otps_active_lookup`; thêm username/email LOWER UNIQUE và business user RESTRICT. Chỉ bỏ ordinary `idx_password_reset_sessions_token` sau khi xác nhận đúng định nghĩa V3_0_4. Thêm CHECK required identity (email hợp lệ, full_name/password_hash không trống), username và normalized email; không thêm lifecycle trigger hoặc time-based CHECK.

Demo accounts `customer/staff/admin` chỉ local, hash BCrypt cost12 truyền qua environment; seed từ chối collision, không overwrite password/role/state. Operator phải cấp credential/hash riêng qua kênh riêng; random credential dùng trong verification không phải credential bàn giao. Schema giữ một role/user, không có staff-showroom. Soft disable bảo toàn lịch sử.

Auth fix: lưu failed OTP attempt/expiry invalidation qua cả hai transaction boundaries, khóa user khi verify để serial hóa với resend và ngăn dùng OTP đồng thời. Email normalization dùng Locale.ROOT; length validation khớp DB. Race đăng ký trả 409 cho identity UNIQUE thay vì 500. SMTP_FROM lấy từ SMTP_USERNAME nếu không được cấu hình riêng; không hard-code địa chỉ gửi hoặc secrets.

Evidence mới cho official sequence: `database/evidence/official_20261001_030621_7a31e3/`. Các bằng chứng candidate nhập dưới `database/evidence/historical/` chỉ có giá trị lịch sử. Những mô tả pending/candidate ở phần lịch sử phía dưới đã được supersede bởi mục này; không dùng candidate để bootstrap chính thức.

Dependency còn thiếu: **SMTP_USERNAME, SMTP_PASSWORD**, mailbox access/recipient để kiểm chứng nhận OTP thật. Host/port default smtp.gmail.com:587 STARTTLS; SMTP_FROM fallback SMTP_USERNAME. Activation email receipt → verify delivered OTP → login → /auth/me và real reset email: **NOT RUN**. Không fake delivery, không lộ OTP, không bypass verification. Không tuyên bố TV3/Gate2 đã hoàn tất toàn bộ.

## Lịch sử thiết kế/bàn giao (giữ nguyên nội dung nguồn)

# Complete auth database candidate — 01/10/2026

Physical mapping OTP/reset RESOLVED. Candidate không gắn version: database/drafts/auth_database_candidate.sql. TV4 dành official V3_0_4__auth_and_otp.sql tại commit 48c8f88; file vắng trong workspace, chưa đối chiếu SQL/checksum và chưa chốt official version/bootstrap. Không tạo official V3_0_4 thứ hai hoặc V3_0_5 phụ thuộc file chưa review. Earlier incomplete executable draft đã chuyển sang candidate này; lịch sử/evidence cũ giữ nguyên.

## Nguồn và baseline

Đã đọc toàn bộ yêu cầu tại C:/Users/DELL/.codex/attachments/7cadf5c7-a4af-461a-8ab6-0b2a43edbb84/Pasted text.txt, gồm exact physical response. Handoff cũ sections 5/5A đã đọc trước. Response Markdown riêng không hiện diện trong các vị trí được cung cấp nhưng contract chép lại đầy đủ đủ triển khai; không yêu cầu thêm TV4 source hoặc tìm checkout khác.

Workspace hiện có .git, main unborn/no commits, origin https://github.com/Trung-Khang/AutoTrade; toàn dự án untracked. Không tự init/switch/fetch/commit/push/merge; giữ checkout, không xác thực b53b07f/48c8f88 bằng local history. Đã inspect candidate/seed/preflight/tests/helpers cũ, schema/README, năm migration V2_0_1/V3_0_0..3, showroom/business regressions, DD/ERD và báo cáo TV3. Hash trước/sau kiểm tra old migrations, historical evidence, crawler/backend/frontend. Không thay đổi các nguồn này.

## Schema và safe upgrade

[Exact contract resolved](TV4_Auth_Physical_Contract_Pending.md) và Data Dictionary mô tả đủ 29 columns. app_users có created_at/updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, giữ identity rules/LOWER indexes; không version/deleted_at/showroom_id/role join/updated_at trigger. Auth FK CASCADE; business RESTRICT. OTP purpose/attempt CHECK, lookup index; reset token_hash UNIQUE tạo index riêng cần thiết, không thêm redundant ordinary index. Không raw credentials, active-OTP uniqueness, direct OTP FK, NOW()-based expiry/lifecycle CHECK hoặc trigger.

Candidate BEGIN/COMMIT, advisory lock, lock_timeout 10s, SHARE ROW EXCLUSIVE locks trên business và existing auth tables trước preflight→DDL; concurrent writers không làm invalid audit. Không DROP/repair/reassign/fabricate users. Supported isolated paths:

1. V3_0_3 không auth: business rows phải rỗng; nếu có, preflight báo IDs/count cần TV1/TV4 mapping.
2. Compatible existing auth: exact column types/nullability/defaults/PK; giữ full rows/timestamps, thêm missing integrity/indexes. Conflicting named constraint/index/user FK action bị reject, không IF NOT EXISTS che mismatch.
3. Earlier partial TV3: đúng mười cột users cũ, cả timestamps absent và chưa OTP/reset. Explicit additive path khởi tạo timestamps bằng transaction upgrade time, giữ old column values/business history. Đây là initialization policy, không suy đoán historical created date; phải review trước upgrade ngoài fixture.

Duplicate identity/token, invalid purpose/counter, orphan, incompatible schema/default/PK/FK/index → atomic rollback; không partial DDL hay row repair. Preflight REPEATABLE READ READ ONLY báo exact columns/defaults, PK/FK/CHECK/UNIQUE/index definitions, required/normalization/duplicates/purpose/counter/user references; absent/type-incompatible tables được báo/skipped rõ. Hard-delete user có business history bị chặn và rollback giữ cả temporary auth rows; soft disable giữ tất cả rows. Không thay ledger/vehicle/status rules, appointments vẫn PENDING/COMPLETED/CANCELLED.

## Bootstrap, verification và review commands

Runner nhận -Psql/-Java/-CryptoJar/-LoggingJar/-MaintenanceDatabase/-EvidenceDirectory; dùng psql -X -w -v ON_ERROR_STOP=1, check exit codes. PGHOST/PGPORT/PGUSER/PGPASSWORD hoặc pgpass cấu hình riêng; UTF8 bắt buộc dev DB. Không fixed installation path. Backend dùng DB_HOST/DB_PORT/DB_NAME/DB_USERNAME/DB_PASSWORD; không copy credential mặc định.

Official workspace clean sequence: schema.sql → V3_0_0 → V3_0_1 → V3_0_2 → V3_0_3 → showroom seed. schema.sql chỉ cho DB vừa CREATE thành công (UTF8/template0), disposable. V2_0_1 chỉ patch v2.0.0, không replay trên schema.sql. Explicit reviewed migration list trong runner, không glob future versions.

Isolated full candidate sequence: official clean sequence → auth_database_candidate.sql → demo_auth_accounts.sql. Upgrade fixture: read-only preflight → candidate → catalog/tests. Chưa chốt official shared-repository auth sequence; không apply candidate vào shared/audit/populated DB trong task.

```powershell
# Private credential/vault hoặc pgpass; không password trên command line.
$psql = $env:PSQL_EXE
& $psql -X -w -d $env:PGDATABASE -v ON_ERROR_STOP=1 -f database/tests/auth_identity_preflight.sql
if ($LASTEXITCODE -ne 0) { throw 'Preflight failed' }
& ./database/tests/run_auth_identity_verification.ps1 -Psql $psql `
 -CryptoJar $env:SPRING_SECURITY_CRYPTO_JAR -LoggingJar $env:SPRING_JCL_JAR
# Candidate apply command chỉ cho fixture/local isolated được review:
& $psql -X -w -d $isolatedDb -v ON_ERROR_STOP=1 -f database/drafts/auth_database_candidate.sql
if ($LASTEXITCODE -ne 0) { throw 'Candidate rejected; inspect preflight; no automatic repair' }
```

Backup trước upgrade tương lai bằng pg_dump -Fc vào private path, bảo vệ dump vì hashes/profile; restore-test pg_restore --exit-on-error trên DB mới riêng và check exits. Không --clean/reset shared DB. Failed transaction rollback; committed migration không đảo bằng DROP auth tables. TV4/manager phải so V3_0_4 gốc và xác minh history trước chọn official version/apply sequence.

## Local demo credential

Seed customer/CUSTOMER, staff/STAFF, admin/ADMIN; generated IDs, profile/example.test emails, active/verified=true, locked=false. Transaction/locks/collision reject; chỉ no-op khi identity/hash/profile/role/state trùng hoàn toàn, không overwrite/elevate/reset/unlock real account hoặc ép ID=1. Repeat giữ IDs/hashes/state/timestamps.

Actual Spring BCryptPasswordEncoder(12) generate/verify, không crypt()/extension. Operator chọn password qua SecureString, giữ password và cùng hash trong private vault; TV2 nhận credential qua kênh riêng. Salt/hash mới phải bị collision reject, không ép overwrite. Runner random credential chỉ trong memory, không dùng fixture credential làm credential bàn giao. Không plaintext trong SQL/report/log; diagnostics redact. Legacy business tests chỉ copy vào evidence mới rồi dùng SELECT customer ID, original tests không sửa.

```powershell
$env:AUTOTRADE_DEMO_BCRYPT_HASH = & ./database/tests/New-DemoBcryptHash.ps1 `
 -CryptoJar $env:SPRING_SECURITY_CRYPTO_JAR -LoggingJar $env:SPRING_JCL_JAR
& ./database/tests/run_demo_auth_seed.ps1 -Database $isolatedDb -Psql $psql
```

## Handoff và giới hạn

Candidate hoàn chỉnh đủ cho TV4 review database và chạy Hibernate validate/real auth integration trên isolated DB. Mapping đã RESOLVED; SQL tests không chứng minh JWT/RBAC/SMTP/ownership/Gate 2. TV4/manager reconcile official V3_0_4; TV1 mapping historical IDs/current-user; TV2 private credentials/actual IDs; TV5 physical DD/ERD/evidence. Không quyết định SCHEDULED/future-date/ledger sign/lifecycle/reference/staff assignment. Historical reports/evidence giữ nguyên; fresh results và task manifest được append ở handoff/report.

## Fresh executed evidence

Final complete run: database/evidence/auth_identity_20261001_021959_852_18b81c/; result.txt and databases.txt list actual outcomes/unique retained disposable DBs. All runner steps PASS with exit checks. Compatible/partial snapshots and late-rejection probes verified full row/schema preservation. Baseline: database/evidence/auth_identity_complete_20261001_012052/baseline_sha256.txt. Historical evidence unchanged.

Executed: PostgreSQL18.6/UTF8, psql C:/Program Files/PostgreSQL/18/bin/psql.exe, Java with cached spring-security-crypto6.3.3 and spring-jcl6.1.6. Runner passed -Psql/-CryptoJar/-LoggingJar; PGHOST=localhost/PGUSER=postgres, PGPASSWORD supplied privately from existing DB_PASSWORD and restored after use. Actual command:

```powershell
& ./database/tests/run_auth_identity_verification.ps1 -Psql 'C:/Program Files/PostgreSQL/18/bin/psql.exe' `
 -CryptoJar 'C:/Users/DELL/.m2/repository/org/springframework/security/spring-security-crypto/6.3.3/spring-security-crypto-6.3.3.jar' `
 -LoggingJar 'C:/Users/DELL/.m2/repository/org/springframework/spring-jcl/6.1.6/spring-jcl-6.1.6.jar'
```

Passed clean/V3_0_3/compatible/partial upgrades, exact catalog, identity/timestamps, OTP purposes/attempt0..5/defaults/required/FK, reset UNIQUE/defaults/required/FK, cascade/restrict with auth+business preservation, soft disable/rollback, rejection probes, seed-repeat/collision, actual Spring BCrypt, concurrent uniqueness and business regressions. No shared DB mutation. Earlier failed logs retained under fresh auth_identity directories; initial parser/include/representation/output-order issues corrected, no fabricated PASS. Runtime auth and official SQL comparison NOT RUN.

## Chạy verification mới

```powershell
& ./database/tests/run_auth_identity_verification.ps1 -Python $env:PYTHON_EXE -Psql $env:PSQL_EXE -CryptoJar $env:SPRING_SECURITY_CRYPTO_JAR -LoggingJar $env:SPRING_JCL_JAR
# Sau runner: DB_NAME là DB mới trong evidence/databases.txt; DB_PASSWORD/JWT_SECRET chỉ environment.
cd backend
mvn test
# AuthDatabaseIntegrationTest chỉ cho tv3_official_* do runner tạo; fixture OTP không giả lập email.
mvn package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.war
```

Chạy Maven bằng JDK được dependencies hỗ trợ (Java 17 target). Database SQL probes và Backend auth fixtures không kiểm chứng thư đến mailbox. Lưu credential demo operator riêng; không dùng random test credential như bàn giao production.
