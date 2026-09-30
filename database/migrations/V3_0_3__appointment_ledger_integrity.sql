-- Additive, run once after V3_0_2. No row repair or lifecycle triggers.
-- Contract rationale and deferred rules: database/guides/Appointment_Ledger_Integrity.md.
BEGIN;
SET LOCAL lock_timeout = '10s';
-- Protect the preflight/DDL interval from concurrent writers.
LOCK TABLE public.appointments, public.transaction_ledger IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.transaction_ledger WHERE
        transaction_type NOT IN ('DEPOSIT_RECEIVED', 'REFUND', 'FORFEIT')
        OR status NOT IN ('CONFIRMED', 'PROCESSED', 'REVERSED')
        OR (status = 'CONFIRMED' AND (
            (transaction_type = 'DEPOSIT_RECEIVED' AND (amount <= 0 OR amount = 'NaN'::numeric))
            OR (transaction_type = 'REFUND' AND amount >= 0)))) THEN
        RAISE EXCEPTION 'V3_0_3 preflight failed: inspect ledger violations; no records repaired';
    END IF;
END $$;

ALTER TABLE public.transaction_ledger
    ADD CONSTRAINT chk_ledger_transaction_type
        CHECK (transaction_type IN ('DEPOSIT_RECEIVED', 'REFUND', 'FORFEIT')),
    ADD CONSTRAINT chk_ledger_status
        CHECK (status IN ('CONFIRMED', 'PROCESSED', 'REVERSED')),
    -- Only the two CONFIRMED writers have an established amount convention.
    -- Numeric NaN compares greater than ordinary numbers in PostgreSQL.
    ADD CONSTRAINT chk_ledger_confirmed_amount
        CHECK (status <> 'CONFIRMED'
            OR transaction_type NOT IN ('DEPOSIT_RECEIVED', 'REFUND')
            OR (transaction_type = 'DEPOSIT_RECEIVED' AND amount > 0 AND amount <> 'NaN'::numeric)
            OR (transaction_type = 'REFUND' AND amount < 0));

-- Non-unique: Optional<Appointment> alone does not establish cardinality.
CREATE INDEX idx_appointments_deposit_id ON public.appointments(deposit_id);
CREATE INDEX idx_appointments_vehicle_id ON public.appointments(vehicle_id);
-- Matches AppointmentRepository.findByUserIdOrderByAppointmentDateDesc.
CREATE INDEX idx_appointments_user_date ON public.appointments(user_id, appointment_date DESC);
COMMIT;
