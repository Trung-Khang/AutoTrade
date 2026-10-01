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

Owner: TV5. This document matches `database/schema/schema.sql` and the Mapping Matrix v2.0.1.

## `sources`

| Column | Type | Null | Constraint | Description |
|---|---|---|---|---|
| `id` | BIGSERIAL | No | PK | Source identifier. |
| `source_name` | VARCHAR(50) | No | UNIQUE | Stable source name, such as `bonbanh` or `chotot`. |
| `base_url` | VARCHAR(255) | Yes | - | Source home URL. |
| `created_at` | TIMESTAMPTZ | No | default current timestamp | Source creation time. |

## `vehicles`

| Column | Type | Null | Constraint | Unit / allowed values |
|---|---|---|---|---|
| `id` | BIGSERIAL | No | PK | - |
| `brand` | VARCHAR(50) | No | - | Vehicle brand. |
| `model` | VARCHAR(50) | No | - | Vehicle model. |
| `variant` | VARCHAR(100) | Yes | - | Trim/variant. |
| `manufacture_year` | INT | No | 1900-2100 | Year. |
| `fuel_type` | VARCHAR(30) | Yes | CHECK | `Gasoline`, `Diesel`, `Hybrid`, `Electric`, NULL. |
| `transmission` | VARCHAR(30) | Yes | CHECK | `Automatic`, `Manual`, `CVT`, NULL. |
| `engine_size` | DOUBLE PRECISION | Yes | greater than 0 when present | Liters. |
| `seat_count` | INT | Yes | 2-60 when present | Seats. |
| `origin` | VARCHAR(50) | Yes | CHECK | `Domestic`, `Imported`, NULL. |
| `body_type` | VARCHAR(50) | Yes | - | TV3 normalized body type. |
| `created_at` | TIMESTAMPTZ | No | default current timestamp | Row creation time. |

## `listings`

| Column | Type | Null | Constraint | Unit / description |
|---|---|---|---|---|
| `id` | BIGSERIAL | No | PK | Listing identifier. |
| `vehicle_id` | BIGINT | No | FK to `vehicles.id` | Vehicle configuration. |
| `source_id` | BIGINT | No | FK to `sources.id` | Crawl source. |
| `price` | NUMERIC(15,2) | No | greater than 0 | Observed listing price in VND. |
| `mileage` | INT | Yes | non-negative when present | Odometer in km. |
| `color` | VARCHAR(30) | Yes | - | Optional future system field; absent from current TV3 dataset. |
| `location` | VARCHAR(100) | Yes | - | Listing location. |
| `source_url` | TEXT | No | UNIQUE | Original listing URL and idempotency key. |
| `image_url` | VARCHAR(500) | Yes | - | Primary listing image URL from TV3. |
| `listed_at_raw` | TEXT | Yes | - | Original listing-time text from TV3 `listed_at`. |
| `listed_at` | TIMESTAMPTZ | Yes | - | Parsed and verified listing time only. |
| `crawled_at` | TIMESTAMPTZ | No | - | Crawl observation timestamp, UTC offset preserved. |
| `created_at` | TIMESTAMPTZ | No | default current timestamp | First database insertion time. |
| `updated_at` | TIMESTAMPTZ | No | trigger-managed | Last database update time. |

## Query indexes

`listings.price`, non-null `listings.mileage`, `listings.crawled_at`, and `listings.vehicle_id` support market list filtering/sorting. `vehicles(brand, model, manufacture_year)`, non-null `fuel_type`, `transmission`, and `body_type` support vehicle filters.

## Boundary with ML

Database constraints protect valid storage and source traceability. They do not apply TV4 model outlier thresholds such as maximum model mileage or price. `listed_year` is derived downstream from `crawled_at`, not stored as a duplicate dataset column.

## Showroom and archive boundary (V3_0_1)

`vehicles.status='ARCHIVED'` denotes a marketplace configuration, never depositable inventory. The public showroom query requires `AVAILABLE` and a showroom association; deposit creation also requires a showroom and price. `vehicles.demo_key` is a nullable unique development seed key, never a VIN. The ten-field archive identity is documented in the Mapping Matrix. Physical showroom vehicle identity remains separate; the demo seed does not assert real VINs. `listings` retains marketplace price, mileage and image while showroom response fields come from the physical `vehicles` row.

## Deposits integrity V3_0_2

`deposits.amount NUMERIC(15,2) NOT NULL` has `chk_deposits_amount_positive` (amount > 0). `uq_deposits_vehicle_deposited` is a unique index on vehicle_id only WHERE status='DEPOSITED'; other statuses can coexist. Existing FK vehicle/showroom uses RESTRICT. user_id remains a required BIGINT without identity FK pending TV4 contract.

## Appointments V3_0_0 through V3_0_3

| Column | Type | Null | Constraint/default and meaning |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
| deposit_id | BIGINT | Yes | fk_appointments_deposit → deposits.id, ON DELETE SET NULL; not unique |
| user_id | BIGINT | No | Identity scalar; no user FK yet |
| vehicle_id | BIGINT | No | fk_appointments_vehicle → vehicles.id, ON DELETE RESTRICT |
| showroom_id | BIGINT | No | fk_appointments_showroom → showrooms.id, ON DELETE RESTRICT |
| appointment_date | TIMESTAMP | No | Local date/time, no timezone; future-date validation belongs to creation/rescheduling workflow |
| has_test_drive | BOOLEAN | No | DEFAULT FALSE; checkbox |
| status | VARCHAR(30) | No | DEFAULT PENDING; chk_appointments_status: PENDING/COMPLETED/CANCELLED |
| customer_note, staff_note | VARCHAR(500) each | Yes | Optional notes |
| created_at, updated_at | TIMESTAMPTZ each | No | DEFAULT CURRENT_TIMESTAMP; updated_at is not DB trigger-managed |

Existing indexes: showroom_id, appointment_date, status. V3_0_3 adds non-unique indexes deposit_id, vehicle_id and `(user_id, appointment_date DESC)`. There is no appointment cardinality, cross-table identity match or lifecycle trigger. Workflow says SCHEDULED while implementation says PENDING; reconciliation remains a contract dependency.

## Transaction ledger V3_0_0 through V3_0_3

| Column | Type | Null | Constraint/default and meaning |
|---|---|---|---|
| id | BIGSERIAL | No | PK |
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
