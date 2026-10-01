# ERD — Current Increment

Ngày đồng bộ: 01/10/2026

## 1. Current relational model

Nguồn đối chiếu: `database/schema/schema.sql`, migrations `V3_0_0`..`V3_0_4` và current JPA entities.

```mermaid
erDiagram
    SOURCES ||--o{ LISTINGS : provides
    VEHICLES ||--o{ LISTINGS : appears_in
    SHOWROOMS ||--o{ VEHICLES : stores
    VEHICLES ||--o{ DEPOSITS : receives
    SHOWROOMS ||--o{ DEPOSITS : selected_for
    VEHICLES ||--o{ APPOINTMENTS : scheduled_for
    SHOWROOMS ||--o{ APPOINTMENTS : hosted_at
    DEPOSITS o|--o{ APPOINTMENTS : links
    DEPOSITS ||--o{ TRANSACTION_LEDGER : generates
    APP_USERS ||--o{ AUTH_OTPS : owns
    APP_USERS ||--o{ PASSWORD_RESET_SESSIONS : owns

    SOURCES {
      bigint id PK
      varchar source_name UK
      varchar base_url
      timestamptz created_at
    }

    VEHICLES {
      bigint id PK
      varchar vin UK
      varchar brand
      varchar model
      varchar variant
      int manufacture_year
      varchar fuel_type
      varchar transmission
      double engine_size
      int seat_count
      varchar origin
      varchar body_type
      numeric price
      int mileage
      varchar color
      varchar image_url
      text description
      varchar status
      bigint showroom_id FK
      varchar demo_key UK
      timestamptz created_at
    }

    LISTINGS {
      bigint id PK
      bigint vehicle_id FK
      bigint source_id FK
      numeric price
      int mileage
      varchar color
      varchar location
      text source_url UK
      varchar image_url
      text listed_at_raw
      timestamptz listed_at
      timestamptz crawled_at
      timestamptz created_at
      timestamptz updated_at
    }

    SHOWROOMS {
      bigint id PK
      varchar name
      varchar address
      varchar phone
      varchar city
      timestamptz created_at
    }

    DEPOSITS {
      bigint id PK
      varchar deposit_code UK
      bigint vehicle_id FK
      bigint user_id
      bigint showroom_id FK
      numeric amount
      varchar status
      varchar qr_code_url
      varchar receipt_code
      varchar contract_number
      timestamptz created_at
      timestamptz confirmed_at
    }

    APPOINTMENTS {
      bigint id PK
      bigint deposit_id FK
      bigint user_id
      bigint vehicle_id FK
      bigint showroom_id FK
      timestamp appointment_date
      boolean has_test_drive
      varchar status
      varchar customer_note
      varchar staff_note
      timestamptz created_at
      timestamptz updated_at
    }

    TRANSACTION_LEDGER {
      bigint id PK
      bigint deposit_id FK
      numeric amount
      varchar transaction_type
      varchar status
      varchar note
      timestamptz created_at
    }

    APP_USERS {
      bigint id PK
      varchar username UK
      varchar email UK
      varchar password_hash
      varchar full_name
      varchar phone
      varchar role
      boolean active
      boolean email_verified
      boolean locked
      timestamptz created_at
      timestamptz updated_at
    }

    AUTH_OTPS {
      bigint id PK
      bigint user_id FK
      varchar email
      varchar purpose
      varchar code_hash
      timestamptz expires_at
      timestamptz created_at
      timestamptz consumed_at
      timestamptz invalidated_at
      int attempt_count
      timestamptz last_sent_at
    }

    PASSWORD_RESET_SESSIONS {
      bigint id PK
      bigint user_id FK
      varchar token_hash UK
      timestamptz expires_at
      timestamptz created_at
      timestamptz consumed_at
    }
```

### Physical-FK caveat

`deposits.user_id` và `appointments.user_id` hiện **chưa** có FK sang `app_users(id)` trong V3 migrations. Do đó ERD chỉ biểu diễn các FK thực tế; đây không phải omission.

## 2. Current state constraints

### Vehicle

`ARCHIVED`, `AVAILABLE`, `HOLD`, `RESERVED`, `SOLD`.

`ARCHIVED` là boundary từ V3_0_1 cho cấu hình marketplace không có showroom; không phải inventory để deposit.

### Deposit

`PENDING`, `DEPOSITED`, `CANCELLED`, `REFUNDED`.

### Appointment

`PENDING`, `COMPLETED`, `CANCELLED`.

### Auth

- Role: `CUSTOMER`, `STAFF`, `ADMIN`.
- OTP purpose: `VERIFY_EMAIL`, `RESET_PASSWORD`.

## 3. Important database findings

1. `V3_0_0` bổ sung showroom/deposit/appointment/ledger.
2. `V3_0_1` bổ sung archive boundary và `demo_key`.
3. `V3_0_2` bổ sung unique index chống nhiều `DEPOSITED` trên cùng vehicle và `amount > 0`.
4. `V3_0_3` bổ sung ledger CHECK và appointment indexes.
5. `V3_0_4` tạo `app_users`, `auth_otps`, `password_reset_sessions`.
6. `database/schema/schema.sql` vẫn là destructive v2.0.1 bootstrap cho 3 bảng market-data; muốn runtime hiện tại phải chạy thêm migration chain.
7. `user_id` của deposit/appointment là identity scalar trong business tables và chưa có physical FK tới `app_users`.

## 4. TV5 status

**ERD documentation: UPDATED / implementation-aware.**

Clean-bootstrap contract vẫn là dependency của TV3.
