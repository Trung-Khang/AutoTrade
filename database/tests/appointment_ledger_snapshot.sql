\set ON_ERROR_STOP on
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT current_database() AS database;
SELECT count(*) AS listings, count(DISTINCT source_url) AS distinct_urls,
       count(image_url) AS images FROM public.listings;
SELECT status, showroom_id IS NULL AS no_showroom, count(*)
FROM public.vehicles GROUP BY 1,2 ORDER BY 1,2;
SELECT demo_key, status FROM public.vehicles WHERE demo_key IS NOT NULL ORDER BY demo_key;
-- Ordered complete-row fingerprints detect edits as well as count changes.
SELECT 'sources' AS relation, count(*) AS rows, md5(coalesce(string_agg(row_to_json(t)::text,E'\n' ORDER BY id),'')) AS fingerprint FROM public.sources t
UNION ALL SELECT 'vehicles',count(*),md5(coalesce(string_agg(row_to_json(t)::text,E'\n' ORDER BY id),'')) FROM public.vehicles t
UNION ALL SELECT 'listings',count(*),md5(coalesce(string_agg(row_to_json(t)::text,E'\n' ORDER BY id),'')) FROM public.listings t
UNION ALL SELECT 'showrooms',count(*),md5(coalesce(string_agg(row_to_json(t)::text,E'\n' ORDER BY id),'')) FROM public.showrooms t
UNION ALL SELECT 'deposits',count(*),md5(coalesce(string_agg(row_to_json(t)::text,E'\n' ORDER BY id),'')) FROM public.deposits t
UNION ALL SELECT 'appointments',count(*),md5(coalesce(string_agg(row_to_json(t)::text,E'\n' ORDER BY id),'')) FROM public.appointments t
UNION ALL SELECT 'transaction_ledger',count(*),md5(coalesce(string_agg(row_to_json(t)::text,E'\n' ORDER BY id),'')) FROM public.transaction_ledger t;
COMMIT;
