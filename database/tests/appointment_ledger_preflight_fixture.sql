-- ONLY the new disposable preflight probe, before V3_0_3.
\set ON_ERROR_STOP on
BEGIN;
INSERT INTO public.deposits(deposit_code,vehicle_id,user_id,showroom_id,amount)
SELECT 'TV3-PREFLIGHT-PROBE',v.id,1,v.showroom_id,100
FROM public.vehicles v WHERE v.demo_key='DEMO-01';
INSERT INTO public.transaction_ledger(deposit_id,amount,transaction_type)
SELECT id,100,'UNKNOWN' FROM public.deposits WHERE deposit_code='TV3-PREFLIGHT-PROBE';
DO $$ BEGIN
    IF (SELECT count(*) FROM public.transaction_ledger WHERE transaction_type='UNKNOWN') <> 1 THEN
        RAISE EXCEPTION 'Preflight probe fixture missing';
    END IF;
END $$;
COMMIT;
