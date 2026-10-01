-- Acceptance-safe reviewed transactional variant; fixtures rollback.
BEGIN;
INSERT INTO vehicles(brand,model,manufacture_year,showroom_id,status,demo_key) VALUES('TV3','Final transactional fixture',2020,1,'AVAILABLE','TV3-FINAL-ROLLBACK');

DO $$
DECLARE
    v_vehicle BIGINT;
    v_showroom BIGINT;
    v_code TEXT := 'TV3_TEST_' || md5(random()::text);
    v_constraint TEXT;
BEGIN
    SELECT v.id, v.showroom_id
    INTO v_vehicle, v_showroom
    FROM public.vehicles v
    WHERE v.demo_key = 'TV3-FINAL-ROLLBACK' AND v.status = 'AVAILABLE'
      AND v.showroom_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM public.deposits d
          WHERE d.vehicle_id = v.id AND d.status = 'DEPOSITED'
      )
    ORDER BY v.id
    LIMIT 1;

    IF v_vehicle IS NULL THEN
        RAISE EXCEPTION 'Khong co xe AVAILABLE phu hop de test';
    END IF;

    INSERT INTO public.deposits
        (deposit_code, vehicle_id, user_id, showroom_id, amount, status)
    VALUES
        (v_code, v_vehicle, (SELECT id FROM public.app_users WHERE username='customer'), v_showroom, 1000000, 'DEPOSITED');

    BEGIN
        INSERT INTO public.deposits
            (deposit_code, vehicle_id, user_id, showroom_id, amount, status)
        VALUES
            (v_code || '_2', v_vehicle, (SELECT id FROM public.app_users WHERE username='customer'), v_showroom, 1000000, 'DEPOSITED');

        RAISE EXCEPTION 'FAIL: Chap nhan hai coc DEPOSITED cho cung xe';
    EXCEPTION WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint <> 'uq_deposits_vehicle_deposited' THEN
            RAISE;
        END IF;
        RAISE NOTICE 'PASS: Chan coc DEPOSITED trung xe';
    END;

    BEGIN
        INSERT INTO public.deposits
            (deposit_code, vehicle_id, user_id, showroom_id, amount, status)
        VALUES
            (v_code || '_0', v_vehicle, (SELECT id FROM public.app_users WHERE username='customer'), v_showroom, 0, 'PENDING');

        RAISE EXCEPTION 'FAIL: Chap nhan tien coc bang 0';
    EXCEPTION WHEN check_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint <> 'chk_deposits_amount_positive' THEN
            RAISE;
        END IF;
        RAISE NOTICE 'PASS: Chan tien coc bang 0';
    END;
END;
$$;

ROLLBACK;