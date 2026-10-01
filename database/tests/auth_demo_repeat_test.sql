\set ON_ERROR_STOP on
\ir ../seed/demo_auth_accounts.sql
CREATE TEMP TABLE seed_snapshot AS SELECT * FROM public.app_users ORDER BY id;
\ir ../seed/demo_auth_accounts.sql
DO $$ BEGIN
    IF (SELECT count(*) FROM public.app_users)<>3 OR EXISTS
        ((SELECT * FROM public.app_users EXCEPT SELECT * FROM seed_snapshot)
         UNION ALL (SELECT * FROM seed_snapshot EXCEPT SELECT * FROM public.app_users)) THEN
        RAISE EXCEPTION 'Seed repeat changed accounts/IDs/hashes/state';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE username='customer' AND role='CUSTOMER')
       OR NOT EXISTS (SELECT 1 FROM public.app_users WHERE username='staff' AND role='STAFF')
       OR NOT EXISTS (SELECT 1 FROM public.app_users WHERE username='admin' AND role='ADMIN')
       OR EXISTS (SELECT 1 FROM public.app_users WHERE NOT active OR NOT email_verified OR locked
            OR full_name='' OR phone IS NULL OR email<>username||'@example.test') THEN
        RAISE EXCEPTION 'Wrong demo identities/state/profile';
    END IF;
    RAISE NOTICE 'PASS seed twice exactly three accounts, stable IDs/hashes/state';
END $$;
