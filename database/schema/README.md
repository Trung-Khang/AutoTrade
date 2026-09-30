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
