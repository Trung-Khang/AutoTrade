-- Demo only. psql: supply AUTOTRADE_STAFF_BCRYPT_HASH privately, cost 12.
-- Never overwrite an existing account, including its password/state/timestamps.
\set ON_ERROR_STOP on
\getenv staff_hash AUTOTRADE_STAFF_BCRYPT_HASH
BEGIN;
SET LOCAL search_path = public, pg_catalog;
SET LOCAL lock_timeout = '10s';
LOCK TABLE public.app_users, public.showrooms IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE staff_seed_expected ON COMMIT DROP AS
SELECT v.*, :'staff_hash'::text AS password_hash
FROM (VALUES
 ('staff_hn_01','staff_hn1@autotrade.vn','Nguyễn Văn Tuấn','0912345601','Showroom Hà Nội - Cầu Giấy'),
 ('staff_hn_02','staff_hn2@autotrade.vn','Trần Thị Thu Hà','0912345602','Showroom Hà Nội - Cầu Giấy'),
 ('staff_hcm_01','staff_hcm1@autotrade.vn','Lê Hoàng Nam','0987654301','Showroom Sài Gòn - Thủ Đức'),
 ('staff_hcm_02','staff_hcm2@autotrade.vn','Phạm Minh Đức','0987654302','Showroom Sài Gòn - Thủ Đức'),
 ('staff_hcm_03','staff_hcm3@autotrade.vn','Đỗ Thùy Linh','0987654303','Showroom Sài Gòn - Thủ Đức'),
 ('staff_dn_01','staff_dn1@autotrade.vn','Võ Quốc Huy','0905123401','Showroom Đà Nẵng - Hải Châu'),
 ('staff_dn_02','staff_dn2@autotrade.vn','Ngô Bảo Trân','0905123402','Showroom Đà Nẵng - Hải Châu')
) v(username,email,full_name,phone,showroom_name);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM staff_seed_expected
        WHERE password_hash !~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$') THEN
        RAISE EXCEPTION 'Staff seed requires verified BCrypt cost-12 hash';
    END IF;
    IF EXISTS (SELECT 1 FROM staff_seed_expected e
        WHERE (SELECT count(*) FROM public.showrooms s WHERE s.name=e.showroom_name) <> 1) THEN
        RAISE EXCEPTION 'Staff seed: missing or ambiguous showroom name; review mapping';
    END IF;
    IF EXISTS (SELECT 1 FROM public.app_users u JOIN staff_seed_expected e
        ON lower(u.username)=e.username OR lower(u.email)=e.email OR u.phone=e.phone
        JOIN public.showrooms s ON s.name=e.showroom_name
        WHERE u.username IS DISTINCT FROM e.username OR u.email IS DISTINCT FROM e.email
           OR u.role IS DISTINCT FROM 'STAFF' OR u.showroom_id IS DISTINCT FROM s.id) THEN
        RAISE EXCEPTION 'Staff identity collision: account, credentials and state preserved';
    END IF;
END $$;
INSERT INTO public.app_users
 (username,email,password_hash,full_name,phone,role,active,email_verified,locked,showroom_id)
SELECT e.username,e.email,e.password_hash,e.full_name,e.phone,'STAFF',true,true,false,s.id
FROM staff_seed_expected e JOIN public.showrooms s ON s.name=e.showroom_name
WHERE NOT EXISTS (SELECT 1 FROM public.app_users u WHERE u.username=e.username);
COMMIT;
