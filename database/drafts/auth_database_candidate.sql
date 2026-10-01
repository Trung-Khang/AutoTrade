-- HISTORICAL REVIEW ONLY. Never apply after V3_0_4. Official upgrade is V3_0_5.
-- COMPLETE DATABASE CANDIDATE, UNVERSIONED; ISOLATED REVIEW ONLY.
-- TV4 reserves V3_0_4__auth_and_otp.sql at 48c8f88; its SQL is not in this checkout.
-- Supplied physical response/request resolves every column. Official reconciliation pending.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL search_path=public,pg_catalog;
SET LOCAL lock_timeout='10s';
SELECT pg_advisory_xact_lock(3040004);
DO $$
DECLARE t text;
BEGIN
 IF current_setting('server_encoding')<>'UTF8' THEN
   RAISE EXCEPTION 'Auth candidate preflight: database must use UTF8';
 END IF;
 IF to_regclass('public.deposits') IS NULL OR to_regclass('public.appointments') IS NULL
    OR to_regclass('public.idx_appointments_user_date') IS NULL THEN
   RAISE EXCEPTION 'Auth candidate preflight: require reviewed V3_0_3 baseline';
 END IF;
 -- Stable order; all locks retained until COMMIT. Existing writers finish before audit.
 LOCK TABLE public.deposits,public.appointments IN SHARE ROW EXCLUSIVE MODE;
 FOREACH t IN ARRAY ARRAY['app_users','auth_otps','password_reset_sessions'] LOOP
   IF to_regclass('public.'||t) IS NOT NULL THEN
     IF (SELECT relkind FROM pg_class WHERE oid=to_regclass('public.'||t))<>'r' THEN
       RAISE EXCEPTION 'Auth candidate preflight: incompatible relation %',t;
     END IF;
     EXECUTE format('LOCK TABLE public.%I IN SHARE ROW EXCLUSIVE MODE',t);
     IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid=to_regclass('public.'||t) AND NOT tgisinternal) THEN
       RAISE EXCEPTION 'Auth candidate preflight: incompatible lifecycle trigger on %',t;
     END IF;
   END IF;
 END LOOP;
END $$;
\set auth_audit_prefix 'CREATE TEMP TABLE auth_column_audit ON COMMIT DROP AS'
\ir ../tests/auth_contract_columns.sql
\unset auth_audit_prefix
DO $$
DECLARE t text; n bigint; partial boolean;
BEGIN
 FOREACH t IN ARRAY ARRAY['deposits','appointments'] LOOP
   IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid=('public.'||t)::regclass
       AND attname='user_id' AND atttypid='bigint'::regtype AND attnotnull AND NOT attisdropped) THEN
     RAISE EXCEPTION 'Auth candidate preflight: %.user_id must be BIGINT NOT NULL',t;
   END IF;
 END LOOP;
 IF to_regclass('public.app_users') IS NULL THEN
   FOREACH t IN ARRAY ARRAY['deposits','appointments'] LOOP
     EXECUTE format('SELECT count(*) FROM public.%I',t) INTO n;
     IF n<>0 THEN
       RAISE EXCEPTION 'Auth candidate preflight: app_users absent; % has % rows requiring identity mapping; no rows repaired',t,n;
     END IF;
   END LOOP;
 END IF;
 -- Explicit additive upgrade of the earlier TV3 partial schema only:
 -- exactly the ten original user columns, both timestamps absent, no OTP/reset yet.
 partial:=to_regclass('public.app_users') IS NOT NULL
   AND to_regclass('public.auth_otps') IS NULL AND to_regclass('public.password_reset_sessions') IS NULL
   AND NOT EXISTS (SELECT 1 FROM auth_column_audit WHERE table_name='app_users'
       AND column_name IN ('created_at','updated_at') AND present)
   AND NOT EXISTS (SELECT 1 FROM auth_column_audit WHERE table_name='app_users'
       AND column_name NOT IN ('created_at','updated_at') AND (column_matches IS DISTINCT FROM true OR default_matches IS DISTINCT FROM true));
 FOREACH t IN ARRAY ARRAY['app_users','auth_otps','password_reset_sessions'] LOOP
   IF to_regclass('public.'||t) IS NOT NULL THEN
     IF EXISTS (SELECT 1 FROM auth_column_audit WHERE table_name=t
        AND NOT (partial AND t='app_users' AND column_name IN ('created_at','updated_at'))
        AND (column_matches IS DISTINCT FROM true OR default_matches IS DISTINCT FROM true))
       OR EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid=to_regclass('public.'||t)
         AND a.attnum>0 AND NOT a.attisdropped AND NOT EXISTS
         (SELECT 1 FROM auth_column_audit e WHERE e.table_name=t AND e.column_name=a.attname)) THEN
       RAISE EXCEPTION 'Auth candidate preflight: incompatible columns/defaults on %; inspect read-only preflight',t;
     END IF;
   END IF;
 END LOOP;
 IF partial THEN
   ALTER TABLE public.app_users ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
     ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
   RAISE NOTICE 'Explicit partial-TV3 upgrade: timestamps initialized to this transaction time; prior columns/rows unchanged';
 END IF;
END $$;
DO $$ BEGIN
 IF to_regclass('public.app_users') IS NULL THEN
   CREATE TABLE public.app_users (
     id BIGSERIAL PRIMARY KEY,username VARCHAR(50) NOT NULL,email VARCHAR(254) NOT NULL,
     password_hash VARCHAR(100) NOT NULL,full_name VARCHAR(120) NOT NULL,phone VARCHAR(30),
     role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',active BOOLEAN NOT NULL DEFAULT TRUE,
     email_verified BOOLEAN NOT NULL DEFAULT FALSE,locked BOOLEAN NOT NULL DEFAULT FALSE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   );
 END IF;
 IF to_regclass('public.auth_otps') IS NULL THEN
   CREATE TABLE public.auth_otps (
     id BIGSERIAL PRIMARY KEY,user_id BIGINT NOT NULL,email VARCHAR(254) NOT NULL,
     purpose VARCHAR(30) NOT NULL,code_hash VARCHAR(64) NOT NULL,expires_at TIMESTAMPTZ NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,consumed_at TIMESTAMPTZ,
     invalidated_at TIMESTAMPTZ,attempt_count INT NOT NULL DEFAULT 0,
     last_sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   );
 END IF;
 IF to_regclass('public.password_reset_sessions') IS NULL THEN
   CREATE TABLE public.password_reset_sessions (
     id BIGSERIAL PRIMARY KEY,user_id BIGINT NOT NULL,token_hash VARCHAR(64) NOT NULL,
     expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
     consumed_at TIMESTAMPTZ
   );
 END IF;
END $$;
-- No identity repair. All data checks execute while writes are blocked.
DO $$
DECLARE t text; key text;
BEGIN
 IF EXISTS (SELECT 1 FROM public.app_users WHERE username<>btrim(username)
     OR char_length(username) NOT BETWEEN 3 AND 50 OR username!~'^[A-Za-z0-9._-]+$'
     OR email<>btrim(email) OR email<>lower(email) OR role NOT IN ('CUSTOMER','STAFF','ADMIN'))
   OR EXISTS (SELECT 1 FROM public.app_users GROUP BY lower(username) HAVING count(*)>1)
   OR EXISTS (SELECT 1 FROM public.app_users GROUP BY lower(email) HAVING count(*)>1) THEN
   RAISE EXCEPTION 'Auth candidate preflight: invalid or duplicate identity data; no rows repaired';
 END IF;
 IF EXISTS (SELECT 1 FROM public.auth_otps WHERE purpose NOT IN ('VERIFY_EMAIL','RESET_PASSWORD') OR attempt_count NOT BETWEEN 0 AND 5)
   OR EXISTS (SELECT 1 FROM public.password_reset_sessions GROUP BY token_hash HAVING count(*)>1) THEN
   RAISE EXCEPTION 'Auth candidate preflight: invalid OTP/reset data; no rows repaired';
 END IF;
 FOREACH t IN ARRAY ARRAY['deposits','appointments','auth_otps','password_reset_sessions'] LOOP
   EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I b LEFT JOIN public.app_users u ON u.id=b.user_id WHERE u.id IS NULL)',t) INTO STRICT key;
   IF key::boolean THEN
     RAISE EXCEPTION 'Auth candidate preflight: orphan user references on %; no rows repaired',t;
   END IF;
 END LOOP;
END $$;
-- Canonical definitions are parsed by PostgreSQL rather than compared as raw SQL.
CREATE TEMP TABLE auth_expected_users (LIKE public.app_users);
ALTER TABLE auth_expected_users ADD CONSTRAINT chk_app_users_username CHECK
 (username=btrim(username) AND char_length(username) BETWEEN 3 AND 50 AND username~'^[A-Za-z0-9._-]+$'),
 ADD CONSTRAINT chk_app_users_email_normalized CHECK (email=btrim(email) AND email=lower(email)),
 ADD CONSTRAINT chk_app_users_role CHECK (role IN ('CUSTOMER','STAFF','ADMIN'));
CREATE TEMP TABLE auth_expected_otps (LIKE public.auth_otps);
ALTER TABLE auth_expected_otps ADD CONSTRAINT chk_auth_otps_purpose CHECK (purpose IN ('VERIFY_EMAIL','RESET_PASSWORD')),
 ADD CONSTRAINT chk_auth_otps_attempt_count CHECK (attempt_count BETWEEN 0 AND 5);
CREATE FUNCTION pg_temp.auth_ensure_constraint(tbl text,nm text,ddl text,original_sql text DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text;
BEGIN
 SELECT pg_get_constraintdef(oid) INTO actual FROM pg_constraint WHERE conrelid=('public.'||tbl)::regclass AND conname=nm;
 IF actual IS NOT NULL AND actual<>ddl THEN
   RAISE EXCEPTION 'Auth candidate preflight: incompatible named constraint %.%',tbl,nm;
 END IF;
 IF actual IS NULL THEN
   IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=('public.'||tbl)::regclass AND pg_get_constraintdef(oid)=ddl AND convalidated) THEN RETURN; END IF;
   EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s',tbl,nm,coalesce(original_sql,ddl));
 ELSIF NOT (SELECT convalidated FROM pg_constraint WHERE conrelid=('public.'||tbl)::regclass AND conname=nm) THEN
   EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I',tbl,nm);
 END IF;
END $$;
DO $$
DECLARE r record; t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['app_users','auth_otps','password_reset_sessions'] LOOP
   -- An existing PK on another key is incompatible, not supplemented silently.
   IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=('public.'||t)::regclass AND contype='p' AND pg_get_constraintdef(oid)<>'PRIMARY KEY (id)') THEN
     RAISE EXCEPTION 'Auth candidate preflight: incompatible primary key on %',t;
   END IF;
   PERFORM pg_temp.auth_ensure_constraint(t,t||'_pkey','PRIMARY KEY (id)');
 END LOOP;
 FOR r IN SELECT CASE conrelid WHEN 'pg_temp.auth_expected_users'::regclass THEN 'app_users' ELSE 'auth_otps' END AS tbl,
      conname,pg_get_constraintdef(oid) AS ddl FROM pg_constraint
      WHERE conrelid IN ('pg_temp.auth_expected_users'::regclass,'pg_temp.auth_expected_otps'::regclass) AND contype='c' LOOP
   -- Add the original expression, not deparsed/reparsed SQL (array coercions
   -- can change representation while remaining logically equivalent).
   PERFORM pg_temp.auth_ensure_constraint(r.tbl,r.conname,r.ddl,
     CASE r.conname
       WHEN 'chk_app_users_username' THEN 'CHECK (username=btrim(username) AND char_length(username) BETWEEN 3 AND 50 AND username~''^[A-Za-z0-9._-]+$'')'
       WHEN 'chk_app_users_email_normalized' THEN 'CHECK (email=btrim(email) AND email=lower(email))'
       WHEN 'chk_app_users_role' THEN 'CHECK (role IN (''CUSTOMER'',''STAFF'',''ADMIN''))'
       WHEN 'chk_auth_otps_purpose' THEN 'CHECK (purpose IN (''VERIFY_EMAIL'',''RESET_PASSWORD''))'
       WHEN 'chk_auth_otps_attempt_count' THEN 'CHECK (attempt_count BETWEEN 0 AND 5)'
     END);
 END LOOP;
 IF EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid IN ('public.app_users'::regclass,'public.auth_otps'::regclass,'public.password_reset_sessions'::regclass)
     AND c.contype='c' AND NOT EXISTS (SELECT 1 FROM pg_constraint e WHERE e.conrelid IN ('pg_temp.auth_expected_users'::regclass,'pg_temp.auth_expected_otps'::regclass)
       AND e.contype='c' AND pg_get_constraintdef(e.oid)=pg_get_constraintdef(c.oid))) THEN
   RAISE EXCEPTION 'Auth candidate preflight: incompatible extra auth CHECK; no lifecycle constraint introduced';
 END IF;
 IF EXISTS (SELECT 1 FROM pg_index WHERE indrelid='public.auth_otps'::regclass AND indisunique AND NOT indisprimary) THEN
   RAISE EXCEPTION 'Auth candidate preflight: incompatible active-OTP uniqueness';
 END IF;
 PERFORM pg_temp.auth_ensure_constraint('password_reset_sessions','uq_password_reset_sessions_token_hash','UNIQUE (token_hash)');
 IF (SELECT count(*) FROM pg_index i JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=i.indkey[0]
      WHERE i.indrelid='public.password_reset_sessions'::regclass AND a.attname='token_hash')<>1 THEN
   RAISE EXCEPTION 'Auth candidate preflight: incompatible redundant token_hash index';
 END IF;
 -- Refuse conflicting existing user FK action/target instead of retaining it alongside a new FK.
 FOR r IN SELECT c.oid,c.conrelid::regclass AS tbl,c.confdeltype,c.confrelid FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey)
    WHERE c.contype='f' AND a.attname='user_id' AND c.conrelid IN
      ('public.deposits'::regclass,'public.appointments'::regclass,'public.auth_otps'::regclass,'public.password_reset_sessions'::regclass) LOOP
   IF r.confrelid<>'public.app_users'::regclass OR r.confdeltype<>
       (CASE WHEN r.tbl IN ('public.deposits'::regclass,'public.appointments'::regclass) THEN 'r'::"char" ELSE 'c'::"char" END)
       OR pg_get_constraintdef(r.oid)<> ('FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE '||
       CASE WHEN r.tbl IN ('public.deposits'::regclass,'public.appointments'::regclass) THEN 'RESTRICT' ELSE 'CASCADE' END) THEN
     RAISE EXCEPTION 'Auth candidate preflight: incompatible existing user FK on %',r.tbl;
   END IF;
 END LOOP;
 PERFORM pg_temp.auth_ensure_constraint('deposits','fk_deposits_user','FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE RESTRICT');
 PERFORM pg_temp.auth_ensure_constraint('appointments','fk_appointments_user','FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE RESTRICT');
 PERFORM pg_temp.auth_ensure_constraint('auth_otps','fk_auth_otps_user','FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE');
 PERFORM pg_temp.auth_ensure_constraint('password_reset_sessions','fk_password_reset_sessions_user','FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE');
END $$;
CREATE FUNCTION pg_temp.auth_ensure_index(nm text,definition text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text;
BEGIN
 IF to_regclass('public.'||nm) IS NOT NULL THEN
   SELECT pg_get_indexdef(to_regclass('public.'||nm)) INTO actual;
   IF actual IS DISTINCT FROM definition OR NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid=to_regclass('public.'||nm) AND indisvalid AND indisready) THEN
     RAISE EXCEPTION 'Auth candidate preflight: incompatible index %',nm;
   END IF;
 ELSE EXECUTE definition;
 END IF;
END $$;
SELECT pg_temp.auth_ensure_index('uq_app_users_username_ci','CREATE UNIQUE INDEX uq_app_users_username_ci ON public.app_users USING btree (lower((username)::text))');
SELECT pg_temp.auth_ensure_index('uq_app_users_email_ci','CREATE UNIQUE INDEX uq_app_users_email_ci ON public.app_users USING btree (lower((email)::text))');
SELECT pg_temp.auth_ensure_index('idx_auth_otps_user_purpose_created','CREATE INDEX idx_auth_otps_user_purpose_created ON public.auth_otps USING btree (user_id, purpose, created_at DESC)');
-- No timestamp trigger, active-OTP uniqueness, raw credentials or NOW()-based CHECK.
COMMIT;
