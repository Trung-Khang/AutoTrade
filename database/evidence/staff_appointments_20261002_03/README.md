# Staff database acceptance — 02/10/2026

Target `autotrade_final`, migration V3_0_7 + demo staff seed **APPLIED / PASS**. Operator confirmed writers paused in chat. No backend/frontend/crawler edits or V3_0_6 changes.

- `manifest.json`: original identity/row fingerprints/catalog/sequences, backup SHA-256, source hashes at preparation/application, state APPLIED. Backup is private ACL-protected/Git-ignored; full rows/schema/sequences restore verified.
- `result.json`: application result, old rows unchanged, legacy appointments unassigned, exact 2/3/2 staff distribution, repeat seed unchanged. app_users 5 → 12; appointments 2, deposits 7, vehicles 3,822, listings 3,812 and all other table counts unchanged.
- `execution.json`: application execution log. Initial runner reset the preparation log on apply; logging has been fixed to append. Complete contract test execution was reproduced from the retained original pre-upgrade backup under `../staff_appointments_20261002_reverification/`. Its source is a disposable restore, not a second live upgrade. Original source hashes remain the hashes executed before the logging-only fix.
- `login_isolated_03/result.json` and `login_target/result.json`: Hibernate validate + 14 HTTP 200 STAFF logins each, by username/email, all database rows unchanged; own temporary backend processes stopped. No JWTs/password hashes retained here.
- `login_isolated/` and `login_isolated_02/`: initial probe failures from URL-safe JWT_SECRET, corrected to standard Base64; backend source unchanged. Preserve these failures as history.

Earlier database runs `../staff_appointments_20261002_01/` and `../staff_appointments_20261002_02/` failed in disposable tests: PostgreSQL 18 delete RESTRICT returns 23001 (fixture originally expected 23503), then ambiguous ORDER BY id in a test query. No live target mutations in those runs.

No staff-assignment API/RBAC/UI acceptance claimed. TV4/TV2 integration follows `../../guides/Staff_Appointment_Handoff.md`. Exact-time uniqueness does not detect overlapping appointment durations. Showroom-name mapping fails closed on absent/ambiguous names.
