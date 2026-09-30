\set ON_ERROR_STOP on
DO $$
BEGIN
    IF (SELECT count(*) FROM public.transaction_ledger WHERE transaction_type='UNKNOWN') <> 1
       OR EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.transaction_ledger'::regclass
                  AND conname IN ('chk_ledger_status','chk_ledger_transaction_type','chk_ledger_confirmed_amount'))
       OR to_regclass('public.idx_appointments_deposit_id') IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL migration rejection preservation/atomicity';
    END IF;
    RAISE NOTICE 'PASS migration refused violating data; offending row retained; no partial constraints/indexes';
END $$;
