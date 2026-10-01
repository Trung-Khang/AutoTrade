# TV3 final database — 01/10/2026

Database acceptance: **PASS** trên instance `DESKTOP-42GEDK2`, PostgreSQL 18.6.
Đây là bàn giao database của TV3; chưa phải nghiệm thu toàn hệ thống.

## Kết nối đúng instance

```dotenv
DB_NAME=autotrade_final
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
HIBERNATE_DDL_AUTO=validate
```

JDBC: `jdbc:postgresql://localhost:5432/autotrade_final`.
`DB_PASSWORD` được operator cung cấp riêng qua environment/pgpass. Không ghi password vào URL, tham số lệnh hoặc evidence.
`localhost` ở cấu hình trên là **máy DESKTOP-42GEDK2**. `localhost` trên máy thành viên khác là instance khác và không được dùng để thay thế.

Radmin VPN của máy database: `26.181.182.25`; Wi-Fi tại thời điểm kiểm tra: `172.16.30.179`.
Kết nối local đã xác minh DB/OID/server ID. Probe từ máy database đến địa chỉ Radmin bị từ chối bởi `pg_hba.conf` (chỉ có loopback); **BLOCKED** route liên máy.
Thử từ máy thành viên: **NOT RUN**, không có phiên truy cập máy thành viên. Không sửa HBA/firewall/listen_addresses, không mở database ra Internet.
Operator cần thiết lập tunnel hoặc rule VPN giới hạn đúng máy/identity, rồi TV4/TV1/TV2 dùng cùng instance và xác minh lại server identity trong evidence.

## Bootstrap và resume

Tại root worktree TV3, sau fetch và tích hợp `origin/main`, dùng Python 3, psql 18, PowerShell 7 và Java có sẵn:

```powershell
# DB_PASSWORD/PGPASSWORD được cấp riêng trong phiên operator.
python database/tests/run_final_acceptance.py --host localhost --port 5432 --username postgres
```

Máy nghiệm thu dùng Python tại `C:\Users\DELL\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`.
psql mặc định: `C:\Program Files\PostgreSQL\18\bin\psql.exe`; `--psql`, `--pwsh`, `--crypto-jar`, `--logging-jar`, `--operator-account` cho phép chọn runtime tương đương.
Jars thực tế: Spring Security crypto 6.3.3 và commons-logging 1.3.5 trong `D:\maven-repository`.

Runner chỉ cho `autotrade_final`, branch TV3, allowlist chín file theo thứ tự chính thức.
Tạo UTF8/template0 thành công, ghi OID, chứng minh database trống trước schema; guard DB/user/port/server ID/OID trong connection thực thi.
Mọi psql dùng explicit host/port/user/database, `-X -w`, `ON_ERROR_STOP=1`, kiểm tra exit code.
Không có outer transaction bao quanh các script; giữ BEGIN/COMMIT trong nguồn. Không dùng V2_0_1, Flyway, candidate hoặc migration-history giả.
Nếu database đã có, chỉ resume khi journal local chứng minh completed prefix, cùng baseline/checksums/server/OID và catalog/full-row fingerprints không đổi. Không chạy lại committed migration.
Pending/không rõ provenance/khác rows hoặc catalog: dừng, không reset hoặc tự sửa objects.
Nếu lỗi migration: evidence ghi FAIL, checkpoint giữ pending; operator review phần commit/rollback trước khi dùng additive migration version tiếp theo. Runner không tự đánh dấu PASS hay skip lỗi.

Một lỗi parser khi database vừa tạo còn trống đã được sửa trước schema. Reviewed recovery bằng:

```powershell
python database/tests/run_final_acceptance.py --recover-created-empty-evidence database/evidence/final_acceptance_20261001_091237
```

Recovery này chỉ chấp nhận chứng cứ CREATE exit=0, đúng OID/server, zero user objects và UTF8; không hỗ trợ replay migration. Đã hoàn thành recovery; không cần chạy lại command này.

## Demo và credential riêng

Ba identities: `customer/customer@example.test/CUSTOMER`, `staff/staff@example.test/STAFF`, `admin/admin@example.test/ADMIN`.
Tất cả `active=true`, `email_verified=true`, `locked=false`. Một BCrypt cost12 dùng chung đúng supported seed; kiểm chứng bằng Spring BCrypt và giữ nguyên hash cho rerun.
Credential operator riêng được tạo cho bàn giao này; không lấy random credential của `verify_official_tv3.py`.
File private: `.env.tv3-final.private.json`, ignored, ACL chỉ operator `DESKTOP-42GEDK2\DELL`, account thực thi và SYSTEM. Có password demo và hash phục vụ rerun; không gửi tự động cho teammate.
`.env.tv3-final.journal.json` lưu checkpoint/provenance riêng; giữ cùng private file trên máy database. Không đưa hai file này vào Git/evidence.
`New-DemoBcryptHash.ps1 -OperatorEnvironment` đọc password riêng từ env và output được runner capture riêng, đưa vào `AUTOTRADE_DEMO_BCRYPT_HASH`; auth seed chạy qua `run_demo_auth_seed.ps1`.
Không đổi password/roles/states để rerun seed.

10 xe `DEMO-01`–`DEMO-10`, mỗi key đúng một hàng, IDs 1–10; showroom 1. 7 AVAILABLE, 1 HOLD, 1 RESERVED, 1 SOLD.
Stock giả lập có `demo_key`, showroom, mô tả DEMO ONLY; không có dữ liệu marketplace/crawler import trong database này.
3 showroom; sources/listings/archive rows: 0. Showroom demo trạng thái giữ nguyên, không suy diễn rằng HOLD/SOLD bắt buộc có lịch sử giao dịch seed.

## Evidence và phạm vi kiểm chứng

Bootstrap/seed hai lần: `database/evidence/final_acceptance_20261001_091335/`.
Catalog cuối, kiểm tra bổ sung và valid resume không replay migration: `database/evidence/final_acceptance_20261001_091606/`.
Tất cả required migrations PASS, không schema defect, không cần V3_0_6.
Seed-repeat full-row fingerprints của mọi public table giống nhau: IDs, credential, fields, states, business rows không thay đổi.
Test fixture mutation rollback; concurrency fixture có tag, ID riêng, cleanup chỉ đúng rows và kiểm chứng zero residue. Không reset sequence; gaps hợp lệ được giữ.
Expected errors kiểm tra SQLSTATE và constraint (hoặc NOT NULL column). Auth29/PK/FK/CHECK/UNIQUE/default/index/partial-expression catalog PASS.
Deposit uniqueness, amount, concurrent insert, user FKs, OTP/reset FKs, standalone deposit RESTRICT và standalone appointment RESTRICT giữ auth/history, soft disable và auth CASCADE PASS.
Appointment/ledger, archive boundary, vehicle vocabularies/VIN/demo-key uniqueness, listing CHECK/FK/UNIQUE/timestamp trigger và deposit vehicle/showroom FK PASS.
DB không tự chuyển vehicle state khi insert DEPOSITED; FK bảo đảm references tồn tại, không tự enforce cùng showroom hoặc các state-flow nghiệp vụ. Các fixture hợp lệ có coherent vehicle/showroom. Transaction chuyển trạng thái thuộc TV1.

`live_catalog.json` và `Data_Dictionary.live.md` lấy từ chính DB vừa chạy, phục vụ TV5; không từ draft.
`migration_manifest.executed.json` chứa order/path/SHA256/DB/server/start/end/exit/PASS lấy từ logs thực thi thật.
`git_receipt.local.json` trong folder evidence cuối ghi baseline/final TV3 commit/push sau commit; receipt sanitized và ignored vì được tạo sau commit.

## Việc tiếp theo thuộc các thành viên

- TV4: Hibernate validate, login 3 role, `/api/v1/auth/me`, registration/email verification/password reset trên instance này: **NOT RUN bởi TV3**.
- Real SMTP/mail receipt: **NOT RUN**, chưa có SMTP credentials/mailbox access được kiểm chứng; không fake delivery hoặc expose OTP.
- TV1: CRUD/ownership/deposit/appointment/ledger business transaction và state flows: **NOT RUN bởi TV3**.
- TV2: real API/Frontend/system tests, screenshots, defect log cuối 01/10: **NOT RUN bởi TV3**.
- TV5: ERD/Data Dictionary/UML sync từ live catalog/code cuối 01/10.
- 02/10 chỉ P0 fixes; database repair bắt buộc additive migration, không thêm chức năng.

Không sửa `used_car_db`, crawler source/data/reports, schema.sql hoặc migrations hiện có. Không merge/push main; handoff chỉ origin/TV3 cho manager review.
