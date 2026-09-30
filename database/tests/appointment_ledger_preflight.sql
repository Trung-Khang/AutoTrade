-- Read-only; report IDs/values, never repair. Counts must all be zero for V3_0_3.
\set ON_ERROR_STOP on
SELECT id, deposit_id, transaction_type, status, amount
FROM public.transaction_ledger
WHERE transaction_type NOT IN ('DEPOSIT_RECEIVED', 'REFUND', 'FORFEIT')
   OR status NOT IN ('CONFIRMED', 'PROCESSED', 'REVERSED')
   OR (status = 'CONFIRMED' AND (
       (transaction_type = 'DEPOSIT_RECEIVED' AND (amount <= 0 OR amount = 'NaN'::numeric))
       OR (transaction_type = 'REFUND' AND amount >= 0)))
ORDER BY id;
SELECT count(*) AS ledger_violations FROM public.transaction_ledger
WHERE transaction_type NOT IN ('DEPOSIT_RECEIVED', 'REFUND', 'FORFEIT')
   OR status NOT IN ('CONFIRMED', 'PROCESSED', 'REVERSED')
   OR (status = 'CONFIRMED' AND (
       (transaction_type = 'DEPOSIT_RECEIVED' AND (amount <= 0 OR amount = 'NaN'::numeric))
       OR (transaction_type = 'REFUND' AND amount >= 0)));
SELECT a.id AS appointment_orphan_id FROM public.appointments a
LEFT JOIN public.deposits d ON d.id=a.deposit_id
LEFT JOIN public.vehicles v ON v.id=a.vehicle_id
LEFT JOIN public.showrooms s ON s.id=a.showroom_id
WHERE (a.deposit_id IS NOT NULL AND d.id IS NULL) OR v.id IS NULL OR s.id IS NULL;
SELECT l.id AS ledger_orphan_id FROM public.transaction_ledger l
LEFT JOIN public.deposits d ON d.id=l.deposit_id WHERE d.id IS NULL;
SELECT to_regclass('public.users') AS users_dependency,
       to_regclass('public.roles') AS roles_dependency;
