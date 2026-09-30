\set ON_ERROR_STOP on
DO $$
BEGIN
    IF (SELECT count(*) FROM public.vehicles WHERE demo_key IS NOT NULL) <> 10
       OR (SELECT count(*) FROM public.vehicles WHERE demo_key IS NOT NULL AND status='AVAILABLE') <> 7
       OR (SELECT count(*) FROM public.vehicles WHERE demo_key IS NOT NULL AND status='HOLD') <> 1
       OR (SELECT count(*) FROM public.vehicles WHERE demo_key IS NOT NULL AND status='RESERVED') <> 1
       OR (SELECT count(*) FROM public.vehicles WHERE demo_key IS NOT NULL AND status='SOLD') <> 1 THEN
        RAISE EXCEPTION 'FAIL repeat seed counts/status';
    END IF;
    IF (SELECT count(*) FROM pg_constraint WHERE conrelid='public.transaction_ledger'::regclass
        AND conname IN ('chk_ledger_transaction_type','chk_ledger_status','chk_ledger_confirmed_amount')
        AND convalidated) <> 3 THEN
        RAISE EXCEPTION 'FAIL ledger constraints not validated';
    END IF;
    IF EXISTS (SELECT 1 FROM public.appointments) OR EXISTS (SELECT 1 FROM public.transaction_ledger)
       OR EXISTS (SELECT 1 FROM public.deposits) THEN
        RAISE EXCEPTION 'FAIL rollback left mutation fixtures';
    END IF;
    RAISE NOTICE 'PASS repeat seed: 10 demo, 7 AVAILABLE/1 HOLD/1 RESERVED/1 SOLD; validated checks; mutation fixtures absent';
END $$;
