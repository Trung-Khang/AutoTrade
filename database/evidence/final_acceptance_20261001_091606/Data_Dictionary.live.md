# Data Dictionary — live autotrade_final

Nguồn: live_catalog.json, truy vấn PostgreSQL 18.6 trên DESKTOP-42GEDK2. Baseline ab43effaabe1bff4e40c5844fd45a7a61cfc6ef0.

Exact defaults, SQL definitions, expression indexes/partial predicates, FK columns/delete/update policies và functions/triggers nằm trong JSON đi kèm.

## app_users

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | bigint | NO | nextval('app_users_id_seq'::regclass) |
| username | character varying(50) | NO | — |
| email | character varying(254) | NO | — |
| password_hash | character varying(100) | NO | — |
| full_name | character varying(120) | NO | — |
| phone | character varying(30) | YES | — |
| role | character varying(20) | NO | 'CUSTOMER'::character varying |
| active | boolean | NO | true |
| email_verified | boolean | NO | false |
| locked | boolean | NO | false |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |

| Constraint | Type | Definition | Delete | Update |
|---|---|---|---|---|
| app_users_active_not_null | n | NOT NULL active | — | — |
| app_users_created_at_not_null | n | NOT NULL created_at | — | — |
| app_users_email_key | u | UNIQUE (email) | — | — |
| app_users_email_not_null | n | NOT NULL email | — | — |
| app_users_email_verified_not_null | n | NOT NULL email_verified | — | — |
| app_users_full_name_not_null | n | NOT NULL full_name | — | — |
| app_users_id_not_null | n | NOT NULL id | — | — |
| app_users_locked_not_null | n | NOT NULL locked | — | — |
| app_users_password_hash_not_null | n | NOT NULL password_hash | — | — |
| app_users_pkey | p | PRIMARY KEY (id) | — | — |
| app_users_role_not_null | n | NOT NULL role | — | — |
| app_users_updated_at_not_null | n | NOT NULL updated_at | — | — |
| app_users_username_key | u | UNIQUE (username) | — | — |
| app_users_username_not_null | n | NOT NULL username | — | — |
| chk_app_users_email_normalized | c | CHECK (email::text = btrim(email::text) AND email::text = lower(email::text)) | — | — |
| chk_app_users_required_identity | c | CHECK (email::text ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'::text AND btrim(full_name::text) <> ''::text AND btrim(password_hash::text) <> ''::text) | — | — |
| chk_app_users_role | c | CHECK (role::text = ANY (ARRAY['CUSTOMER'::character varying, 'STAFF'::character varying, 'ADMIN'::character varying]::text[])) | — | — |
| chk_app_users_username | c | CHECK (username::text = btrim(username::text) AND char_length(username::text) >= 3 AND char_length(username::text) <= 50 AND username::text ~ '^[A-Za-z0-9._-]+$'::text) | — | — |

| Index | Definition | Predicate |
|---|---|---|
| app_users_email_key | CREATE UNIQUE INDEX app_users_email_key ON public.app_users USING btree (email) | — |
| app_users_pkey | CREATE UNIQUE INDEX app_users_pkey ON public.app_users USING btree (id) | — |
| app_users_username_key | CREATE UNIQUE INDEX app_users_username_key ON public.app_users USING btree (username) | — |
| uq_app_users_email_ci | CREATE UNIQUE INDEX uq_app_users_email_ci ON public.app_users USING btree (lower((email)::text)) | — |
| uq_app_users_username_ci | CREATE UNIQUE INDEX uq_app_users_username_ci ON public.app_users USING btree (lower((username)::text)) | — |

## appointments

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | bigint | NO | nextval('appointments_id_seq'::regclass) |
| deposit_id | bigint | YES | — |
| user_id | bigint | NO | — |
| vehicle_id | bigint | NO | — |
| showroom_id | bigint | NO | — |
| appointment_date | timestamp without time zone | NO | — |
| has_test_drive | boolean | NO | false |
| status | character varying(30) | NO | 'PENDING'::character varying |
| customer_note | character varying(500) | YES | — |
| staff_note | character varying(500) | YES | — |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |

| Constraint | Type | Definition | Delete | Update |
|---|---|---|---|---|
| appointments_appointment_date_not_null | n | NOT NULL appointment_date | — | — |
| appointments_created_at_not_null | n | NOT NULL created_at | — | — |
| appointments_has_test_drive_not_null | n | NOT NULL has_test_drive | — | — |
| appointments_id_not_null | n | NOT NULL id | — | — |
| appointments_pkey | p | PRIMARY KEY (id) | — | — |
| appointments_showroom_id_not_null | n | NOT NULL showroom_id | — | — |
| appointments_status_not_null | n | NOT NULL status | — | — |
| appointments_updated_at_not_null | n | NOT NULL updated_at | — | — |
| appointments_user_id_not_null | n | NOT NULL user_id | — | — |
| appointments_vehicle_id_not_null | n | NOT NULL vehicle_id | — | — |
| chk_appointments_status | c | CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying]::text[])) | — | — |
| fk_appointments_deposit | f | FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE SET NULL | SET NULL | NO ACTION |
| fk_appointments_showroom | f | FOREIGN KEY (showroom_id) REFERENCES showrooms(id) ON DELETE RESTRICT | RESTRICT | NO ACTION |
| fk_appointments_user | f | FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE RESTRICT | RESTRICT | NO ACTION |
| fk_appointments_vehicle | f | FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT | RESTRICT | NO ACTION |

| Index | Definition | Predicate |
|---|---|---|
| appointments_pkey | CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id) | — |
| idx_appointments_date | CREATE INDEX idx_appointments_date ON public.appointments USING btree (appointment_date) | — |
| idx_appointments_deposit_id | CREATE INDEX idx_appointments_deposit_id ON public.appointments USING btree (deposit_id) | — |
| idx_appointments_showroom_id | CREATE INDEX idx_appointments_showroom_id ON public.appointments USING btree (showroom_id) | — |
| idx_appointments_status | CREATE INDEX idx_appointments_status ON public.appointments USING btree (status) | — |
| idx_appointments_user_date | CREATE INDEX idx_appointments_user_date ON public.appointments USING btree (user_id, appointment_date DESC) | — |
| idx_appointments_vehicle_id | CREATE INDEX idx_appointments_vehicle_id ON public.appointments USING btree (vehicle_id) | — |

## auth_otps

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | bigint | NO | nextval('auth_otps_id_seq'::regclass) |
| user_id | bigint | NO | — |
| email | character varying(254) | NO | — |
| purpose | character varying(30) | NO | — |
| code_hash | character varying(64) | NO | — |
| expires_at | timestamp with time zone | NO | — |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| consumed_at | timestamp with time zone | YES | — |
| invalidated_at | timestamp with time zone | YES | — |
| attempt_count | integer | NO | 0 |
| last_sent_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |

| Constraint | Type | Definition | Delete | Update |
|---|---|---|---|---|
| auth_otps_attempt_count_not_null | n | NOT NULL attempt_count | — | — |
| auth_otps_code_hash_not_null | n | NOT NULL code_hash | — | — |
| auth_otps_created_at_not_null | n | NOT NULL created_at | — | — |
| auth_otps_email_not_null | n | NOT NULL email | — | — |
| auth_otps_expires_at_not_null | n | NOT NULL expires_at | — | — |
| auth_otps_id_not_null | n | NOT NULL id | — | — |
| auth_otps_last_sent_at_not_null | n | NOT NULL last_sent_at | — | — |
| auth_otps_pkey | p | PRIMARY KEY (id) | — | — |
| auth_otps_purpose_not_null | n | NOT NULL purpose | — | — |
| auth_otps_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE | CASCADE | NO ACTION |
| auth_otps_user_id_not_null | n | NOT NULL user_id | — | — |
| chk_auth_otps_attempt_count | c | CHECK (attempt_count >= 0 AND attempt_count <= 5) | — | — |
| chk_auth_otps_purpose | c | CHECK (purpose::text = ANY (ARRAY['VERIFY_EMAIL'::character varying, 'RESET_PASSWORD'::character varying]::text[])) | — | — |

| Index | Definition | Predicate |
|---|---|---|
| auth_otps_pkey | CREATE UNIQUE INDEX auth_otps_pkey ON public.auth_otps USING btree (id) | — |
| idx_auth_otps_active_lookup | CREATE INDEX idx_auth_otps_active_lookup ON public.auth_otps USING btree (user_id, purpose, created_at DESC) | — |

## deposits

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | bigint | NO | nextval('deposits_id_seq'::regclass) |
| deposit_code | character varying(50) | NO | — |
| vehicle_id | bigint | NO | — |
| user_id | bigint | NO | — |
| showroom_id | bigint | NO | — |
| amount | numeric(15,2) | NO | — |
| status | character varying(30) | NO | 'PENDING'::character varying |
| qr_code_url | character varying(500) | YES | — |
| receipt_code | character varying(50) | YES | — |
| contract_number | character varying(50) | YES | — |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| confirmed_at | timestamp with time zone | YES | — |

| Constraint | Type | Definition | Delete | Update |
|---|---|---|---|---|
| chk_deposits_amount_positive | c | CHECK (amount > 0::numeric) | — | — |
| chk_deposits_status | c | CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'DEPOSITED'::character varying, 'CANCELLED'::character varying, 'REFUNDED'::character varying]::text[])) | — | — |
| deposits_amount_not_null | n | NOT NULL amount | — | — |
| deposits_created_at_not_null | n | NOT NULL created_at | — | — |
| deposits_deposit_code_key | u | UNIQUE (deposit_code) | — | — |
| deposits_deposit_code_not_null | n | NOT NULL deposit_code | — | — |
| deposits_id_not_null | n | NOT NULL id | — | — |
| deposits_pkey | p | PRIMARY KEY (id) | — | — |
| deposits_showroom_id_not_null | n | NOT NULL showroom_id | — | — |
| deposits_status_not_null | n | NOT NULL status | — | — |
| deposits_user_id_not_null | n | NOT NULL user_id | — | — |
| deposits_vehicle_id_not_null | n | NOT NULL vehicle_id | — | — |
| fk_deposits_showroom | f | FOREIGN KEY (showroom_id) REFERENCES showrooms(id) ON DELETE RESTRICT | RESTRICT | NO ACTION |
| fk_deposits_user | f | FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE RESTRICT | RESTRICT | NO ACTION |
| fk_deposits_vehicle | f | FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT | RESTRICT | NO ACTION |

| Index | Definition | Predicate |
|---|---|---|
| deposits_deposit_code_key | CREATE UNIQUE INDEX deposits_deposit_code_key ON public.deposits USING btree (deposit_code) | — |
| deposits_pkey | CREATE UNIQUE INDEX deposits_pkey ON public.deposits USING btree (id) | — |
| idx_deposits_status | CREATE INDEX idx_deposits_status ON public.deposits USING btree (status) | — |
| idx_deposits_user_id | CREATE INDEX idx_deposits_user_id ON public.deposits USING btree (user_id) | — |
| idx_deposits_vehicle_id | CREATE INDEX idx_deposits_vehicle_id ON public.deposits USING btree (vehicle_id) | — |
| uq_deposits_vehicle_deposited | CREATE UNIQUE INDEX uq_deposits_vehicle_deposited ON public.deposits USING btree (vehicle_id) WHERE ((status)::text = 'DEPOSITED'::text) | ((status)::text = 'DEPOSITED'::text) |

## listings

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | bigint | NO | nextval('listings_id_seq'::regclass) |
| vehicle_id | bigint | NO | — |
| source_id | bigint | NO | — |
| price | numeric(15,2) | NO | — |
| mileage | integer | YES | — |
| color | character varying(30) | YES | — |
| location | character varying(100) | YES | — |
| source_url | text | NO | — |
| image_url | character varying(500) | YES | — |
| listed_at_raw | text | YES | — |
| listed_at | timestamp with time zone | YES | — |
| crawled_at | timestamp with time zone | NO | — |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |

| Constraint | Type | Definition | Delete | Update |
|---|---|---|---|---|
| chk_listings_mileage | c | CHECK (mileage IS NULL OR mileage >= 0) | — | — |
| chk_listings_price | c | CHECK (price > 0::numeric) | — | — |
| fk_listings_source | f | FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE RESTRICT | RESTRICT | NO ACTION |
| fk_listings_vehicle | f | FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT | RESTRICT | NO ACTION |
| listings_crawled_at_not_null | n | NOT NULL crawled_at | — | — |
| listings_created_at_not_null | n | NOT NULL created_at | — | — |
| listings_id_not_null | n | NOT NULL id | — | — |
| listings_pkey | p | PRIMARY KEY (id) | — | — |
| listings_price_not_null | n | NOT NULL price | — | — |
| listings_source_id_not_null | n | NOT NULL source_id | — | — |
| listings_source_url_key | u | UNIQUE (source_url) | — | — |
| listings_source_url_not_null | n | NOT NULL source_url | — | — |
| listings_updated_at_not_null | n | NOT NULL updated_at | — | — |
| listings_vehicle_id_not_null | n | NOT NULL vehicle_id | — | — |

| Index | Definition | Predicate |
|---|---|---|
| idx_listings_crawled_at | CREATE INDEX idx_listings_crawled_at ON public.listings USING btree (crawled_at DESC) | — |
| idx_listings_mileage | CREATE INDEX idx_listings_mileage ON public.listings USING btree (mileage) WHERE (mileage IS NOT NULL) | (mileage IS NOT NULL) |
| idx_listings_price | CREATE INDEX idx_listings_price ON public.listings USING btree (price) | — |
| idx_listings_vehicle_id | CREATE INDEX idx_listings_vehicle_id ON public.listings USING btree (vehicle_id) | — |
| listings_pkey | CREATE UNIQUE INDEX listings_pkey ON public.listings USING btree (id) | — |
| listings_source_url_key | CREATE UNIQUE INDEX listings_source_url_key ON public.listings USING btree (source_url) | — |

## password_reset_sessions

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | bigint | NO | nextval('password_reset_sessions_id_seq'::regclass) |
| user_id | bigint | NO | — |
| token_hash | character varying(64) | NO | — |
| expires_at | timestamp with time zone | NO | — |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| consumed_at | timestamp with time zone | YES | — |

| Constraint | Type | Definition | Delete | Update |
|---|---|---|---|---|
| password_reset_sessions_created_at_not_null | n | NOT NULL created_at | — | — |
| password_reset_sessions_expires_at_not_null | n | NOT NULL expires_at | — | — |
| password_reset_sessions_id_not_null | n | NOT NULL id | — | — |
| password_reset_sessions_pkey | p | PRIMARY KEY (id) | — | — |
| password_reset_sessions_token_hash_key | u | UNIQUE (token_hash) | — | — |
| password_reset_sessions_token_hash_not_null | n | NOT NULL token_hash | — | — |
| password_reset_sessions_user_id_fkey | f | FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE | CASCADE | NO ACTION |
| password_reset_sessions_user_id_not_null | n | NOT NULL user_id | — | — |

| Index | Definition | Predicate |
|---|---|---|
| password_reset_sessions_pkey | CREATE UNIQUE INDEX password_reset_sessions_pkey ON public.password_reset_sessions USING btree (id) | — |
| password_reset_sessions_token_hash_key | CREATE UNIQUE INDEX password_reset_sessions_token_hash_key ON public.password_reset_sessions USING btree (token_hash) | — |

## showrooms

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | bigint | NO | nextval('showrooms_id_seq'::regclass) |
| name | character varying(100) | NO | — |
| address | character varying(255) | NO | — |
| phone | character varying(20) | YES | — |
| city | character varying(50) | YES | — |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |

| Constraint | Type | Definition | Delete | Update |
|---|---|---|---|---|
| showrooms_address_not_null | n | NOT NULL address | — | — |
| showrooms_created_at_not_null | n | NOT NULL created_at | — | — |
| showrooms_id_not_null | n | NOT NULL id | — | — |
| showrooms_name_not_null | n | NOT NULL name | — | — |
| showrooms_pkey | p | PRIMARY KEY (id) | — | — |

| Index | Definition | Predicate |
|---|---|---|
| showrooms_pkey | CREATE UNIQUE INDEX showrooms_pkey ON public.showrooms USING btree (id) | — |

## sources

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | bigint | NO | nextval('sources_id_seq'::regclass) |
| source_name | character varying(50) | NO | — |
| base_url | character varying(255) | YES | — |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |

| Constraint | Type | Definition | Delete | Update |
|---|---|---|---|---|
| sources_created_at_not_null | n | NOT NULL created_at | — | — |
| sources_id_not_null | n | NOT NULL id | — | — |
| sources_pkey | p | PRIMARY KEY (id) | — | — |
| sources_source_name_key | u | UNIQUE (source_name) | — | — |
| sources_source_name_not_null | n | NOT NULL source_name | — | — |

| Index | Definition | Predicate |
|---|---|---|
| sources_pkey | CREATE UNIQUE INDEX sources_pkey ON public.sources USING btree (id) | — |
| sources_source_name_key | CREATE UNIQUE INDEX sources_source_name_key ON public.sources USING btree (source_name) | — |

## transaction_ledger

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | bigint | NO | nextval('transaction_ledger_id_seq'::regclass) |
| deposit_id | bigint | NO | — |
| amount | numeric(15,2) | NO | — |
| transaction_type | character varying(30) | NO | — |
| status | character varying(30) | NO | 'CONFIRMED'::character varying |
| note | character varying(500) | YES | — |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |

| Constraint | Type | Definition | Delete | Update |
|---|---|---|---|---|
| chk_ledger_confirmed_amount | c | CHECK (status::text <> 'CONFIRMED'::text OR (transaction_type::text <> ALL (ARRAY['DEPOSIT_RECEIVED'::character varying, 'REFUND'::character varying]::text[])) OR transaction_type::text = 'DEPOSIT_RECEIVED'::text AND amount > 0::numeric AND amount <> 'NaN'::numeric OR transaction_type::text = 'REFUND'::text AND amount < 0::numeric) | — | — |
| chk_ledger_status | c | CHECK (status::text = ANY (ARRAY['CONFIRMED'::character varying, 'PROCESSED'::character varying, 'REVERSED'::character varying]::text[])) | — | — |
| chk_ledger_transaction_type | c | CHECK (transaction_type::text = ANY (ARRAY['DEPOSIT_RECEIVED'::character varying, 'REFUND'::character varying, 'FORFEIT'::character varying]::text[])) | — | — |
| fk_ledger_deposit | f | FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE RESTRICT | RESTRICT | NO ACTION |
| transaction_ledger_amount_not_null | n | NOT NULL amount | — | — |
| transaction_ledger_created_at_not_null | n | NOT NULL created_at | — | — |
| transaction_ledger_deposit_id_not_null | n | NOT NULL deposit_id | — | — |
| transaction_ledger_id_not_null | n | NOT NULL id | — | — |
| transaction_ledger_pkey | p | PRIMARY KEY (id) | — | — |
| transaction_ledger_status_not_null | n | NOT NULL status | — | — |
| transaction_ledger_transaction_type_not_null | n | NOT NULL transaction_type | — | — |

| Index | Definition | Predicate |
|---|---|---|
| idx_ledger_deposit_id | CREATE INDEX idx_ledger_deposit_id ON public.transaction_ledger USING btree (deposit_id) | — |
| transaction_ledger_pkey | CREATE UNIQUE INDEX transaction_ledger_pkey ON public.transaction_ledger USING btree (id) | — |

## vehicles

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | bigint | NO | nextval('vehicles_id_seq'::regclass) |
| brand | character varying(50) | NO | — |
| model | character varying(50) | NO | — |
| variant | character varying(100) | YES | — |
| manufacture_year | integer | NO | — |
| fuel_type | character varying(30) | YES | — |
| transmission | character varying(30) | YES | — |
| engine_size | double precision | YES | — |
| seat_count | integer | YES | — |
| origin | character varying(50) | YES | — |
| body_type | character varying(50) | YES | — |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| vin | character varying(50) | YES | — |
| status | character varying(20) | NO | 'ARCHIVED'::character varying |
| price | numeric(15,2) | YES | — |
| mileage | integer | YES | — |
| color | character varying(50) | YES | — |
| image_url | character varying(500) | YES | — |
| description | text | YES | — |
| showroom_id | bigint | YES | — |
| demo_key | character varying(30) | YES | — |

| Constraint | Type | Definition | Delete | Update |
|---|---|---|---|---|
| chk_vehicles_engine_size | c | CHECK (engine_size IS NULL OR engine_size > 0::double precision) | — | — |
| chk_vehicles_fuel_type | c | CHECK (fuel_type IS NULL OR (fuel_type::text = ANY (ARRAY['Gasoline'::character varying, 'Diesel'::character varying, 'Hybrid'::character varying, 'Electric'::character varying]::text[]))) | — | — |
| chk_vehicles_manufacture_year | c | CHECK (manufacture_year >= 1900 AND manufacture_year <= 2100) | — | — |
| chk_vehicles_origin | c | CHECK (origin IS NULL OR (origin::text = ANY (ARRAY['Domestic'::character varying, 'Imported'::character varying]::text[]))) | — | — |
| chk_vehicles_seat_count | c | CHECK (seat_count IS NULL OR seat_count >= 2 AND seat_count <= 60) | — | — |
| chk_vehicles_status | c | CHECK (status::text = ANY (ARRAY['ARCHIVED'::character varying, 'AVAILABLE'::character varying, 'HOLD'::character varying, 'RESERVED'::character varying, 'SOLD'::character varying]::text[])) | — | — |
| chk_vehicles_transmission | c | CHECK (transmission IS NULL OR (transmission::text = ANY (ARRAY['Automatic'::character varying, 'Manual'::character varying, 'CVT'::character varying]::text[]))) | — | — |
| fk_vehicles_showroom | f | FOREIGN KEY (showroom_id) REFERENCES showrooms(id) ON DELETE SET NULL | SET NULL | NO ACTION |
| vehicles_brand_not_null | n | NOT NULL brand | — | — |
| vehicles_created_at_not_null | n | NOT NULL created_at | — | — |
| vehicles_id_not_null | n | NOT NULL id | — | — |
| vehicles_manufacture_year_not_null | n | NOT NULL manufacture_year | — | — |
| vehicles_model_not_null | n | NOT NULL model | — | — |
| vehicles_pkey | p | PRIMARY KEY (id) | — | — |
| vehicles_status_not_null | n | NOT NULL status | — | — |
| vehicles_vin_key | u | UNIQUE (vin) | — | — |

| Index | Definition | Predicate |
|---|---|---|
| idx_vehicles_body_type | CREATE INDEX idx_vehicles_body_type ON public.vehicles USING btree (body_type) WHERE (body_type IS NOT NULL) | (body_type IS NOT NULL) |
| idx_vehicles_fuel_type | CREATE INDEX idx_vehicles_fuel_type ON public.vehicles USING btree (fuel_type) WHERE (fuel_type IS NOT NULL) | (fuel_type IS NOT NULL) |
| idx_vehicles_search | CREATE INDEX idx_vehicles_search ON public.vehicles USING btree (brand, model, manufacture_year) | — |
| idx_vehicles_showroom_id | CREATE INDEX idx_vehicles_showroom_id ON public.vehicles USING btree (showroom_id) | — |
| idx_vehicles_status | CREATE INDEX idx_vehicles_status ON public.vehicles USING btree (status) | — |
| idx_vehicles_transmission | CREATE INDEX idx_vehicles_transmission ON public.vehicles USING btree (transmission) WHERE (transmission IS NOT NULL) | (transmission IS NOT NULL) |
| idx_vehicles_vin | CREATE INDEX idx_vehicles_vin ON public.vehicles USING btree (vin) | — |
| uq_vehicles_demo_key | CREATE UNIQUE INDEX uq_vehicles_demo_key ON public.vehicles USING btree (demo_key) | — |
| vehicles_pkey | CREATE UNIQUE INDEX vehicles_pkey ON public.vehicles USING btree (id) | — |
| vehicles_vin_key | CREATE UNIQUE INDEX vehicles_vin_key ON public.vehicles USING btree (vin) | — |

## Functions and triggers

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

BEGIN

    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$function$

```

```sql
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
```
