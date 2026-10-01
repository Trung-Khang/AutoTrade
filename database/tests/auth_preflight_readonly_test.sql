\set ON_ERROR_STOP on
SELECT md5(coalesce(string_agg(row_to_json(u)::text,',' ORDER BY id),'')) AS before_users FROM public.app_users u \gset
SELECT md5(coalesce(string_agg(row_to_json(d)::text,',' ORDER BY id),'')) AS before_deposits FROM public.deposits d \gset
\ir auth_identity_preflight.sql
SELECT md5(coalesce(string_agg(row_to_json(u)::text,',' ORDER BY id),''))=:'before_users' AS users_same FROM public.app_users u \gset
SELECT md5(coalesce(string_agg(row_to_json(d)::text,',' ORDER BY id),''))=:'before_deposits' AS deposits_same FROM public.deposits d \gset
\if :users_same
\else
    \quit 1
\endif
\if :deposits_same
\else
    \quit 1
\endif
\echo PASS read-only preflight preserved all diagnostic user/deposit rows
