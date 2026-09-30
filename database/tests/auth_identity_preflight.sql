-- READ ONLY: safe for existing databases. Never prints password/token/hash data.
\set ON_ERROR_STOP on
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT current_database() AS database, version() AS server,
       current_setting('server_encoding') AS database_encoding,
       current_setting('client_encoding') AS client_encoding,
       current_setting('server_encoding')='UTF8' AS encoding_ready;
SELECT name, to_regclass('public.'||name) AS relation FROM
    (VALUES ('app_users'),('auth_otps'),('password_reset_sessions'),('deposits'),('appointments')) t(name);
SELECT table_name,column_name,data_type,character_maximum_length,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='public'
    AND table_name IN ('app_users','auth_otps','password_reset_sessions') ORDER BY table_name,ordinal_position;
SELECT c.relname, conname, convalidated, pg_get_constraintdef(k.oid) AS definition
FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('app_users','auth_otps','password_reset_sessions','deposits','appointments')
ORDER BY c.relname,conname;
SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public'
AND tablename IN ('app_users','auth_otps','password_reset_sessions','deposits','appointments') ORDER BY tablename,indexname;
-- Complete supplied physical contract, including timestamps and both temporary tables.
\ir auth_contract_columns.sql
\ir auth_contract_integrity.sql
SELECT c.relname AS table_name,a.attname AS unexpected_column
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
WHERE n.nspname='public' AND c.relname IN ('app_users','auth_otps','password_reset_sessions')
AND NOT a.attname=ANY(CASE c.relname
 WHEN 'app_users' THEN ARRAY['id','username','email','password_hash','full_name','phone','role','active','email_verified','locked','created_at','updated_at']
 WHEN 'auth_otps' THEN ARRAY['id','user_id','email','purpose','code_hash','expires_at','created_at','consumed_at','invalidated_at','attempt_count','last_sent_at']
 ELSE ARRAY['id','user_id','token_hash','expires_at','created_at','consumed_at'] END);
DO $$
DECLARE t text; r record; cols integer; invalid bigint;
BEGIN
    IF to_regclass('public.app_users') IS NULL THEN
        RAISE NOTICE 'app_users ABSENT: cannot perform orphan joins. Every existing business row requires identity mapping.';
    ELSE
        -- Check types before invoking lower/btrim or comparing business BIGINT IDs.
        -- An incompatible local table must be reported, not crash a read-only audit.
        SELECT count(*) INTO cols FROM pg_attribute a JOIN (VALUES
            ('id','bigint'),('username','character varying(50)'),('email','character varying(254)'),
            ('password_hash','character varying(100)'),('full_name','character varying(120)'),
            ('role','character varying(20)'),('active','boolean'),('email_verified','boolean'),('locked','boolean')
        ) e(name,typ) ON e.name=a.attname AND format_type(a.atttypid,a.atttypmod)=e.typ
        WHERE a.attrelid=to_regclass('public.app_users') AND NOT a.attisdropped;
        IF cols=9 THEN
            FOR r IN EXECUTE 'SELECT lower(username) AS identity, count(*) AS n FROM public.app_users GROUP BY lower(username) HAVING count(*)>1' LOOP
                RAISE NOTICE 'duplicate username: %, count %',r.identity,r.n;
            END LOOP;
            FOR r IN EXECUTE 'SELECT lower(email) AS identity, count(*) AS n FROM public.app_users GROUP BY lower(email) HAVING count(*)>1' LOOP
                RAISE NOTICE 'duplicate email: %, count %',r.identity,r.n;
            END LOOP;
            EXECUTE $q$SELECT count(*) FROM public.app_users WHERE id IS NULL OR username IS NULL OR email IS NULL
             OR password_hash IS NULL OR full_name IS NULL OR role IS NULL OR active IS NULL OR email_verified IS NULL OR locked IS NULL
             OR username<>btrim(username) OR char_length(username) NOT BETWEEN 3 AND 50 OR username!~'^[A-Za-z0-9._-]+$'
             OR email<>btrim(email) OR email<>lower(email) OR role NOT IN ('CUSTOMER','STAFF','ADMIN')$q$ INTO invalid;
            RAISE NOTICE 'invalid required/normalization/role/state rows: %',invalid;
        ELSE
            RAISE NOTICE 'app_users INCOMPATIBLE columns: data checks skipped; inspect catalog above';
        END IF;
    END IF;
    IF to_regclass('public.auth_otps') IS NOT NULL THEN
        IF (SELECT count(*) FROM pg_attribute WHERE attrelid=to_regclass('public.auth_otps') AND attnum>0 AND NOT attisdropped
            AND attname IN ('id','user_id','email','purpose','code_hash','expires_at','created_at','attempt_count','last_sent_at'))=9 THEN
            EXECUTE 'SELECT count(*) FROM public.auth_otps WHERE id IS NULL OR user_id IS NULL OR email IS NULL OR purpose IS NULL OR code_hash IS NULL OR expires_at IS NULL OR created_at IS NULL OR attempt_count IS NULL OR last_sent_at IS NULL' INTO invalid;
            RAISE NOTICE 'invalid OTP required rows: %',invalid;
        END IF;
        IF (SELECT count(*) FROM pg_attribute WHERE attrelid=to_regclass('public.auth_otps') AND NOT attisdropped
            AND ((attname='purpose' AND atttypid IN ('text'::regtype,'varchar'::regtype))
              OR (attname='attempt_count' AND atttypid='integer'::regtype)))=2 THEN
            EXECUTE 'SELECT count(*) FROM public.auth_otps WHERE purpose IS NULL OR purpose NOT IN (''VERIFY_EMAIL'',''RESET_PASSWORD'') OR attempt_count IS NULL OR attempt_count NOT BETWEEN 0 AND 5' INTO invalid;
            RAISE NOTICE 'invalid OTP purpose/counter rows: %',invalid;
        ELSE RAISE NOTICE 'auth_otps INCOMPATIBLE purpose/counter types: data check skipped';
        END IF;
    END IF;
    IF to_regclass('public.password_reset_sessions') IS NOT NULL THEN
        IF (SELECT count(*) FROM pg_attribute WHERE attrelid=to_regclass('public.password_reset_sessions') AND attnum>0 AND NOT attisdropped
            AND attname IN ('id','user_id','token_hash','expires_at','created_at'))=5 THEN
            EXECUTE 'SELECT count(*) FROM public.password_reset_sessions WHERE id IS NULL OR user_id IS NULL OR token_hash IS NULL OR expires_at IS NULL OR created_at IS NULL' INTO invalid;
            RAISE NOTICE 'invalid reset required rows: %',invalid;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public.password_reset_sessions')
            AND attname='token_hash' AND atttypid IN ('text'::regtype,'varchar'::regtype) AND NOT attisdropped) THEN
            -- Never print a token hash, even for duplicates.
            EXECUTE 'SELECT count(*) FROM (SELECT token_hash FROM public.password_reset_sessions GROUP BY token_hash HAVING count(*)>1) d' INTO invalid;
            RAISE NOTICE 'duplicate reset token_hash groups: %',invalid;
        ELSE RAISE NOTICE 'password_reset_sessions INCOMPATIBLE token_hash type: check skipped';
        END IF;
    END IF;
    FOREACH t IN ARRAY ARRAY['deposits','appointments','auth_otps','password_reset_sessions'] LOOP
        IF to_regclass('public.'||t) IS NULL THEN
            RAISE NOTICE '% ABSENT: baseline not ready',t;
        ELSIF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public.'||t)
            AND attname='user_id' AND atttypid='bigint'::regtype AND attnotnull AND NOT attisdropped) THEN
            RAISE NOTICE '%.user_id INCOMPATIBLE: require BIGINT NOT NULL; orphan query skipped',t;
        ELSIF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public.app_users')
            AND attname='id' AND atttypid='bigint'::regtype AND NOT attisdropped) THEN
            FOR r IN EXECUTE format('SELECT user_id,count(*) AS n FROM public.%I GROUP BY user_id ORDER BY user_id',t) LOOP
                RAISE NOTICE '% identity mapping/review required (app_users ID absent/incompatible): user_id %, count %',t,r.user_id,r.n;
            END LOOP;
        ELSE
            FOR r IN EXECUTE format('SELECT b.user_id,count(*) AS n FROM public.%I b LEFT JOIN public.app_users u ON u.id=b.user_id WHERE u.id IS NULL GROUP BY b.user_id ORDER BY b.user_id',t) LOOP
                RAISE NOTICE '% orphan: user_id %, count %',t,r.user_id,r.n;
            END LOOP;
        END IF;
    END LOOP;
    RAISE NOTICE 'Physical mapping RESOLVED. Candidate supports clean/compatible/explicit partial-TV3 upgrades; column/default mismatches and orphan/invalid data block apply. Official V3_0_4 SQL reconciliation remains pending; inspect constraints/index catalog, not just data counts.';
END $$;
ROLLBACK;
