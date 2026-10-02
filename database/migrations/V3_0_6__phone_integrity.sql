-- Normalize existing Vietnamese phone values before enforcing the registration contract.
BEGIN;
SET LOCAL search_path=public,pg_catalog;
SET LOCAL lock_timeout='10s';
SELECT pg_advisory_xact_lock(3040006);

UPDATE public.app_users
SET phone = CASE
    WHEN phone IS NULL THEN NULL
    WHEN regexp_replace(btrim(phone), '[[:space:]().-]', '', 'g') LIKE '+84%'
        THEN '0' || substring(regexp_replace(btrim(phone), '[[:space:]().-]', '', 'g') FROM 4)
    ELSE regexp_replace(btrim(phone), '[[:space:]().-]', '', 'g')
END
WHERE phone IS NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.app_users
        WHERE phone IS NOT NULL
          AND phone !~ '^(03|05|07|08|09)[0-9]{8}$'
    ) THEN
        RAISE EXCEPTION 'Cannot enforce phone contract: existing invalid phone values found';
    END IF;

    IF EXISTS (
        SELECT phone
        FROM public.app_users
        WHERE phone IS NOT NULL
        GROUP BY phone
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot enforce phone uniqueness: duplicate phone values found';
    END IF;
END $$;

ALTER TABLE public.app_users
    DROP CONSTRAINT IF EXISTS chk_app_users_phone;

ALTER TABLE public.app_users
    ADD CONSTRAINT chk_app_users_phone
    CHECK (phone IS NULL OR phone ~ '^(03|05|07|08|09)[0-9]{8}$');

CREATE UNIQUE INDEX IF NOT EXISTS uq_app_users_phone
    ON public.app_users (phone)
    WHERE phone IS NOT NULL;

COMMIT;
