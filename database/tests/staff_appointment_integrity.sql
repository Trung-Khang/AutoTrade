-- Disposable restored DB only. Explicit negative IDs avoid sequence changes.
\set ON_ERROR_STOP on
BEGIN;
CREATE FUNCTION pg_temp.expect_staff_error(stmt text, state text, cname text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual_state text; actual_constraint text;
BEGIN
    BEGIN EXECUTE stmt;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS actual_state=RETURNED_SQLSTATE, actual_constraint=CONSTRAINT_NAME;
        IF actual_state IS DISTINCT FROM state OR actual_constraint IS DISTINCT FROM cname THEN
            RAISE EXCEPTION 'Wrong rejection: % %', actual_state,actual_constraint;
        END IF;
        RETURN;
    END;
    RAISE EXCEPTION 'Expected rejection accepted';
END $$;
DO $$
DECLARE s bigint; u bigint; v bigint; staff bigint; other_staff bigint; prefix text;
BEGIN
    SELECT id,showroom_id INTO v,s FROM public.vehicles WHERE showroom_id IS NOT NULL ORDER BY id LIMIT 1;
    SELECT id INTO u FROM public.app_users ORDER BY id LIMIT 1;
    SELECT id INTO staff FROM public.app_users WHERE username='staff_hcm_01';
    SELECT id INTO other_staff FROM public.app_users WHERE username='staff_hcm_02';
    IF v IS NULL OR u IS NULL OR staff IS NULL OR other_staff IS NULL THEN RAISE EXCEPTION 'Missing fixtures'; END IF;
    prefix := format('INSERT INTO public.appointments(id,user_id,vehicle_id,showroom_id,appointment_date,status,assigned_staff_id) VALUES (%%s,%s,%s,%s,''2099-10-05 09:30:00'',%%L,%%s)',u,v,s);
    EXECUTE format(prefix,-71001,'PENDING',staff);
    PERFORM pg_temp.expect_staff_error(format(prefix,-71002,'PENDING',staff),'23505','uq_staff_appointment_slot');
    PERFORM pg_temp.expect_staff_error(format(prefix,-71002,'SCHEDULED',staff),'23505','uq_staff_appointment_slot');
    EXECUTE format(prefix,-71003,'SCHEDULED',other_staff);
    EXECUTE format(prefix,-71004,'COMPLETED',staff);
    EXECUTE format(prefix,-71005,'CANCELLED',staff);
    EXECUTE format(prefix,-71006,'PENDING','NULL');
    EXECUTE format(prefix,-71007,'SCHEDULED','NULL');
    PERFORM pg_temp.expect_staff_error('UPDATE public.appointments SET status=''PENDING'' WHERE id=-71004','23505','uq_staff_appointment_slot');
    PERFORM pg_temp.expect_staff_error(format('UPDATE public.appointments SET assigned_staff_id=%s WHERE id=-71003',staff),'23505','uq_staff_appointment_slot');
    UPDATE public.appointments SET status='CANCELLED' WHERE id=-71001;
    EXECUTE format(prefix,-71008,'SCHEDULED',staff);
    EXECUTE format('INSERT INTO public.appointments(id,user_id,vehicle_id,showroom_id,appointment_date,assigned_staff_id) VALUES (-71009,%s,%s,%s,''2099-10-05 10:30:00'',%s)',u,v,s,staff);
    PERFORM pg_temp.expect_staff_error('UPDATE public.appointments SET assigned_staff_id=-9223372036854775808 WHERE id=-71009','23503','fk_appointments_assigned_staff');
    PERFORM pg_temp.expect_staff_error(format('DELETE FROM public.app_users WHERE id=%s',staff),'23001','fk_appointments_assigned_staff');
    PERFORM pg_temp.expect_staff_error(format('UPDATE public.app_users SET showroom_id=-9223372036854775808 WHERE id=%s',staff),'23503','fk_app_users_showroom');
    PERFORM pg_temp.expect_staff_error('UPDATE public.appointments SET status=''UNKNOWN'' WHERE id=-71009','23514','chk_appointments_status');
    INSERT INTO public.showrooms(id,name,address) VALUES (-71000,'TV3 staff delete fixture','Disposable');
    INSERT INTO public.app_users(id,username,email,password_hash,full_name,role,showroom_id)
      SELECT -71000,'tv3_delete_staff','tv3_delete_staff@example.test',password_hash,'Disposable','STAFF',-71000
      FROM public.app_users WHERE id=staff;
    DELETE FROM public.showrooms WHERE id=-71000;
    IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id=-71000 AND showroom_id IS NULL) THEN
        RAISE EXCEPTION 'ON DELETE SET NULL failed';
    END IF;
    -- P0 deposit uniqueness still protects the vehicle independently of staff scheduling.
    INSERT INTO public.vehicles(id,brand,model,manufacture_year,status,showroom_id)
      VALUES (-71000,'TV3','P0 disposable',2020,'AVAILABLE',s);
    INSERT INTO public.deposits(id,deposit_code,user_id,vehicle_id,showroom_id,amount,status)
      VALUES (-71000,'TV3-STAFF-P0',u,-71000,s,100,'DEPOSITED');
    PERFORM pg_temp.expect_staff_error(format('INSERT INTO public.deposits(id,deposit_code,user_id,vehicle_id,showroom_id,amount,status) VALUES (-71001,''TV3-STAFF-P0-DUP'',%s,-71000,%s,100,''DEPOSITED'')',u,s),'23505','uq_deposits_vehicle_deposited');
    PERFORM pg_temp.expect_staff_error('UPDATE public.deposits SET amount=0 WHERE id=-71000','23514','chk_deposits_amount_positive');
END $$;
ROLLBACK;
