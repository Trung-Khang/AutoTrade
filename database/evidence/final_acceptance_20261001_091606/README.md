# Acceptance evidence 01/10/2026 (Asia/Bangkok)

Authoritative database: autotrade_final, server DESKTOP-42GEDK2/PostgreSQL18.6.
Baseline origin/main: ab43effaabe1bff4e40c5844fd45a7a61cfc6ef0.

All nine bootstrap/seed stages PASS; actual execution timings/checksums/server in migration_manifest.executed.json, sourced from ../final_acceptance_20261001_091335/execution_log.json.
Fresh seed-before/after from that run prove two executions. This folder adds tested valid resume (no schema/migration replay), another seed rerun unchanged, independent deposit RESTRICT preservation, base inventory constraints and final live catalog.

Creation proof: ../final_acceptance_20261001_091237/. Initial runner parser failed on an empty result before schema. ../final_acceptance_20261001_091325/ proves reviewed recovery: same created OID/server and still-empty UTF8. No migration failed; no database object patched.

PASS: live catalog/Auth29; PK/FK/CHECK/UNIQUE/NULL/default/index; seeds preserve full rows and credential; deposit positive amount/one DEPOSITED; concurrent two sessions exactly one commit and one SQLSTATE23505/uq_deposits_vehicle_deposited; user/OTP/reset FKs; independent business RESTRICT with auth preservation; soft disable; eligible fixture auth CASCADE; appointment/ledger and inventory constraints; rollback/full-row equality; tagged concurrency cleanup zero residue. Sequence gaps retained.

Final inventory: 3 accounts, 10 vehicles, 3 showrooms, zero sources/listings/deposits/appointments/ledger/auth temporary rows. Demo states 7 AVAILABLE/1 HOLD/1 RESERVED/1 SOLD. See demo_vehicles.csv and final_inventory.json.

Private credentials: protected ignored .env.tv3-final.private.json at repository root; operator DELL + execution account + SYSTEM only. Retained BCrypt12 hash, no credential in this evidence. DB_PASSWORD separately in operator runtime environment.

BLOCKED: VPN route rejected by existing loopback-only HBA. Teammate connectivity NOT RUN; no teammate session. Localhost is this machine only.
NOT RUN by TV3: Backend/Hibernate/login/API/business state flows, Frontend/system/security acceptance, real SMTP/mailbox delivery.

Data_Dictionary.live.md/live_catalog.json are live physical handoff to TV5. Full scope/runtime/bootstrap/downstream ownership: ../../guides/Final_Acceptance_Handoff.md.
Final commit/push resolution after commit: sanitized ignored git_receipt.local.json; source handoff commit is the latest git log touching this folder. No main push/merge/force-push.
