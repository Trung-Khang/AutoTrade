-- Acceptance-safe reviewed transactional variant; fixtures rollback.
-- Isolated official V3_0_5 only; no credentials or rows retained.
\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE stmt text; rejected boolean; name text;
BEGIN
 FOREACH stmt IN ARRAY ARRAY[
  'UPDATE app_users SET email=''invalid'' WHERE username=''customer''',
  'UPDATE app_users SET full_name='' '' WHERE username=''customer''',
  'UPDATE app_users SET password_hash='''' WHERE username=''customer'''
 ] LOOP
  rejected:=false;
  BEGIN EXECUTE stmt;
  EXCEPTION WHEN check_violation THEN
   GET STACKED DIAGNOSTICS name=CONSTRAINT_NAME;
   IF name<>'chk_app_users_required_identity' THEN RAISE EXCEPTION 'Wrong identity constraint'; END IF;
   rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Invalid required identity accepted'; END IF;
 END LOOP;
 RAISE NOTICE 'PASS required identity CHECK: invalid email, blank name/hash rejected';
END $$;
ROLLBACK;
