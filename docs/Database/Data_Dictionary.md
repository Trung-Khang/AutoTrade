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
