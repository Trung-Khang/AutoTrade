\set ON_ERROR_STOP on
\getenv fixture_hash AUTOTRADE_DEMO_BCRYPT_HASH
BEGIN;
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
