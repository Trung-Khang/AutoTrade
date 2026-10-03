# Data Dictionary — Current Increment
## Cập nhật staff/showroom/lịch hẹn — V3_0_7 — 02/10/2026

Contract mới: [Staff Appointment Handoff](../../database/guides/Staff_Appointment_Handoff.md). Các mô tả lịch sử bên dưới về việc chưa có staff-showroom được thay thế bởi phần này.

| Table.column | Type | Nullable | Constraint |
|---|---|---|---|
| app_users.showroom_id | BIGINT | Yes | fk_app_users_showroom → showrooms.id, ON DELETE SET NULL; no default |
| appointments.assigned_staff_id | BIGINT | Yes | fk_appointments_assigned_staff → app_users.id, ON DELETE RESTRICT; no default |

`chk_appointments_status`: PENDING/SCHEDULED/COMPLETED/CANCELLED. `appointment_date` giữ TIMESTAMP WITHOUT TIME ZONE. `uq_staff_appointment_slot` UNIQUE (assigned_staff_id,appointment_date) WHERE status IN ('PENDING','SCHEDULED'); NULL vẫn cho phép lịch cũ chưa phân công. Index hỗ trợ: idx_app_users_showroom_role(showroom_id,role) WHERE active=true AND locked=false; idx_appointments_assigned_staff_date(assigned_staff_id,appointment_date,status). Không trigger/backfill hoặc thay đổi các bảng nghiệp vụ khác; role/active/locked/cùng showroom do TV4 kiểm tra.

Evidence áp dụng và catalog thực tế: `database/evidence/staff_appointments_20261002_03/result.json`. Seed tìm exact unique showroom name và giữ nguyên account đã tồn tại. V3_0_6 không chỉnh sửa/không tự áp dụng cùng V3_0_7; target preflight chưa có ràng buộc phone của V3_0_6.

## Consolidation chính thức TV3 — 01/10/2026

Baseline: `origin/main` tại `cb2c520`; checkout `AutoTrade-TV3` là worktree branch `TV3` (cùng repository với `AutoTrade`). Lịch sử TV3 `5ba28b9` đã là ancestor của main; fast-forward giữ nguyên commit cũ. Auth TV4 `48c8f88` đã merge upstream, không copy Backend/Frontend cũ từ AutoTrade-main. Không có AGENTS.md trong ba checkout hoặc các thư mục cha đã kiểm tra.

Thứ tự bootstrap mới: **schema.sql → V3_0_0 → V3_0_1 → V3_0_2 → V3_0_3 → V3_0_4 → V3_0_5 → showroom seed → auth seed**. `V2_0_1` chỉ upgrade v2.0.0, không replay sau clean schema. Existing V3_0_4 chỉ chạy `V3_0_5__auth_identity_integrity.sql` sau preflight/backup riêng. Không chạy schema/reset/seed lên database shared/audit. Repository hiện chạy migration bằng psql, chưa cấu hình Flyway; migration mới là SQL PostgreSQL thuần, không có psql include, có BEGIN/COMMIT và locks.

V3_0_4 và các migration cũ giữ nguyên. V3_0_5 kiểm tra exact 29 columns/types/defaults/nullability, từ chối incompatible schema, invalid/duplicate identities và orphan trước khi thêm integrity; không sửa/xóa rows hoặc tạo user vá dữ liệu. Giữ OTP/reset CASCADE, reset UNIQUE, OTP index `idx_auth_otps_active_lookup`; thêm username/email LOWER UNIQUE và business user RESTRICT. Chỉ bỏ ordinary `idx_password_reset_sessions_token` sau khi xác nhận đúng định nghĩa V3_0_4. Thêm CHECK required identity (email hợp lệ, full_name/password_hash không trống), username và normalized email; không thêm lifecycle trigger hoặc time-based CHECK.

Demo accounts `customer/staff/admin` chỉ local, hash BCrypt cost12 truyền qua environment; seed từ chối collision, không overwrite password/role/state. Operator phải cấp credential/hash riêng qua kênh riêng; random credential dùng trong verification không phải credential bàn giao. Schema giữ một role/user, không có staff-showroom. Soft disable bảo toàn lịch sử.

Auth fix: lưu failed OTP attempt/expiry invalidation qua cả hai transaction boundaries, khóa user khi verify để serial hóa với resend và ngăn dùng OTP đồng thời. Email normalization dùng Locale.ROOT; length validation khớp DB. Race đăng ký trả 409 cho identity UNIQUE thay vì 500. SMTP_FROM lấy từ SMTP_USERNAME nếu không được cấu hình riêng; không hard-code địa chỉ gửi hoặc secrets.

Evidence mới cho official sequence: `database/evidence/official_20261001_030621_7a31e3/`. Các bằng chứng candidate nhập dưới `database/evidence/historical/` chỉ có giá trị lịch sử. Những mô tả pending/candidate ở phần lịch sử phía dưới đã được supersede bởi mục này; không dùng candidate để bootstrap chính thức.

Dependency còn thiếu: **SMTP_USERNAME, SMTP_PASSWORD**, mailbox access/recipient để kiểm chứng nhận OTP thật. Host/port default smtp.gmail.com:587 STARTTLS; SMTP_FROM fallback SMTP_USERNAME. Activation email receipt → verify delivered OTP → login → /auth/me và real reset email: **NOT RUN**. Không fake delivery, không lộ OTP, không bypass verification. Không tuyên bố TV3/Gate2 đã hoàn tất toàn bộ.

## Lịch sử thiết kế/bàn giao (giữ nguyên nội dung nguồn)

# Data Dictionary - Increment 2, PostgreSQL Schema v2.0.1

Ngày đồng bộ: 01/10/2026
Owner: TV5

> Tài liệu này mô tả cả base schema v2.0.1 và các V3 extensions đang được dùng bởi runtime. `database/schema/schema.sql` không phải là full clean bootstrap của runtime hiện tại.

## 1. `sources`

| Column | Type | Null | Constraint |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| source_name | VARCHAR(50) | No | UNIQUE |
| base_url | VARCHAR(255) | Yes | - |
| created_at | TIMESTAMPTZ | No | default current timestamp |

## 2. `vehicles`

| Column | Type | Null | Constraint / meaning |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| vin | VARCHAR(50) | Yes | UNIQUE in V3; demo rows may rely on demo_key |
| brand | VARCHAR(50) | No | - |
| model | VARCHAR(50) | No | - |
| variant | VARCHAR(100) | Yes | - |
| manufacture_year | INT | No | Base schema 1900-2100 |
| fuel_type | VARCHAR(30) | Yes | Gasoline/Diesel/Hybrid/Electric |
| transmission | VARCHAR(30) | Yes | Automatic/Manual/CVT |
| engine_size | DOUBLE PRECISION | Yes | > 0 when present |
| seat_count | INT | Yes | 2-60 when present |
| origin | VARCHAR(50) | Yes | Domestic/Imported |
| body_type | VARCHAR(50) | Yes | TV3 normalized vocabulary |
| price | NUMERIC(15,2) | Yes | showroom price; deposit flow requires it |
| mileage | INT | Yes | non-negative when present |
| color | VARCHAR(50) | Yes | optional system field |
| image_url | VARCHAR(500) | Yes | primary display image |
| description | TEXT | Yes | showroom description |
| status | VARCHAR(20) | No | V3: ARCHIVED/AVAILABLE/HOLD/RESERVED/SOLD |
| showroom_id | BIGINT | Yes | FK `showrooms.id`, ON DELETE SET NULL |
| demo_key | VARCHAR(30) | Yes | V3_0_1 unique development seed key |
| created_at | TIMESTAMPTZ | No | default current timestamp |

## 3. `listings`

| Column | Type | Null | Constraint / meaning |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| vehicle_id | BIGINT | No | FK vehicle RESTRICT |
| source_id | BIGINT | No | FK source RESTRICT |
| price | NUMERIC(15,2) | No | > 0 |
| mileage | INT | Yes | >= 0 when present |
| color | VARCHAR(30) | Yes | optional field |
| location | VARCHAR(100) | Yes | market listing location |
| source_url | TEXT | No | UNIQUE idempotency key |
| image_url | VARCHAR(500) | Yes | primary listing image |
| listed_at_raw | TEXT | Yes | original source text |
| listed_at | TIMESTAMPTZ | Yes | only when separately verified |
| crawled_at | TIMESTAMPTZ | No | source observation time |
| created_at | TIMESTAMPTZ | No | row creation |
| updated_at | TIMESTAMPTZ | No | trigger-managed in base schema |

## 4. `showrooms`

| Column | Type | Null | Constraint |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| name | VARCHAR(100) | No | - |
| address | VARCHAR(255) | No | - |
| phone | VARCHAR(20) | Yes | - |
| city | VARCHAR(50) | Yes | - |
| created_at | TIMESTAMPTZ | No | default current timestamp |

## 5. `deposits`

| Column | Type | Null | Constraint / meaning |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| deposit_code | VARCHAR(50) | No | UNIQUE |
| vehicle_id | BIGINT | No | FK vehicle RESTRICT |
| user_id | BIGINT | No | identity scalar; **no FK yet** |
| showroom_id | BIGINT | No | FK showroom RESTRICT |
| amount | NUMERIC(15,2) | No | > 0 (V3_0_2) |
| status | VARCHAR(30) | No | PENDING/DEPOSITED/CANCELLED/REFUNDED |
| qr_code_url | VARCHAR(500) | Yes | mock QR URL |
| receipt_code | VARCHAR(50) | Yes | generated after confirm |
| contract_number | VARCHAR(50) | Yes | generated after confirm |
| created_at | TIMESTAMPTZ | No | default current timestamp |
| confirmed_at | TIMESTAMPTZ | Yes | confirm time |

## 6. `appointments`

| Column | Type | Null | Constraint / meaning |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| deposit_id | BIGINT | Yes | FK deposit SET NULL; not unique |
| user_id | BIGINT | No | identity scalar; **no FK yet** |
| vehicle_id | BIGINT | No | FK vehicle RESTRICT |
| showroom_id | BIGINT | No | FK showroom RESTRICT |
| appointment_date | TIMESTAMP | No | local date/time |
| has_test_drive | BOOLEAN | No | default false |
| status | VARCHAR(30) | No | PENDING/COMPLETED/CANCELLED |
| customer_note | VARCHAR(500) | Yes | - |
| staff_note | VARCHAR(500) | Yes | - |
| created_at | TIMESTAMPTZ | No | default current timestamp |
| updated_at | TIMESTAMPTZ | No | JPA/service updates |

## 7. `transaction_ledger`

| Column | Type | Null | Constraint / meaning |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| deposit_id | BIGINT | No | FK deposit RESTRICT |
| amount | NUMERIC(15,2) | No | V3_0_3 sign checks for relevant CONFIRMED types |
| transaction_type | VARCHAR(30) | No | DEPOSIT_RECEIVED/REFUND/FORFEIT |
| status | VARCHAR(30) | No | CONFIRMED/PROCESSED/REVERSED |
| note | VARCHAR(500) | Yes | - |
| created_at | TIMESTAMPTZ | No | default current timestamp |

## 8. `app_users`

| Column | Type | Null | Constraint / meaning |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| username | VARCHAR(50) | No | unique; login identifier |
| email | VARCHAR(254) | No | unique; lowercase by service |
| password_hash | VARCHAR(100) | No | BCrypt cost 12 |
| full_name | VARCHAR(120) | No | - |
| phone | VARCHAR(30) | Yes | optional |
| role | VARCHAR(20) | No | CUSTOMER/STAFF/ADMIN |
| active | BOOLEAN | No | account enabled flag |
| email_verified | BOOLEAN | No | required before login |
| locked | BOOLEAN | No | lock flag |
| created_at | TIMESTAMPTZ | No | default current timestamp |
| updated_at | TIMESTAMPTZ | No | app update timestamp |

## 9. `auth_otps`

| Column | Type | Null | Constraint / meaning |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| user_id | BIGINT | No | FK app_users CASCADE |
| email | VARCHAR(254) | No | copied user email at issue time |
| purpose | VARCHAR(30) | No | VERIFY_EMAIL/RESET_PASSWORD |
| code_hash | VARCHAR(64) | No | SHA-256 hex; raw OTP not stored |
| expires_at | TIMESTAMPTZ | No | 5-minute lifetime in service |
| created_at | TIMESTAMPTZ | No | default current timestamp |
| consumed_at | TIMESTAMPTZ | Yes | single-use marker |
| invalidated_at | TIMESTAMPTZ | Yes | resend/max-attempt marker |
| attempt_count | INT | No | 0-5 |
| last_sent_at | TIMESTAMPTZ | No | resend cooldown reference |

## 10. `password_reset_sessions`

| Column | Type | Null | Constraint / meaning |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| user_id | BIGINT | No | FK app_users CASCADE |
| token_hash | VARCHAR(64) | No | UNIQUE; SHA-256 of reset token |
| expires_at | TIMESTAMPTZ | No | service-configured short lifetime |
| created_at | TIMESTAMPTZ | No | default current timestamp |
| consumed_at | TIMESTAMPTZ | Yes | single-use marker |

## 11. Security and identity boundary

- Browser authentication uses `Authorization: Bearer <jwt>`.
- JWT subject is `app_users.id`.
- `SecurityUtils.currentUser()` exposes the authenticated principal to backend code.
- Current business `deposits.user_id` and `appointments.user_id` are not yet physical FKs to `app_users`.
- The current `DepositController` still exposes `X-User-Id` as a legacy input; this should be removed by owner before final integration.

## 12. Bootstrap note

Current repository does not have one SQL file that alone creates the entire runtime schema. The observed migration chain is conceptually:

```text
schema.sql
  -> V3_0_0
  -> V3_0_1
  -> V3_0_2
  -> V3_0_3
  -> V3_0_4
  -> seed
```

TV3 owns the final clean-bootstrap/reset documentation and should preserve the additive migration order.
| deposit_id | BIGINT | No | fk_ledger_deposit → deposits.id, ON DELETE RESTRICT; existing non-unique idx_ledger_deposit_id |
| amount | NUMERIC(15,2) | No | VND. For CONFIRMED only: DEPOSIT_RECEIVED > 0 and not NaN, REFUND < 0 (chk_ledger_confirmed_amount) |
| transaction_type | VARCHAR(30) | No | chk_ledger_transaction_type: DEPOSIT_RECEIVED/REFUND/FORFEIT |
| status | VARCHAR(30) | No | DEFAULT CONFIRMED; chk_ledger_status: CONFIRMED/PROCESSED/REVERSED |
| note | VARCHAR(500) | Yes | Optional transaction note |
| created_at | TIMESTAMPTZ | No | DEFAULT CURRENT_TIMESTAMP |

No amount sign restriction for FORFEIT or PROCESSED/REVERSED until TV1 defines those conventions. Multiple ledger entries per deposit are allowed; no callback/reference uniqueness key has been agreed. Enum values are storage vocabulary, not a claim that each transition/workflow exists. Sources, rationale, dependency details and actual SQL evidence are in [Appointment_Ledger_Integrity.md](../../database/guides/Appointment_Ledger_Integrity.md).


<!-- Imported TV3 review additions; preceding historical content retained. -->
# Data Dictionary - PostgreSQL, complete auth candidate
## Unversioned auth candidate — 01/10/2026

Physical OTP/reset contract RESOLVED from supplied response/request. Implementation: database/drafts/auth_database_candidate.sql. Official workspace migrations still through V3_0_3; TV4 reserves V3_0_4__auth_and_otp.sql at 48c8f88 but its SQL is absent/uncompared here. No duplicate official version or V3_0_5 dependency is created. Auth candidate and physical model below are separate from official bootstrap until reconciliation.

### app_users

| Column | Type | Nullable | Default / constraint |
|---|---|---|---|
| id | BIGSERIAL | No | PK, Java Long |
| username | VARCHAR(50) | No | Trimmed; 3–50 ASCII letter/digit/dot/underscore/hyphen; uq_app_users_username_ci on LOWER |
| email | VARCHAR(254) | No | Trimmed/lowercase; uq_app_users_email_ci on LOWER; no invented email format CHECK |
| password_hash | VARCHAR(100) | No | BCrypt, demo uses actual Spring cost12 |
| full_name | VARCHAR(120) | No | No added profile CHECK |
| phone | VARCHAR(30) | Yes | No default |
| role | VARCHAR(20) | No | DEFAULT CUSTOMER; CHECK CUSTOMER/STAFF/ADMIN |
| active | BOOLEAN | No | DEFAULT true |
| email_verified | BOOLEAN | No | DEFAULT false |
| locked | BOOLEAN | No | DEFAULT false |
| created_at | TIMESTAMPTZ | No | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMPTZ | No | DEFAULT CURRENT_TIMESTAMP; no trigger, entity @PreUpdate |

### auth_otps

| Column | Type | Nullable | Default / constraint |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| user_id | BIGINT | No | fk_auth_otps_user → app_users.id CASCADE |
| email | VARCHAR(254) | No | No extra normalization CHECK |
| purpose | VARCHAR(30) | No | chk_auth_otps_purpose: VERIFY_EMAIL/RESET_PASSWORD |
| code_hash | VARCHAR(64) | No | SHA-256 hash from TV4; no raw OTP, no invented format CHECK |
| expires_at | TIMESTAMPTZ | No | No default; service expiry policy, no NOW() CHECK |
| created_at | TIMESTAMPTZ | No | DEFAULT CURRENT_TIMESTAMP |
| consumed_at | TIMESTAMPTZ | Yes | No default |
| invalidated_at | TIMESTAMPTZ | Yes | No default |
| attempt_count | INT | No | DEFAULT 0; chk_auth_otps_attempt_count BETWEEN 0 AND 5 |
| last_sent_at | TIMESTAMPTZ | No | DEFAULT CURRENT_TIMESTAMP |

Non-unique idx_auth_otps_user_purpose_created(user_id,purpose,created_at DESC). No active-OTP uniqueness or lifecycle triggers.

### password_reset_sessions

| Column | Type | Nullable | Default / constraint |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| user_id | BIGINT | No | fk_password_reset_sessions_user → app_users.id CASCADE |
| token_hash | VARCHAR(64) | No | uq_password_reset_sessions_token_hash UNIQUE; stored hash, not raw reset token |
| expires_at | TIMESTAMPTZ | No | No default |
| created_at | TIMESTAMPTZ | No | DEFAULT CURRENT_TIMESTAMP |
| consumed_at | TIMESTAMPTZ | Yes | No default |

UNIQUE creates token lookup index; no redundant ordinary token_hash index or direct OTP FK. Business fk_deposits_user/fk_appointments_user preserve BIGINT NOT NULL → app_users.id RESTRICT; soft disable preserves both business and auth rows. Candidate reconciles compatible auth schema without row changes and explicitly upgrades earlier ten-column partial TV3; timestamp initialization uses upgrade transaction time. See [integration](../../database/guides/Auth_Identity_Integration.md).
