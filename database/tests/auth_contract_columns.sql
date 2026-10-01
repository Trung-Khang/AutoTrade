-- Shared READ-ONLY physical column/default comparison, from supplied contract.
\if :{?auth_audit_prefix}
\else
\set auth_audit_prefix ''
\endif
:auth_audit_prefix
WITH expected(table_name,column_name,expected_type,nullable,default_kind) AS (VALUES
 ('app_users','id','bigint',false,'serial'),
 ('app_users','username','character varying(50)',false,'none'),
 ('app_users','email','character varying(254)',false,'none'),
 ('app_users','password_hash','character varying(100)',false,'none'),
 ('app_users','full_name','character varying(120)',false,'none'),
 ('app_users','phone','character varying(30)',true,'none'),
 ('app_users','role','character varying(20)',false,'customer'),
 ('app_users','active','boolean',false,'true'),
 ('app_users','email_verified','boolean',false,'false'),
 ('app_users','locked','boolean',false,'false'),
 ('app_users','created_at','timestamp with time zone',false,'timestamp'),
 ('app_users','updated_at','timestamp with time zone',false,'timestamp'),
 ('auth_otps','id','bigint',false,'serial'),
 ('auth_otps','user_id','bigint',false,'none'),
 ('auth_otps','email','character varying(254)',false,'none'),
 ('auth_otps','purpose','character varying(30)',false,'none'),
 ('auth_otps','code_hash','character varying(64)',false,'none'),
 ('auth_otps','expires_at','timestamp with time zone',false,'none'),
 ('auth_otps','created_at','timestamp with time zone',false,'timestamp'),
 ('auth_otps','consumed_at','timestamp with time zone',true,'none'),
 ('auth_otps','invalidated_at','timestamp with time zone',true,'none'),
 ('auth_otps','attempt_count','integer',false,'zero'),
 ('auth_otps','last_sent_at','timestamp with time zone',false,'timestamp'),
 ('password_reset_sessions','id','bigint',false,'serial'),
 ('password_reset_sessions','user_id','bigint',false,'none'),
 ('password_reset_sessions','token_hash','character varying(64)',false,'none'),
 ('password_reset_sessions','expires_at','timestamp with time zone',false,'none'),
 ('password_reset_sessions','created_at','timestamp with time zone',false,'timestamp'),
 ('password_reset_sessions','consumed_at','timestamp with time zone',true,'none')
), actual AS (
 SELECT e.*,a.attname IS NOT NULL AS present,a.attnotnull,a.attidentity,
        format_type(a.atttypid,a.atttypmod) AS actual_type,
        pg_get_expr(d.adbin,d.adrelid) AS actual_default,
        CASE WHEN a.attname=e.column_name AND e.default_kind='serial'
             THEN pg_get_serial_sequence('public.'||e.table_name,e.column_name) END AS sequence_name
 FROM expected e LEFT JOIN pg_attribute a ON a.attrelid=to_regclass('public.'||e.table_name)
      AND a.attname=e.column_name AND NOT a.attisdropped
 LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
)
SELECT table_name,column_name,expected_type,nullable AS expected_nullable,default_kind,
       present,actual_type,NOT attnotnull AS actual_nullable,actual_default,
       present AND actual_type=expected_type AND attnotnull=NOT nullable AS column_matches,
       CASE default_kind
         WHEN 'none' THEN actual_default IS NULL
         WHEN 'timestamp' THEN actual_default IN ('CURRENT_TIMESTAMP','now()','transaction_timestamp()')
         WHEN 'customer' THEN actual_default='''CUSTOMER''::character varying'
         WHEN 'true' THEN actual_default='true'
         WHEN 'false' THEN actual_default='false'
         WHEN 'zero' THEN actual_default='0'
         WHEN 'serial' THEN sequence_name IS NOT NULL AND attidentity=''
           AND actual_default=format('nextval(%L::regclass)',sequence_name::regclass::text)
           AND EXISTS (SELECT 1 FROM pg_sequence WHERE seqrelid=to_regclass(sequence_name) AND seqtypid='bigint'::regtype)
         ELSE false END AS default_matches
FROM actual ORDER BY table_name,column_name;
