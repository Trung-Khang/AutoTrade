-- Read-only fingerprint; never emits stored password/OTP/token hashes themselves.
\set ON_ERROR_STOP on
BEGIN READ ONLY;
-- All output is stdout (no mixed NOTICE/stderr ordering in snapshot comparisons).
SELECT CASE WHEN to_regclass('public.'||t) IS NULL
 THEN format('SELECT %L AS snapshot_table,''absent'' AS state',t)
 ELSE format('SELECT %L AS snapshot_table,count(*) AS rows,md5(coalesce(string_agg(row_to_json(r)::text,'','' ORDER BY id),'''')) AS fingerprint FROM public.%I r',t,t) END
FROM unnest(ARRAY['app_users','auth_otps','password_reset_sessions','deposits','appointments','transaction_ledger']) WITH ORDINALITY s(t,n)
ORDER BY n \gexec
\if :{?auth_snapshot_rows_only}
\else
SELECT md5(coalesce(string_agg(v,',' ORDER BY v),'')) AS schema_fingerprint FROM (
 SELECT c.relname||':'||a.attname||':'||format_type(a.atttypid,a.atttypmod)||':'||a.attnotnull||':'||coalesce(pg_get_expr(d.adbin,d.adrelid),'') AS v
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid
 LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
 WHERE n.nspname='public' AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped
 UNION ALL SELECT c.relname||':'||k.conname||':'||pg_get_constraintdef(k.oid) FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
 UNION ALL SELECT indexdef FROM pg_indexes WHERE schemaname='public'
) s;
\endif
ROLLBACK;
