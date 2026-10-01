-- Acceptance-safe reviewed transactional variant; fixtures rollback.
-- Isolated disposable databases only. Fixture credentials are hashes only.
\set ON_ERROR_STOP on
BEGIN;
CREATE FUNCTION pg_temp.expect_auth_error(stmt text, state text, cname text DEFAULT NULL, col text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE s text; c text; n text;
BEGIN
    BEGIN EXECUTE stmt;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS s=RETURNED_SQLSTATE,c=CONSTRAINT_NAME,n=COLUMN_NAME;
        IF NOT s=ANY(string_to_array(state,',')) OR (cname IS NOT NULL AND NOT c=ANY(string_to_array(cname,',')))
            OR (col IS NOT NULL AND n IS DISTINCT FROM col) THEN
            RAISE EXCEPTION 'Wrong rejection: %, %, %',s,c,n;
        END IF;
        RETURN;
    END;
    RAISE EXCEPTION 'Expected rejection was accepted';
END $$;
CREATE TEMP TABLE auth_counts AS SELECT (SELECT count(*) FROM public.app_users) u,
 (SELECT count(*) FROM public.deposits) d,(SELECT count(*) FROM public.appointments) a;
SAVEPOINT fixtures;
DO $$
DECLARE u bigint; v bigint; s bigint; d bigint; a bigint; c text; p text;
BEGIN
    INSERT INTO public.app_users(username,email,password_hash,full_name)
    SELECT 'test.user-1','test.user@example.test',password_hash,'Auth Fixture'
    FROM public.app_users WHERE username='customer' RETURNING id INTO u;
    IF u IS NULL OR NOT EXISTS (SELECT 1 FROM public.app_users WHERE id=u
        AND role='CUSTOMER' AND active AND NOT email_verified AND NOT locked AND phone IS NULL
        AND created_at=CURRENT_TIMESTAMP AND updated_at=CURRENT_TIMESTAMP) THEN
        RAISE EXCEPTION 'Wrong identity defaults/fixture';
    END IF;
    PERFORM pg_temp.expect_auth_error(format('UPDATE public.app_users SET username=''TEST.USER-1'' WHERE username=''staff'''),'23505','uq_app_users_username_ci');
    PERFORM pg_temp.expect_auth_error(format('UPDATE public.app_users SET email=''test.user@example.test'' WHERE username=''staff'''),'23505','uq_app_users_email_ci,app_users_email_key');
    FOREACH c IN ARRAY ARRAY['id','username','email','password_hash','full_name','role','active','email_verified','locked','created_at','updated_at'] LOOP
        PERFORM pg_temp.expect_auth_error(format('UPDATE public.app_users SET %I=NULL WHERE id=%s',c,u),'23502',NULL,c);
    END LOOP;
    FOREACH c IN ARRAY ARRAY['ab',' test','test ','bad+name','bad name','tést'] LOOP
        PERFORM pg_temp.expect_auth_error(format('UPDATE public.app_users SET username=%L WHERE id=%s',c,u),'23514','chk_app_users_username');
    END LOOP;
    PERFORM pg_temp.expect_auth_error(format('UPDATE public.app_users SET username=%L WHERE id=%s',repeat('a',51),u),'22001');
    UPDATE public.app_users SET username=repeat('a',50) WHERE id=u;
    UPDATE public.app_users SET username='a._-9' WHERE id=u;
    FOREACH c IN ARRAY ARRAY['UPPER@example.test',' padded@example.test','padded@example.test '] LOOP
        PERFORM pg_temp.expect_auth_error(format('UPDATE public.app_users SET email=%L WHERE id=%s',c,u),'23514','chk_app_users_email_normalized');
    END LOOP;
    PERFORM pg_temp.expect_auth_error(format('UPDATE public.app_users SET role=''OWNER'' WHERE id=%s',u),'23514','chk_app_users_role');
    FOREACH c IN ARRAY ARRAY['CUSTOMER','STAFF','ADMIN'] LOOP UPDATE public.app_users SET role=c WHERE id=u; END LOOP;
    SELECT id,showroom_id INTO v,s FROM public.vehicles WHERE demo_key='DEMO-01';
    p:=format('INSERT INTO public.deposits(deposit_code,vehicle_id,user_id,showroom_id,amount) VALUES (''AUTH-TEST'',%s,',v);
    PERFORM pg_temp.expect_auth_error(p||format('-9223372036854775808,%s,100)',s),'23503','fk_deposits_user');
    INSERT INTO public.deposits(deposit_code,vehicle_id,user_id,showroom_id,amount) VALUES ('AUTH-TEST',v,u,s,100) RETURNING id INTO d;
    PERFORM pg_temp.expect_auth_error(format('DELETE FROM public.app_users WHERE id=%s',u),'23001,23503','fk_deposits_user');
    PERFORM pg_temp.expect_auth_error(format('INSERT INTO public.appointments(user_id,vehicle_id,showroom_id,appointment_date) VALUES (-9223372036854775808,%s,%s,''2030-01-01'')',v,s),'23503','fk_appointments_user');
    INSERT INTO public.appointments(user_id,vehicle_id,showroom_id,appointment_date) VALUES (u,v,s,'2030-01-01') RETURNING id INTO a;
    PERFORM pg_temp.expect_auth_error(format('UPDATE public.appointments SET user_id=-9223372036854775808 WHERE id=%s',a),'23503','fk_appointments_user');
    UPDATE public.app_users SET active=false WHERE id=u;
    IF NOT EXISTS (SELECT 1 FROM public.deposits WHERE id=d AND user_id=u)
        OR NOT EXISTS (SELECT 1 FROM public.appointments WHERE id=a AND user_id=u) THEN
        RAISE EXCEPTION 'Soft disable lost history';
    END IF;
    DELETE FROM public.deposits WHERE id=d;
    PERFORM pg_temp.expect_auth_error(format('DELETE FROM public.app_users WHERE id=%s',u),'23001,23503','fk_appointments_user');
    DELETE FROM public.appointments WHERE id=a;
    DELETE FROM public.app_users WHERE id=u;
    RAISE NOTICE 'PASS identity uniqueness/NULL/rules/defaults/FKs/RESTRICT/soft disable and unreferenced delete';
END $$;
ROLLBACK TO fixtures;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth_counts WHERE u=(SELECT count(*) FROM public.app_users)
       AND d=(SELECT count(*) FROM public.deposits) AND a=(SELECT count(*) FROM public.appointments)) THEN
        RAISE EXCEPTION 'Fixture rollback changed row counts';
    END IF;
    RAISE NOTICE 'PASS auth transaction rollback';
END $$;
ROLLBACK;
