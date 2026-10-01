-- Only a runner-created disposable diagnostic DB, before auth DRAFT.
-- Intentionally lacks constraints to test reporting; not a proposed auth schema.
CREATE TABLE public.app_users (
    id BIGINT, username VARCHAR(50), email VARCHAR(254), password_hash VARCHAR(100),
    full_name VARCHAR(120), phone VARCHAR(30), role VARCHAR(20),
    active BOOLEAN, email_verified BOOLEAN, locked BOOLEAN
);
INSERT INTO public.app_users VALUES
    (101,'Duplicate','duplicate@example.test',NULL,'Audit fixture',NULL,'CUSTOMER',true,false,false),
    (102,'duplicate','DUPLICATE@example.test',NULL,NULL,NULL,'OWNER',NULL,false,false);
INSERT INTO public.deposits(deposit_code,vehicle_id,user_id,showroom_id,amount)
SELECT 'DIAGNOSTIC-ORPHAN',id,987654321,showroom_id,100 FROM public.vehicles WHERE demo_key='DEMO-01';
-- Deterministic full-row fingerprints stay within the same read-only session.
-- No hashes, OTPs, tokens or plaintext credentials are present in this fixture.
