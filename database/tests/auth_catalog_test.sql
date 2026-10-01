\set ON_ERROR_STOP on
BEGIN;
\set auth_audit_prefix 'CREATE TEMP TABLE catalog_audit AS'
\ir auth_contract_columns.sql
\unset auth_audit_prefix
\set auth_integrity_prefix 'CREATE TEMP TABLE integrity_audit AS'
\ir auth_contract_integrity.sql
\unset auth_integrity_prefix
DO $$
DECLARE t text; r record;
BEGIN
 IF (SELECT count(*) FROM catalog_audit)<>29 OR EXISTS (SELECT 1 FROM catalog_audit WHERE column_matches IS DISTINCT FROM true OR default_matches IS DISTINCT FROM true)
   OR EXISTS (SELECT 1 FROM integrity_audit WHERE matches IS DISTINCT FROM true) THEN
   RAISE EXCEPTION 'FAIL exact column/default catalog';
 END IF;
 FOREACH t IN ARRAY ARRAY['app_users','auth_otps','password_reset_sessions'] LOOP
   IF (SELECT count(*) FROM pg_attribute WHERE attrelid=('public.'||t)::regclass AND attnum>0 AND NOT attisdropped)<>
       (SELECT count(*) FROM catalog_audit WHERE table_name=t) THEN RAISE EXCEPTION 'Extra auth column %',t; END IF;
   IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=('public.'||t)::regclass AND contype='p' AND pg_get_constraintdef(oid)='PRIMARY KEY (id)') THEN RAISE EXCEPTION 'Wrong PK %',t; END IF;
 END LOOP;
 FOR r IN SELECT * FROM (VALUES ('deposits','r'),('appointments','r'),('auth_otps','c'),('password_reset_sessions','c')) e(tbl,action) LOOP
   IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=('public.'||r.tbl)::regclass AND contype='f' AND convalidated
     AND confrelid='public.app_users'::regclass AND confdeltype::text=r.action
     AND pg_get_constraintdef(oid)='FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE '||CASE r.action WHEN 'r' THEN 'RESTRICT' ELSE 'CASCADE' END) THEN
     RAISE EXCEPTION 'Wrong user FK %',r.tbl;
   END IF;
 END LOOP;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.password_reset_sessions'::regclass AND contype='u' AND convalidated AND pg_get_constraintdef(oid)='UNIQUE (token_hash)')
    OR (SELECT count(*) FROM pg_index i JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=i.indkey[0]
       WHERE i.indrelid='public.password_reset_sessions'::regclass AND a.attname='token_hash')<>1 THEN RAISE EXCEPTION 'Wrong/reset redundant token index'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='auth_otps' AND indexdef='CREATE INDEX idx_auth_otps_active_lookup ON public.auth_otps USING btree (user_id, purpose, created_at DESC)') THEN
   RAISE EXCEPTION 'Wrong OTP lookup index'; END IF;
 IF EXISTS (SELECT 1 FROM pg_index WHERE indrelid='public.auth_otps'::regclass AND indisunique AND NOT indisprimary)
   OR EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid IN ('public.app_users'::regclass,'public.auth_otps'::regclass,'public.password_reset_sessions'::regclass) AND NOT tgisinternal)
   OR EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid IN ('public.app_users'::regclass,'public.auth_otps'::regclass,'public.password_reset_sessions'::regclass) AND contype='c' AND pg_get_constraintdef(oid)~*'now\(|current_timestamp|expires_at') THEN
   RAISE EXCEPTION 'Invented unique/lifecycle trigger or time-dependent check'; END IF;
 RAISE NOTICE 'PASS exact 29 columns/defaults/PKs/4 FK policies/reset UNIQUE/OTP index; no duplicate token index or lifecycle trigger/time CHECK';
END $$;
ROLLBACK;
