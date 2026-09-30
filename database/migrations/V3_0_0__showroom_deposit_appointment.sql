BEGIN;

-- 1. BẢNG SHOWROOMS (Chuỗi cơ sở trưng bày xe)
CREATE TABLE IF NOT EXISTS showrooms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. NÂNG CẤP BẢNG VEHICLES (Bổ sung thuộc tính độc bản & showroom)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vin VARCHAR(50) UNIQUE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price NUMERIC(15, 2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mileage INT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS showroom_id BIGINT;

-- Ràng buộc trạng thái xe độc bản
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicles_status') THEN
        ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_status 
            CHECK (status IN ('AVAILABLE', 'HOLD', 'RESERVED', 'SOLD'));
    END IF;
END $$;

-- Khóa ngoại liên kết showroom
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_vehicles_showroom') THEN
        ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_showroom
            FOREIGN KEY (showroom_id) REFERENCES showrooms(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_showroom_id ON vehicles(showroom_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);

-- 3. BẢNG DEPOSITS (Đơn đặt cọc giữ xe độc bản)
CREATE TABLE IF NOT EXISTS deposits (
    id BIGSERIAL PRIMARY KEY,
    deposit_code VARCHAR(50) NOT NULL UNIQUE,
    vehicle_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    showroom_id BIGINT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    qr_code_url VARCHAR(500),
    receipt_code VARCHAR(50),
    contract_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMPTZ,
    CONSTRAINT fk_deposits_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_deposits_showroom FOREIGN KEY (showroom_id) REFERENCES showrooms(id) ON DELETE RESTRICT,
    CONSTRAINT chk_deposits_status CHECK (status IN ('PENDING', 'DEPOSITED', 'CANCELLED', 'REFUNDED'))
);

CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_vehicle_id ON deposits(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

-- 4. BẢNG APPOINTMENTS (Lịch hẹn xem xe & tùy chọn lái thử)
CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    deposit_id BIGINT,
    user_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    showroom_id BIGINT NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    has_test_drive BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    customer_note VARCHAR(500),
    staff_note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointments_deposit FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE SET NULL,
    CONSTRAINT fk_appointments_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_showroom FOREIGN KEY (showroom_id) REFERENCES showrooms(id) ON DELETE RESTRICT,
    CONSTRAINT chk_appointments_status CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_showroom_id ON appointments(showroom_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- 5. BẢNG TRANSACTION_LEDGER (Sổ cái quản lý dòng tiền cọc cho Admin)
CREATE TABLE IF NOT EXISTS transaction_ledger (
    id BIGSERIAL PRIMARY KEY,
    deposit_id BIGINT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_deposit FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_ledger_deposit_id ON transaction_ledger(deposit_id);

-- 6. SEED DATA CƠ SỞ SHOWROOM MẪU
INSERT INTO showrooms (id, name, address, phone, city) VALUES
(1, 'Showroom Sài Gòn - Thủ Đức', 'Số 1 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM', '0901234567', 'TP.HCM'),
(2, 'Showroom Hà Nội - Cầu Giấy', 'Tòa nhà Detech, Số 8 Tôn Thất Thuyết, Cầu Giấy, Hà Nội', '0907654321', 'Hà Nội'),
(3, 'Showroom Đà Nẵng - Hải Châu', '123 Đường 2 Tháng 9, Quận Hải Châu, TP. Đà Nẵng', '0912345678', 'Đà Nẵng')
ON CONFLICT (id) DO NOTHING;

SELECT setval('showrooms_id_seq', (SELECT MAX(id) FROM showrooms));

COMMIT;
