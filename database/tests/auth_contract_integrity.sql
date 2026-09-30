-- READ ONLY: exact PostgreSQL canonical CHECK/index definitions and semantic keys.
\if :{?auth_integrity_prefix}
\else
\set auth_integrity_prefix ''
\endif
:auth_integrity_prefix
WITH checks(tbl,definition) AS (VALUES
 ('app_users',$c$CHECK ((((username)::text = btrim((username)::text)) AND ((char_length((username)::text) >= 3) AND (char_length((username)::text) <= 50)) AND ((username)::text ~ '^[A-Za-z0-9._-]+$'::text)))$c$),
 ('app_users',$c$CHECK ((((email)::text = btrim((email)::text)) AND ((email)::text = lower((email)::text))))$c$),
 ('app_users',$c$CHECK (((role)::text = ANY ((ARRAY['CUSTOMER'::character varying, 'STAFF'::character varying, 'ADMIN'::character varying])::text[])))$c$),
 ('auth_otps',$c$CHECK (((purpose)::text = ANY ((ARRAY['VERIFY_EMAIL'::character varying, 'RESET_PASSWORD'::character varying])::text[])))$c$),
 ('auth_otps',$c$CHECK (((attempt_count >= 0) AND (attempt_count <= 5)))$c$)
), results AS (
 SELECT tbl AS table_name,definition AS requirement,EXISTS (SELECT 1 FROM pg_constraint
  WHERE conrelid=to_regclass('public.'||tbl) AND contype='c' AND convalidated AND pg_get_constraintdef(oid)=definition) AS matches FROM checks
 UNION ALL
 SELECT t,'PRIMARY KEY (id)',EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=to_regclass('public.'||t)
  AND contype='p' AND pg_get_constraintdef(oid)='PRIMARY KEY (id)') FROM unnest(ARRAY['app_users','auth_otps','password_reset_sessions']) t
 UNION ALL
 SELECT tbl,'user_id FK '||action,EXISTS (SELECT 1 FROM pg_constraint k
  WHERE k.conrelid=to_regclass('public.'||tbl) AND k.contype='f' AND k.convalidated
   AND k.confrelid=to_regclass('public.app_users') AND k.confdeltype::text=action AND cardinality(k.conkey)=1 AND cardinality(k.confkey)=1
   AND (SELECT attname FROM pg_attribute WHERE attrelid=k.conrelid AND attnum=k.conkey[1])='user_id'
   AND (SELECT attname FROM pg_attribute WHERE attrelid=k.confrelid AND attnum=k.confkey[1])='id')
 FROM (VALUES ('deposits','r'),('appointments','r'),('auth_otps','c'),('password_reset_sessions','c')) e(tbl,action)
 UNION ALL
 SELECT 'password_reset_sessions','UNIQUE (token_hash)',EXISTS (SELECT 1 FROM pg_constraint
  WHERE conrelid=to_regclass('public.password_reset_sessions') AND contype='u' AND convalidated AND pg_get_constraintdef(oid)='UNIQUE (token_hash)')
 UNION ALL
 SELECT tbl,def,EXISTS (SELECT 1 FROM pg_indexes p JOIN pg_index i ON i.indexrelid=to_regclass(p.schemaname||'.'||p.indexname)
  WHERE p.schemaname='public' AND p.tablename=tbl AND p.indexdef=def AND i.indisvalid AND i.indisready)
 FROM (VALUES
 ('app_users','CREATE UNIQUE INDEX uq_app_users_username_ci ON public.app_users USING btree (lower((username)::text))'),
 ('app_users','CREATE UNIQUE INDEX uq_app_users_email_ci ON public.app_users USING btree (lower((email)::text))'),
 ('auth_otps','CREATE INDEX idx_auth_otps_active_lookup ON public.auth_otps USING btree (user_id, purpose, created_at DESC)')) e(tbl,def)
)
SELECT * FROM results ORDER BY table_name,requirement;
