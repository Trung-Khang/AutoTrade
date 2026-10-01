-- Mutation test: ONLY the new isolated disposable database, never shared/audit DB.
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE tv3_counts AS SELECT
    (SELECT count(*) FROM public.showrooms) s,
    (SELECT count(*) FROM public.vehicles) v,
    (SELECT count(*) FROM public.deposits) d,
    (SELECT count(*) FROM public.appointments) a,
    (SELECT count(*) FROM public.transaction_ledger) l;
-- Every negative case verifies SQLSTATE and constraint name (or NULL column).
CREATE FUNCTION pg_temp.expect_error(stmt text, expected_state text, expected_name text,
                                     expected_column text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE actual_state text; actual_name text; actual_column text;
BEGIN
    BEGIN
        EXECUTE stmt;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS actual_state=RETURNED_SQLSTATE,
            actual_name=CONSTRAINT_NAME, actual_column=COLUMN_NAME;
        IF NOT (actual_state = ANY(string_to_array(expected_state, ',')))
           OR (expected_name IS NOT NULL AND actual_name IS DISTINCT FROM expected_name)
           OR (expected_column IS NOT NULL AND actual_column IS DISTINCT FROM expected_column) THEN
            RAISE EXCEPTION 'Wrong rejection: state %, constraint %, column %',
                actual_state, actual_name, actual_column;
        END IF;
        RAISE NOTICE 'PASS rejection: % % %', actual_state, actual_name, actual_column;
        RETURN;
    END;
    RAISE EXCEPTION 'FAIL accepted: %', stmt;
END $$;
SAVEPOINT fixtures;
DO $$
DECLARE s bigint; v bigint; d bigint; a bigint; x text; y text; n numeric;
        cols text; prefix text; missing bigint := -9223372036854775808;
BEGIN
    -- user_id is an opaque scalar fixture, NOT a fake referenced user/account.
    -- User FK cannot be tested until TV4 supplies an agreed identity contract.
    INSERT INTO public.showrooms(name,address) VALUES ('TV3 disposable','Test') RETURNING id INTO s;
    INSERT INTO public.vehicles(brand,model,manufacture_year,showroom_id,status)
        VALUES ('TV3','Test',2020,s,'AVAILABLE') RETURNING id INTO v;
    INSERT INTO public.deposits(deposit_code,vehicle_id,user_id,showroom_id,amount)
        VALUES ('TV3-LEDGER-' || v,v,(SELECT id FROM public.app_users WHERE username='customer'),s,100) RETURNING id INTO d;
    prefix := format('INSERT INTO public.transaction_ledger(deposit_id,amount,transaction_type,status) VALUES (%s,',d);
    FOREACH x IN ARRAY ARRAY['DEPOSIT_RECEIVED','REFUND','FORFEIT'] LOOP
        FOREACH y IN ARRAY ARRAY['CONFIRMED','PROCESSED','REVERSED'] LOOP
            n := CASE WHEN x='REFUND' THEN -100 ELSE 100 END;
            EXECUTE prefix || format('%s,%L,%L)',n,x,y);
        END LOOP;
    END LOOP;
    -- Multiple rows per deposit remain legal; no invented UNIQUE/reference rule.
    EXECUTE prefix || '100,''DEPOSIT_RECEIVED'',''CONFIRMED'')';
    PERFORM pg_temp.expect_error(prefix || '100,''UNKNOWN'',''CONFIRMED'')','23514','chk_ledger_transaction_type');
    PERFORM pg_temp.expect_error(prefix || '100,''DEPOSIT_RECEIVED'',''UNKNOWN'')','23514','chk_ledger_status');
    FOREACH n IN ARRAY ARRAY[0,-100] LOOP
        PERFORM pg_temp.expect_error(prefix || format('%s,''DEPOSIT_RECEIVED'',''CONFIRMED'')',n),'23514','chk_ledger_confirmed_amount');
    END LOOP;
    FOREACH n IN ARRAY ARRAY[0,100] LOOP
        PERFORM pg_temp.expect_error(prefix || format('%s,''REFUND'',''CONFIRMED'')',n),'23514','chk_ledger_confirmed_amount');
    END LOOP;
    FOREACH x IN ARRAY ARRAY['DEPOSIT_RECEIVED','REFUND'] LOOP
        PERFORM pg_temp.expect_error(prefix || format('''NaN'',%L,''CONFIRMED'')',x),'23514','chk_ledger_confirmed_amount');
    END LOOP;
    -- Amount sign for other statuses/FORFEIT is deliberately not established.
    EXECUTE prefix || '-100,''DEPOSIT_RECEIVED'',''REVERSED'')';
    EXECUTE prefix || '100,''REFUND'',''PROCESSED'')';
    EXECUTE prefix || '0,''FORFEIT'',''CONFIRMED'')';
    PERFORM pg_temp.expect_error(format('INSERT INTO public.transaction_ledger(deposit_id,amount,transaction_type) VALUES (%s,100,''DEPOSIT_RECEIVED'')',missing),'23503','fk_ledger_deposit');
    -- PostgreSQL 18 reports restrict_violation (23001); older releases use 23503.
    PERFORM pg_temp.expect_error(format('DELETE FROM public.deposits WHERE id=%s',d),'23001,23503','fk_ledger_deposit');
    FOREACH x IN ARRAY ARRAY['deposit_id','amount','transaction_type','status'] LOOP
        PERFORM pg_temp.expect_error(format('UPDATE public.transaction_ledger SET %I=NULL WHERE deposit_id=%s',x,d),'23502',NULL,x);
    END LOOP;
    RAISE NOTICE 'PASS ledger valid type/status combinations, signed confirmed amounts, defaults/cardinality boundaries';

    cols := 'user_id,vehicle_id,showroom_id,appointment_date,deposit_id';
    EXECUTE format('INSERT INTO public.appointments(%s) VALUES ((SELECT id FROM public.app_users WHERE username=''customer''),%s,%s,''2030-01-01'',%s)',cols,v,s,d);
    SELECT id INTO a FROM public.appointments WHERE deposit_id=d;
    IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE id=a AND status='PENDING' AND has_test_drive=false) THEN
        RAISE EXCEPTION 'Wrong appointment defaults';
    END IF;
    FOREACH x IN ARRAY ARRAY['PENDING','COMPLETED','CANCELLED'] LOOP
        UPDATE public.appointments SET status=x WHERE id=a;
    END LOOP;
    PERFORM pg_temp.expect_error(format('UPDATE public.appointments SET status=''UNKNOWN'' WHERE id=%s',a),'23514','chk_appointments_status');
    FOREACH x IN ARRAY ARRAY['user_id','vehicle_id','showroom_id','appointment_date','has_test_drive','status'] LOOP
        PERFORM pg_temp.expect_error(format('UPDATE public.appointments SET %I=NULL WHERE id=%s',x,a),'23502',NULL,x);
    END LOOP;
    FOREACH x IN ARRAY ARRAY['deposit_id','vehicle_id','showroom_id'] LOOP
        y := CASE x WHEN 'deposit_id' THEN 'fk_appointments_deposit' WHEN 'vehicle_id' THEN 'fk_appointments_vehicle' ELSE 'fk_appointments_showroom' END;
        PERFORM pg_temp.expect_error(format('UPDATE public.appointments SET %I=%s WHERE id=%s',x,missing,a),'23503',y);
    END LOOP;
    -- Remove ledger/deposit before RESTRICT tests to isolate appointment FK.
    DELETE FROM public.transaction_ledger WHERE deposit_id=d;
    DELETE FROM public.deposits WHERE id=d;
    IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE id=a AND deposit_id IS NULL) THEN
        RAISE EXCEPTION 'FAIL appointment ON DELETE SET NULL';
    END IF;
    PERFORM pg_temp.expect_error(format('DELETE FROM public.vehicles WHERE id=%s',v),'23001,23503','fk_appointments_vehicle');
    PERFORM pg_temp.expect_error(format('DELETE FROM public.showrooms WHERE id=%s',s),'23001,23503','fk_appointments_showroom');
    -- Nullable deposit, repeated appointment and historical date remain valid storage.
    EXECUTE format('INSERT INTO public.appointments(%s) VALUES ((SELECT id FROM public.app_users WHERE username=''customer''),%s,%s,''2000-01-01'',NULL)',cols,v,s);
    RAISE NOTICE 'PASS appointment defaults/status/NULL/FKs, SET NULL and RESTRICT; no lifecycle or uniqueness restriction';
END $$;
ROLLBACK TO SAVEPOINT fixtures;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tv3_counts WHERE
        s=(SELECT count(*) FROM public.showrooms) AND v=(SELECT count(*) FROM public.vehicles)
        AND d=(SELECT count(*) FROM public.deposits) AND a=(SELECT count(*) FROM public.appointments)
        AND l=(SELECT count(*) FROM public.transaction_ledger)) THEN
        RAISE EXCEPTION 'FAIL fixture rollback row counts';
    END IF;
    IF EXISTS (SELECT 1 FROM (VALUES
        ('idx_appointments_deposit_id','CREATE INDEX idx_appointments_deposit_id ON public.appointments USING btree (deposit_id)'),
        ('idx_appointments_vehicle_id','CREATE INDEX idx_appointments_vehicle_id ON public.appointments USING btree (vehicle_id)'),
        ('idx_appointments_user_date','CREATE INDEX idx_appointments_user_date ON public.appointments USING btree (user_id, appointment_date DESC)')
    ) expected(name,definition) LEFT JOIN pg_indexes p ON p.schemaname='public' AND p.indexname=expected.name
      WHERE p.indexdef IS DISTINCT FROM expected.definition) THEN
        RAISE EXCEPTION 'FAIL appointment index definitions';
    END IF;
    RAISE NOTICE 'PASS rollback counts and three non-unique appointment index definitions';
END $$;
ROLLBACK;
