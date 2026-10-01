# Data Dictionary — Current Increment

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
