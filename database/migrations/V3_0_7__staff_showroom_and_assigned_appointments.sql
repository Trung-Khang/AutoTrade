-- Run once on the authenticated showroom schema (V3_0_0..5).
-- V3_0_6 phone policy is independent and remains untouched.
-- Fail atomically on any existing object/name collision.
-- No backfill, account repair, appointment reassignment or lifecycle triggers.
BEGIN;
SET LOCAL search_path = public, pg_catalog;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(3040007);
LOCK TABLE public.app_users, public.appointments, public.showrooms IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.appointments
               WHERE status NOT IN ('PENDING','SCHEDULED','COMPLETED','CANCELLED')) THEN
        RAISE EXCEPTION 'V3_0_7: unsupported appointment status; no rows repaired';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
        WHERE conrelid='public.appointments'::regclass
          AND conname='chk_appointments_status' AND contype='c') THEN
        RAISE EXCEPTION 'V3_0_7: expected appointment status constraint missing';
    END IF;
END $$;

ALTER TABLE public.app_users ADD COLUMN showroom_id BIGINT;
ALTER TABLE public.app_users ADD CONSTRAINT fk_app_users_showroom
    FOREIGN KEY (showroom_id) REFERENCES public.showrooms(id) ON DELETE SET NULL;
CREATE INDEX idx_app_users_showroom_role ON public.app_users(showroom_id,role)
    WHERE active = true AND locked = false;

ALTER TABLE public.appointments ADD COLUMN assigned_staff_id BIGINT;
ALTER TABLE public.appointments ADD CONSTRAINT fk_appointments_assigned_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES public.app_users(id) ON DELETE RESTRICT;
CREATE INDEX idx_appointments_assigned_staff_date
    ON public.appointments(assigned_staff_id,appointment_date,status);
CREATE UNIQUE INDEX uq_staff_appointment_slot
    ON public.appointments(assigned_staff_id,appointment_date)
    WHERE status IN ('PENDING','SCHEDULED');

-- Original V3_0_0 vocabulary lacked SCHEDULED; preserve all existing states.
ALTER TABLE public.appointments DROP CONSTRAINT chk_appointments_status;
ALTER TABLE public.appointments ADD CONSTRAINT chk_appointments_status
    CHECK (status IN ('PENDING','SCHEDULED','COMPLETED','CANCELLED'));
COMMIT;
