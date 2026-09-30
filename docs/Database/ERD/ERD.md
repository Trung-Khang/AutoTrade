# ERD — Current Increment

Ngày đồng bộ: 30/09/2026

## 1. Current relational model

Nguồn đối chiếu: `database/schema/schema.sql` + `database/migrations/V3_0_0__showroom_deposit_appointment.sql` + current JPA entities.

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
```

## 2. Current state constraints

### Vehicle

`AVAILABLE`, `HOLD`, `RESERVED`, `SOLD`

### Deposit

`PENDING`, `DEPOSITED`, `CANCELLED`, `REFUNDED`

### Appointment

`PENDING`, `COMPLETED`, `CANCELLED`

## 3. Important database findings

1. `V3_0_0__showroom_deposit_appointment.sql` contains the current V3 business tables and vehicle extensions.
2. `database/schema/schema.sql` is still a v2.0.1 destructive bootstrap containing only `sources`, `vehicles`, `listings`.
3. Therefore the repository currently has **two schema layers that are not yet presented as one clear clean-bootstrap contract**.
4. `user_id` in `deposits`/`appointments` has no `users` table or FK in the current V3 migration.
5. The DB model has no role table/permission model yet because TV4 auth backend is not implemented.
6. These DB implementation issues belong to **TV3**; TV5's task is to keep ERD/traceability accurate and report the discrepancy.

## 4. TV5 status

**ERD documentation: PARTIAL until TV3 confirms the authoritative clean-bootstrap sequence.**
