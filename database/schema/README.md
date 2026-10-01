## Consolidation chính thức TV3 — 01/10/2026

Baseline: `origin/main` tại `cb2c520`; checkout `AutoTrade-TV3` là worktree branch `TV3` (cùng repository với `AutoTrade`). Lịch sử TV3 `5ba28b9` đã là ancestor của main; fast-forward giữ nguyên commit cũ. Auth TV4 `48c8f88` đã merge upstream, không copy Backend/Frontend cũ từ AutoTrade-main. Không có AGENTS.md trong ba checkout hoặc các thư mục cha đã kiểm tra.

Thứ tự bootstrap mới: **schema.sql → V3_0_0 → V3_0_1 → V3_0_2 → V3_0_3 → V3_0_4 → V3_0_5 → showroom seed → auth seed**. `V2_0_1` chỉ upgrade v2.0.0, không replay sau clean schema. Existing V3_0_4 chỉ chạy `V3_0_5__auth_identity_integrity.sql` sau preflight/backup riêng. Không chạy schema/reset/seed lên database shared/audit. Repository hiện chạy migration bằng psql, chưa cấu hình Flyway; migration mới là SQL PostgreSQL thuần, không có psql include, có BEGIN/COMMIT và locks.

V3_0_4 và các migration cũ giữ nguyên. V3_0_5 kiểm tra exact 29 columns/types/defaults/nullability, từ chối incompatible schema, invalid/duplicate identities và orphan trước khi thêm integrity; không sửa/xóa rows hoặc tạo user vá dữ liệu. Giữ OTP/reset CASCADE, reset UNIQUE, OTP index `idx_auth_otps_active_lookup`; thêm username/email LOWER UNIQUE và business user RESTRICT. Chỉ bỏ ordinary `idx_password_reset_sessions_token` sau khi xác nhận đúng định nghĩa V3_0_4. Thêm CHECK required identity (email hợp lệ, full_name/password_hash không trống), username và normalized email; không thêm lifecycle trigger hoặc time-based CHECK.

Demo accounts `customer/staff/admin` chỉ local, hash BCrypt cost12 truyền qua environment; seed từ chối collision, không overwrite password/role/state. Operator phải cấp credential/hash riêng qua kênh riêng; random credential dùng trong verification không phải credential bàn giao. Schema giữ một role/user, không có staff-showroom. Soft disable bảo toàn lịch sử.

Auth fix: lưu failed OTP attempt/expiry invalidation qua cả hai transaction boundaries, khóa user khi verify để serial hóa với resend và ngăn dùng OTP đồng thời. Email normalization dùng Locale.ROOT; length validation khớp DB. Race đăng ký trả 409 cho identity UNIQUE thay vì 500. SMTP_FROM lấy từ SMTP_USERNAME nếu không được cấu hình riêng; không hard-code địa chỉ gửi hoặc secrets.

Evidence mới cho official sequence: `database/evidence/official_20261001_030621_7a31e3/`. Các bằng chứng candidate nhập dưới `database/evidence/historical/` chỉ có giá trị lịch sử. Những mô tả pending/candidate ở phần lịch sử phía dưới đã được supersede bởi mục này; không dùng candidate để bootstrap chính thức.

Dependency còn thiếu: **SMTP_USERNAME, SMTP_PASSWORD**, mailbox access/recipient để kiểm chứng nhận OTP thật. Host/port default smtp.gmail.com:587 STARTTLS; SMTP_FROM fallback SMTP_USERNAME. Activation email receipt → verify delivered OTP → login → /auth/me và real reset email: **NOT RUN**. Không fake delivery, không lộ OTP, không bypass verification. Không tuyên bố TV3/Gate2 đã hoàn tất toàn bộ.

## Lịch sử thiết kế/bàn giao (giữ nguyên nội dung nguồn)

# PostgreSQL Schema v2.0.1

This is the official database contract for Increment 2. It defines `sources`, `vehicles`, and `listings` and matches the TV3 17-field cleaned dataset, TV1 JPA entities, and the database documents in `docs/Database/`.

## Requirements

- PostgreSQL 14 or newer.
- A database account allowed to create tables, indexes, functions, and triggers.

## New or disposable development database

Run `schema.sql` only on a new or disposable database:

```powershell
psql -d used_car_db -f database/schema/schema.sql
```

`schema.sql` begins with `DROP TABLE ... CASCADE`. It removes existing `sources`, `vehicles`, and `listings` data and is not safe for a populated shared database.

## Existing v2.0.0 database

Back up the database, then apply the non-destructive patch once:

```powershell
psql -d used_car_db -f database/migrations/V2_0_1__schema_patch.sql
```

The migration adds `listings.image_url`, aligns identifiers to BIGINT for JPA `Long`, adds named foreign keys, and adds the v2.0.1 data constraints/indexes. It does not run the reset script.

## Verification

After bootstrapping an empty test database, run:

```powershell
psql -d used_car_db -f database/tests/schema_v2_0_1_smoke_test.sql
```

The smoke test verifies a listing with `image_url`, nullable optional fields, `UNIQUE(source_url)`, vocabulary checks, and the `updated_at` trigger. The test rolls back its sample rows.

TV1 must also start Spring Boot with `HIBERNATE_DDL_AUTO=validate` against this schema. TV3 must update the import pipeline to use the Mapping Matrix before importing the full dataset.

## Current showroom development setup

On a newly created, disposable database, run `schema.sql`, then `V3_0_0__showroom_deposit_appointment.sql`, then `V3_0_1__archive_inventory_boundary.sql`, and finally `database/seed/demo_showroom_vehicles.sql`. Never run the destructive `schema.sql` on a shared database. On an existing V3_0_0 database apply only V3_0_1 and the demo seed as needed. The seed uses ten stable `demo_key` values and may be rerun. It creates seven `AVAILABLE`, one `HOLD`, one `RESERVED`, and one `SOLD` fictional cars. It does not create real VINs or accounts. This repository currently has no users/roles table or supported authentication seed mechanism; account provisioning awaits TV4's schema.

The prior local import audit used strict/quarantine changes in `crawler/src/pipeline/import_pipeline.py` and generated artifacts under `audit/import_2026_09_30/`. Those crawler changes and audit artifacts are deliberately excluded from this database-only commit and remain in the original working directory. Do not assume this branch supports those CLI options. See the TV3 report for historical audit counts; the reproducible database-only verification is described below.

## Appointment and ledger integrity (V3_0_3)

The complete current clean bootstrap is `schema.sql` (v2.0.1), then V3_0_0, V3_0_1, V3_0_2, V3_0_3, then the demo seed. V2_0_1 is only an upgrade from v2.0.0, not another clean-bootstrap step. Existing V3_0_2 databases require only the additive V3_0_3 after data preflight. Every migration is applied once; do not rerun schema.sql or replay applied migrations on populated databases.

V3_0_2 protects positive deposit amounts and one DEPOSITED deposit per vehicle. V3_0_3 adds ledger type/status CHECKs, signed amounts for the two established CONFIRMED writers, and non-unique appointment FK/user-query indexes. It preserves appointment status PENDING/COMPLETED/CANCELLED and all existing FK delete policies. Users/roles and their FKs remain pending an agreed TV4 identity contract. See [contract, limitations and actual evidence](../guides/Appointment_Ledger_Integrity.md).

From repository root, `& .\database\tests\run_appointment_ledger_audit.ps1` creates a fresh isolated DB, runs bootstrap/migrations/seed-repeat/rollback tests and a separate failing-preflight probe, then reads the audit DB. It retains the test DBs and saves each new run under `database/evidence/appointment_ledger_20260930/<test_db>/`. No secrets are stored. The audit DB already received V3_0_3 on 30/09/2026; **do not pass -ApplyAudit again**. Do not run the mutation SQL files against shared/audit databases.


<!-- Imported TV3 review additions; preceding historical content retained. -->
# PostgreSQL schema and auth candidate
Physical OTP/reset mapping RESOLVED. Complete candidate: database/drafts/auth_database_candidate.sql. Earlier incomplete versioned executable draft was replaced with this unversioned file. TV4 reserves official V3_0_4__auth_and_otp.sql (48c8f88), absent/uncompared here. No second official V3_0_4/V3_0_5. [Integration and evidence](../guides/Auth_Identity_Integration.md).
## Official workspace bootstrap

Only on a database just CREATEd successfully as UTF8/template0 and disposable:

```powershell
$files = @('database/schema/schema.sql',
 'database/migrations/V3_0_0__showroom_deposit_appointment.sql',
 'database/migrations/V3_0_1__archive_inventory_boundary.sql',
 'database/migrations/V3_0_2__deposit_integrity.sql',
 'database/migrations/V3_0_3__appointment_ledger_integrity.sql',
 'database/seed/demo_showroom_vehicles.sql')
foreach ($file in $files) {
 & $psql -X -w -d $newDisposableDb -v ON_ERROR_STOP=1 -f $file
 if ($LASTEXITCODE -ne 0) { throw "Bootstrap failed: $file" }
}
```

V2_0_1 only upgrades v2.0.0; never replay after schema.sql. Official auth ordering not finalized until TV4/manager compares original V3_0_4 and migration history.

## Full candidate bootstrap and upgrade review

Only for isolated fixtures: above bootstrap → database/drafts/auth_database_candidate.sql → database/seed/demo_auth_accounts.sql (private BCrypt environment hash). Existing V3_0_3, contract-compatible auth or earlier partial TV3 fixture: read-only preflight → candidate → catalog/tests. No schema.sql/reset/mutation/seed on populated/shared/audit DB in this task.

```powershell
& $psql -X -w -d $env:PGDATABASE -v ON_ERROR_STOP=1 -f database/tests/auth_identity_preflight.sql
if ($LASTEXITCODE -ne 0) { throw 'Preflight failed' }
& ./database/tests/run_auth_identity_verification.ps1 -Psql $psql `
 -CryptoJar $env:SPRING_SECURITY_CRYPTO_JAR -LoggingJar $env:SPRING_JCL_JAR
```

Runner creates uniquely named UTF8 DBs and uses explicit reviewed migration allowlist. Configure psql/java/connection via parameters/PG environment/pgpass; credentials never logged. Candidate preserves compatible rows, initializes new timestamps only on explicit partial upgrade, rejects incompatible/orphan data atomically. Backup/restore/private demo setup/TV4 Hibernate integration instructions in guide.
On a newly created, disposable database, run `schema.sql`, then `V3_0_0__showroom_deposit_appointment.sql`, then `V3_0_1__archive_inventory_boundary.sql`, and finally `database/seed/demo_showroom_vehicles.sql`. Never run the destructive `schema.sql` on a shared database. On an existing V3_0_0 database apply only V3_0_1 and the demo seed as needed. The seed uses ten stable `demo_key` values and may be rerun. It creates seven `AVAILABLE`, one `HOLD`, one `RESERVED`, and one `SOLD` fictional cars. It does not create real VINs or accounts. The complete unversioned auth candidate and demo seed are available for isolated verification; official auth bootstrap awaits reconciliation with TV4 V3_0_4.
V3_0_2 protects positive deposit amounts and one DEPOSITED deposit per vehicle. V3_0_3 adds ledger type/status CHECKs, signed amounts for the two established CONFIRMED writers, and non-unique appointment FK/user-query indexes. It preserves appointment status PENDING/COMPLETED/CANCELLED and all existing FK delete policies. Physical auth contract is resolved and candidate tested separately; official migration reconciliation remains pending. See [contract, limitations and actual evidence](../guides/Appointment_Ledger_Integrity.md).
