-- Acceptance-safe reviewed transactional variant; fixtures rollback.
-- Only disposable databases. Synthetic hashes, never raw OTP/reset credentials.
\set ON_ERROR_STOP on
BEGIN;
CREATE FUNCTION pg_temp.expect_temp_error(stmt text,states text,cname text DEFAULT NULL,col text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE s text; c text; n text;
BEGIN
 BEGIN EXECUTE stmt;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS s=RETURNED_SQLSTATE,c=CONSTRAINT_NAME,n=COLUMN_NAME;
  IF NOT s=ANY(string_to_array(states,',')) OR (cname IS NOT NULL AND NOT c=ANY(string_to_array(cname,',')))
    OR (col IS NOT NULL AND n IS DISTINCT FROM col) THEN RAISE EXCEPTION 'Wrong error: %, %, %',s,c,n; END IF;
  RETURN;
 END;
 RAISE EXCEPTION 'Expected rejection accepted';
END $$;
CREATE TEMP TABLE temp_counts AS SELECT (SELECT count(*) FROM public.app_users) u,
 (SELECT count(*) FROM public.auth_otps) o,(SELECT count(*) FROM public.password_reset_sessions) r,
 (SELECT count(*) FROM public.deposits) d,(SELECT count(*) FROM public.appointments) a;
SAVEPOINT fixtures;
DO $$
DECLARE u bigint; o bigint; r bigint; v bigint; s bigint; d bigint; a bigint; col text; n integer;
BEGIN
 INSERT INTO public.app_users(username,email,password_hash,full_name)
 SELECT 'temp.fixture','temp.fixture@example.test',password_hash,'Temporary fixture'
 FROM public.app_users WHERE username='customer' RETURNING id INTO u;
 IF u IS NULL THEN RAISE EXCEPTION 'No seeded customer'; END IF;
 UPDATE public.app_users SET updated_at='2000-01-01' WHERE id=u;
 UPDATE public.app_users SET full_name='Updated fixture' WHERE id=u;
 IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id=u AND updated_at='2000-01-01') THEN RAISE EXCEPTION 'Unexpected updated_at trigger'; END IF;
 INSERT INTO public.auth_otps(user_id,email,purpose,code_hash,expires_at)
 VALUES (u,'temp.fixture@example.test','VERIFY_EMAIL',repeat('c',64),'2000-01-01') RETURNING id INTO o;
 IF NOT EXISTS (SELECT 1 FROM public.auth_otps WHERE id=o AND attempt_count=0 AND created_at=CURRENT_TIMESTAMP
   AND last_sent_at=CURRENT_TIMESTAMP AND consumed_at IS NULL AND invalidated_at IS NULL) THEN RAISE EXCEPTION 'OTP defaults incorrect'; END IF;
 UPDATE public.auth_otps SET purpose='RESET_PASSWORD',attempt_count=5 WHERE id=o;
 FOREACH n IN ARRAY ARRAY[-1,6] LOOP
  PERFORM pg_temp.expect_temp_error(format('UPDATE public.auth_otps SET attempt_count=%s WHERE id=%s',n,o),'23514','chk_auth_otps_attempt_count');
 END LOOP;
 PERFORM pg_temp.expect_temp_error(format('UPDATE public.auth_otps SET purpose=''OTHER'' WHERE id=%s',o),'23514','chk_auth_otps_purpose');
 FOREACH col IN ARRAY ARRAY['id','user_id','email','purpose','code_hash','expires_at','created_at','attempt_count','last_sent_at'] LOOP
  PERFORM pg_temp.expect_temp_error(format('UPDATE public.auth_otps SET %I=NULL WHERE id=%s',col,o),'23502',NULL,col);
 END LOOP;
 PERFORM pg_temp.expect_temp_error(format('UPDATE public.auth_otps SET code_hash=%L WHERE id=%s',repeat('c',65),o),'22001');
 PERFORM pg_temp.expect_temp_error('INSERT INTO public.auth_otps(user_id,email,purpose,code_hash,expires_at) VALUES (-9223372036854775808,''missing@example.test'',''VERIFY_EMAIL'',repeat(''c'',64),''2000-01-01'')','23503','fk_auth_otps_user,auth_otps_user_id_fkey');
 INSERT INTO public.password_reset_sessions(user_id,token_hash,expires_at)
 VALUES(u,repeat('d',64),'2000-01-01') RETURNING id INTO r;
 IF NOT EXISTS (SELECT 1 FROM public.password_reset_sessions WHERE id=r AND created_at=CURRENT_TIMESTAMP AND consumed_at IS NULL) THEN RAISE EXCEPTION 'Reset defaults incorrect'; END IF;
 PERFORM pg_temp.expect_temp_error(format('INSERT INTO public.password_reset_sessions(user_id,token_hash,expires_at) VALUES (%s,repeat(''d'',64),''2000-01-01'')',u),'23505','uq_password_reset_sessions_token_hash,password_reset_sessions_token_hash_key');
 FOREACH col IN ARRAY ARRAY['id','user_id','token_hash','expires_at','created_at'] LOOP
  PERFORM pg_temp.expect_temp_error(format('UPDATE public.password_reset_sessions SET %I=NULL WHERE id=%s',col,r),'23502',NULL,col);
 END LOOP;
 PERFORM pg_temp.expect_temp_error(format('UPDATE public.password_reset_sessions SET token_hash=%L WHERE id=%s',repeat('d',65),r),'22001');
 PERFORM pg_temp.expect_temp_error('INSERT INTO public.password_reset_sessions(user_id,token_hash,expires_at) VALUES (-9223372036854775808,repeat(''e'',64),''2000-01-01'')','23503','fk_password_reset_sessions_user,password_reset_sessions_user_id_fkey');
 -- Both business histories prevent deletion, including the auth CASCADE side effects.
 SELECT id,showroom_id INTO v,s FROM public.vehicles WHERE demo_key='DEMO-01';
 INSERT INTO public.deposits(deposit_code,vehicle_id,user_id,showroom_id,amount) VALUES('TEMP-RESTRICT',v,u,s,100) RETURNING id INTO d;
 INSERT INTO public.appointments(user_id,vehicle_id,showroom_id,appointment_date) VALUES(u,v,s,'2030-01-01') RETURNING id INTO a;
 PERFORM pg_temp.expect_temp_error(format('DELETE FROM public.app_users WHERE id=%s',u),'23001,23503','fk_deposits_user');
 IF NOT EXISTS (SELECT 1 FROM public.auth_otps WHERE id=o) OR NOT EXISTS (SELECT 1 FROM public.password_reset_sessions WHERE id=r)
   OR NOT EXISTS (SELECT 1 FROM public.deposits WHERE id=d) OR NOT EXISTS (SELECT 1 FROM public.appointments WHERE id=a) THEN RAISE EXCEPTION 'RESTRICT lost auth/business history'; END IF;
 UPDATE public.app_users SET active=false,locked=true WHERE id=u;
 IF NOT EXISTS (SELECT 1 FROM public.auth_otps WHERE id=o) OR NOT EXISTS (SELECT 1 FROM public.password_reset_sessions WHERE id=r)
   OR NOT EXISTS (SELECT 1 FROM public.deposits WHERE id=d) OR NOT EXISTS (SELECT 1 FROM public.appointments WHERE id=a) THEN RAISE EXCEPTION 'Soft disable lost auth/business records'; END IF;
 DELETE FROM public.deposits WHERE id=d;
 PERFORM pg_temp.expect_temp_error(format('DELETE FROM public.app_users WHERE id=%s',u),'23001,23503','fk_appointments_user');
 IF NOT EXISTS (SELECT 1 FROM public.auth_otps WHERE id=o) OR NOT EXISTS (SELECT 1 FROM public.password_reset_sessions WHERE id=r) THEN RAISE EXCEPTION 'Appointment RESTRICT lost temporary auth'; END IF;
 DELETE FROM public.appointments WHERE id=a;
 DELETE FROM public.app_users WHERE id=u;
 IF EXISTS (SELECT 1 FROM public.auth_otps WHERE id=o) OR EXISTS (SELECT 1 FROM public.password_reset_sessions WHERE id=r) THEN RAISE EXCEPTION 'CASCADE did not delete both temporary types'; END IF;
 RAISE NOTICE 'PASS timestamps/no trigger, OTP purpose/attempt 0..5/NULL/default/hash length/FK, reset UNIQUE/NULL/default/FK, both RESTRICT preservation, soft disable and CASCADE';
END $$;
ROLLBACK TO fixtures;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM temp_counts WHERE u=(SELECT count(*) FROM public.app_users) AND o=(SELECT count(*) FROM public.auth_otps)
  AND r=(SELECT count(*) FROM public.password_reset_sessions) AND d=(SELECT count(*) FROM public.deposits) AND a=(SELECT count(*) FROM public.appointments)) THEN RAISE EXCEPTION 'Full fixture rollback failed'; END IF;
 RAISE NOTICE 'PASS full auth/business rollback';
END $$;
ROLLBACK;
