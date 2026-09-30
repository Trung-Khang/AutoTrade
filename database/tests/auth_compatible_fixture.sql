-- Independent contract-shaped TV4 fixture, ONLY a new isolated V3_0_3 DB.
\set ON_ERROR_STOP on
\getenv fixture_hash AUTOTRADE_DEMO_BCRYPT_HASH
BEGIN;
CREATE TABLE public.app_users (
 id BIGSERIAL PRIMARY KEY,username VARCHAR(50) NOT NULL,email VARCHAR(254) NOT NULL,
 password_hash VARCHAR(100) NOT NULL,full_name VARCHAR(120) NOT NULL,phone VARCHAR(30),
 role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',active BOOLEAN NOT NULL DEFAULT true,
 email_verified BOOLEAN NOT NULL DEFAULT false,locked BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE public.auth_otps (
 id BIGSERIAL PRIMARY KEY,user_id BIGINT NOT NULL,email VARCHAR(254) NOT NULL,purpose VARCHAR(30) NOT NULL,
 code_hash VARCHAR(64) NOT NULL,expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,consumed_at TIMESTAMPTZ,
 invalidated_at TIMESTAMPTZ,attempt_count INT NOT NULL DEFAULT 0,last_sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT chk_auth_otps_purpose CHECK (purpose IN ('VERIFY_EMAIL','RESET_PASSWORD')),
 CONSTRAINT chk_auth_otps_attempt_count CHECK (attempt_count BETWEEN 0 AND 5),
 CONSTRAINT fk_auth_otps_user FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE
);
CREATE TABLE public.password_reset_sessions (
 id BIGSERIAL PRIMARY KEY,user_id BIGINT NOT NULL,token_hash VARCHAR(64) NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,consumed_at TIMESTAMPTZ,
 CONSTRAINT uq_password_reset_sessions_token_hash UNIQUE(token_hash),
 CONSTRAINT fk_password_reset_sessions_user FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE
);
CREATE INDEX idx_auth_otps_user_purpose_created ON public.auth_otps(user_id,purpose,created_at DESC);
INSERT INTO public.app_users(username,email,password_hash,full_name,created_at,updated_at)
 VALUES ('retained.user','retained@example.test',:'fixture_hash','Retained fixture','2020-01-01','2021-01-01');
INSERT INTO public.auth_otps(user_id,email,purpose,code_hash,expires_at,created_at,attempt_count)
 SELECT id,email,'RESET_PASSWORD',repeat('a',64),'2020-01-01','2019-01-01',5 FROM public.app_users;
INSERT INTO public.password_reset_sessions(user_id,token_hash,expires_at,created_at,consumed_at)
 SELECT id,repeat('b',64),'2020-01-01','2019-01-01','2019-12-01' FROM public.app_users;
INSERT INTO public.deposits(deposit_code,vehicle_id,user_id,showroom_id,amount)
 SELECT 'RETAINED',v.id,u.id,v.showroom_id,100 FROM public.vehicles v CROSS JOIN public.app_users u WHERE v.demo_key='DEMO-01';
INSERT INTO public.appointments(user_id,vehicle_id,showroom_id,appointment_date)
 SELECT u.id,v.id,v.showroom_id,'2020-01-01' FROM public.vehicles v CROSS JOIN public.app_users u WHERE v.demo_key='DEMO-01';
COMMIT;
