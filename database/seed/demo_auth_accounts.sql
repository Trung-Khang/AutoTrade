-- LOCAL/DEMO ONLY. Hash supplied privately through environment, never plaintext.
-- Call using run_demo_auth_seed.ps1; no -v password on command line.
\set ON_ERROR_STOP on
\getenv demo_hash AUTOTRADE_DEMO_BCRYPT_HASH
BEGIN;
SET LOCAL lock_timeout = '10s';
LOCK TABLE public.app_users IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE demo_auth_expected ON COMMIT DROP AS
SELECT username, username||'@example.test' AS email, role, 'Local Demo '||username AS full_name,
       '+1-202-555-0100'::text AS phone, :'demo_hash'::text AS password_hash
FROM (VALUES ('customer','CUSTOMER'),('staff','STAFF'),('admin','ADMIN')) v(username,role);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM demo_auth_expected WHERE password_hash !~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$') THEN
        RAISE EXCEPTION 'Demo seed requires a privately generated BCrypt cost-12 hash';
    END IF;
    IF EXISTS (SELECT 1 FROM public.app_users u JOIN demo_auth_expected e
        ON lower(u.username)=e.username OR lower(u.email)=e.email
        WHERE u.username IS DISTINCT FROM e.username OR u.email IS DISTINCT FROM e.email
        OR u.password_hash IS DISTINCT FROM e.password_hash OR u.role IS DISTINCT FROM e.role
        OR u.full_name IS DISTINCT FROM e.full_name OR u.phone IS DISTINCT FROM e.phone
        OR u.active IS DISTINCT FROM true OR u.email_verified IS DISTINCT FROM true OR u.locked IS DISTINCT FROM false) THEN
        RAISE EXCEPTION 'Demo identity collision: no account/password/role/state overwritten';
    END IF;
END $$;
INSERT INTO public.app_users(username,email,password_hash,full_name,phone,role,active,email_verified,locked)
SELECT e.username,e.email,e.password_hash,e.full_name,e.phone,e.role,true,true,false FROM demo_auth_expected e
WHERE NOT EXISTS (SELECT 1 FROM public.app_users u WHERE lower(u.username)=e.username OR lower(u.email)=e.email);
COMMIT;
