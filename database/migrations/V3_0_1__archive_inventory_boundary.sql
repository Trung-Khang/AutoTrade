-- Run after V3_0_0. Existing vehicles without a showroom are crawler
-- configurations, never physical stock. Preserve all listing rows.
BEGIN;
UPDATE vehicles SET status = 'ARCHIVED' WHERE showroom_id IS NULL;
ALTER TABLE vehicles ALTER COLUMN status SET DEFAULT 'ARCHIVED';
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS chk_vehicles_status;
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_status
    CHECK (status IN ('ARCHIVED', 'AVAILABLE', 'HOLD', 'RESERVED', 'SOLD'));
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS demo_key VARCHAR(30);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vehicles_demo_key ON vehicles(demo_key);
COMMIT;
