BEGIN;

-- Mỗi xe chỉ có tối đa một cọc đang DEPOSITED.
CREATE UNIQUE INDEX uq_deposits_vehicle_deposited
    ON public.deposits (vehicle_id)
    WHERE status = 'DEPOSITED';

-- Tiền cọc phải lớn hơn 0.
ALTER TABLE public.deposits
    ADD CONSTRAINT chk_deposits_amount_positive
    CHECK (amount > 0);

COMMIT;
