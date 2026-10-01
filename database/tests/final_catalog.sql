-- Read-only catalog exported from the acceptance database, including expressions/predicates.
SELECT jsonb_build_object(
 'tables', (SELECT jsonb_agg(to_jsonb(t) ORDER BY table_name) FROM
   (SELECT table_schema,table_name,table_type FROM information_schema.tables
    WHERE table_schema='public') t),
 'columns', (SELECT jsonb_agg(to_jsonb(c) ORDER BY table_name,ordinal_position) FROM
   (SELECT table_name,ordinal_position,column_name,data_type,udt_name,
    character_maximum_length,numeric_precision,numeric_scale,is_nullable,column_default
    FROM information_schema.columns WHERE table_schema='public') c),
 'constraints', (SELECT jsonb_agg(to_jsonb(c) ORDER BY table_name,constraint_name) FROM
   (SELECT r.relname table_name,c.conname constraint_name,c.contype constraint_type,
    c.convalidated,pg_get_constraintdef(c.oid,true) definition,
    ARRAY(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY k(n,pos)
      JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.n ORDER BY pos) columns,
    rr.relname referenced_table,
    ARRAY(SELECT a.attname FROM unnest(c.confkey) WITH ORDINALITY k(n,pos)
      JOIN pg_attribute a ON a.attrelid=c.confrelid AND a.attnum=k.n ORDER BY pos) referenced_columns,
    CASE c.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
      WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END delete_policy,
    CASE c.confupdtype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
      WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END update_policy
    FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=r.relnamespace LEFT JOIN pg_class rr ON rr.oid=c.confrelid
    WHERE n.nspname='public') c),
 'indexes', (SELECT jsonb_agg(to_jsonb(i) ORDER BY table_name,index_name) FROM
   (SELECT r.relname table_name,ix.relname index_name,i.indisunique,i.indisprimary,i.indisvalid,
    pg_get_indexdef(i.indexrelid) definition,pg_get_expr(i.indexprs,i.indrelid) expressions,
    pg_get_expr(i.indpred,i.indrelid) predicate
    FROM pg_index i JOIN pg_class r ON r.oid=i.indrelid
    JOIN pg_class ix ON ix.oid=i.indexrelid JOIN pg_namespace n ON n.oid=r.relnamespace
    WHERE n.nspname='public') i),
 'functions', (SELECT jsonb_agg(to_jsonb(f) ORDER BY name,arguments) FROM
   (SELECT p.proname name,pg_get_function_identity_arguments(p.oid) arguments,
    pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prokind='f') f),
 'triggers', (SELECT jsonb_agg(to_jsonb(t) ORDER BY table_name,name) FROM
   (SELECT r.relname table_name,t.tgname name,t.tgisinternal internal,t.tgenabled enabled,
    pg_get_triggerdef(t.oid,true) definition FROM pg_trigger t JOIN pg_class r ON r.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname='public') t)
);
