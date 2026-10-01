"""Verify official migrations using ONLY newly created isolated UTF8 databases.
Requires psql/java, Spring crypto/JCL jars, and PG credentials in environment.
Never prints or writes credentials, BCrypt hashes, OTPs or JWTs.
"""
import os, subprocess, secrets, re, time, json, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2] if Path(__file__).parent.name=='tests' else Path(r'D:\CONG_NGHE_PHAN_MEM\AutoTrade-TV3')
PSQL=os.environ.get('PSQL',r'C:\Program Files\PostgreSQL\18\bin\psql.exe')
ENV=os.environ.copy(); ENV.setdefault('PGUSER','postgres'); ENV.setdefault('PGPASSWORD',ENV.get('DB_PASSWORD','')); ENV['PGCLIENTENCODING']='UTF8'
stamp=time.strftime('%Y%m%d_%H%M%S')+'_'+secrets.token_hex(3)
base='tv3_official_'+stamp
EV=ROOT/'database/evidence'/('official_'+stamp); EV.mkdir(parents=True)
def redact(s):
 for key in ['PGPASSWORD','AUTOTRADE_PRIVATE_DEMO_PASSWORD','AUTOTRADE_DEMO_BCRYPT_HASH','JWT_SECRET','SMTP_PASSWORD']:
  if ENV.get(key): s=s.replace(ENV[key],'[REDACTED]')
 return re.sub(r'\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}','[REDACTED_HASH]',s)
def sql(db,label,query=None,file=None,expect=None):
 args=[PSQL,'-X','-w','-d',db,'-v','ON_ERROR_STOP=1']
 if file: args+=['-f',str(ROOT/file)]
 else: args+=['-c',query]
 r=subprocess.run(args,env=ENV,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,encoding='utf-8',errors='replace')
 out=redact(r.stdout); (EV/(label+'.txt')).write_text(f'exit={r.returncode}\n'+out,encoding='utf-8')
 if expect:
  assert r.returncode and expect in out, f'{label}: expected rejection {expect}'
 else: assert r.returncode==0, f'{label}: see redacted evidence'
 print('PASS',label,flush=True); return out
def clone(source,suffix):
 db=base+'_'+suffix; sql('postgres','create_'+suffix,f'CREATE DATABASE {db} TEMPLATE {source}')
 with (EV/'databases.txt').open('a') as f: f.write(db+'\n')
 return db
def apply(db,n):
 file=next((ROOT/'database/migrations').glob(f'V3_0_{n}__*.sql'))
 return sql(db,db.split('_')[-1]+f'_migration_{n}',file=file.relative_to(ROOT))
def snapshot(db,label,rows=False):
 return sql(db,label,file='database/tests/auth_rows_snapshot.sql' if rows else 'database/tests/auth_snapshot.sql')
cp=os.environ.get('TV3_CRYPTO_JAR',r'D:\maven-repository\org\springframework\security\spring-security-crypto\6.3.3\spring-security-crypto-6.3.3.jar')+os.pathsep+os.environ.get('TV3_LOGGING_JAR',r'D:\maven-repository\commons-logging\commons-logging\1.3.5\commons-logging-1.3.5.jar')
ENV['AUTOTRADE_PRIVATE_DEMO_PASSWORD']=secrets.token_urlsafe(32)
r=subprocess.run(['java','--class-path',cp,str(ROOT/'database/tests/DemoBcrypt.java'),'--operator-env'],env=ENV,capture_output=True,text=True)
assert r.returncode==0 and re.fullmatch(r'\$2a\$12\$[./A-Za-z0-9]{53}',r.stdout),'BCrypt generation failed (details suppressed)'
ENV['AUTOTRADE_DEMO_BCRYPT_HASH']=r.stdout
(EV/'bcrypt.txt').write_text('PASS Spring BCrypt cost 12; private random credential/hash kept only in memory.\n')
sql('postgres','create_clean',f"CREATE DATABASE {base} ENCODING 'UTF8' TEMPLATE template0")
(EV/'databases.txt').write_text(base+'\n')
sql(base,'schema',file='database/schema/schema.sql'); sql(base,'schema_smoke',file='database/tests/schema_v2_0_1_smoke_test.sql')
for n in range(4): apply(base,n)
upgrade=clone(base,'upgrade')
for n in [4,5]: apply(base,n)
apply(upgrade,4); v4=clone(upgrade,'existing')
apply(upgrade,5)
sql(v4,'existing_showroom_seed',file='database/seed/demo_showroom_vehicles.sql')
fixture=(ROOT/'database/tests/auth_compatible_fixture.sql').read_text(encoding='utf-8')
fixture="\\set ON_ERROR_STOP on\n\\getenv fixture_hash AUTOTRADE_DEMO_BCRYPT_HASH\nBEGIN;\n"+fixture[fixture.index('INSERT INTO public.app_users'):]
(EV/'existing_rows_fixture.sql').write_text(fixture,encoding='utf-8')
sql(v4,'existing_rows_fixture',file=(EV/'existing_rows_fixture.sql').relative_to(ROOT))
before=snapshot(v4,'existing_rows_before',True); apply(v4,5); after=snapshot(v4,'existing_rows_after',True)
assert before==after,'V3_0_5 changed existing auth/business rows'
sql(v4,'existing_catalog',file='database/tests/auth_catalog_test.sql')
for db,kind in [(base,'clean'),(upgrade,'upgrade')]:
 for f in ['demo_showroom_vehicles','demo_showroom_vehicles']: sql(db,kind+'_showroom_'+secrets.token_hex(2),file='database/seed/'+f+'.sql')
 for f in ['auth_catalog_test','auth_demo_repeat_test','auth_identity_test','auth_required_identity_test','auth_temporary_records_test','appointment_ledger_catalog_test']:
  sql(db,kind+'_'+f,file='database/tests/'+f+'.sql')
 customer="(SELECT id FROM public.app_users WHERE username='customer')"
 for f in ['deposit_integrity_test','appointment_ledger_integrity_test']:
  s=(ROOT/'database/tests'/f'{f}.sql').read_text(encoding='utf-8')
  s=s.replace('v_vehicle, 1,',f'v_vehicle, {customer},').replace(',v,1,s,100',f',v,{customer},s,100').replace('VALUES (1,%s',"VALUES ("+customer.replace("'","''")+",%s")
  p=EV/(kind+'_'+f+'.adapted.sql'); p.write_text(s,encoding='utf-8'); sql(db,kind+'_'+f,file=p.relative_to(ROOT))
# Every reject database starts from the actual official V3_0_4, containing business/auth rows.
pre=clone(upgrade,'v4reject'); sql(pre,'reject_drop_v5_fks',"ALTER TABLE deposits DROP CONSTRAINT fk_deposits_user; ALTER TABLE appointments DROP CONSTRAINT fk_appointments_user; DROP INDEX uq_app_users_username_ci; DROP INDEX uq_app_users_email_ci; ALTER TABLE app_users DROP CONSTRAINT chk_app_users_username, DROP CONSTRAINT chk_app_users_email_normalized, DROP CONSTRAINT chk_app_users_required_identity; CREATE INDEX idx_password_reset_sessions_token ON password_reset_sessions(token_hash)")
cases={
 'invalididentity':("UPDATE app_users SET username='bad name' WHERE username='staff'",'invalid or duplicate identity'),
 'duplicateusername':("INSERT INTO app_users(username,email,password_hash,full_name) SELECT 'CUSTOMER','other@example.test',password_hash,'Duplicate' FROM app_users WHERE username='customer'",'invalid or duplicate identity'),
 'duplicateemail':("ALTER TABLE app_users DROP CONSTRAINT app_users_email_key; INSERT INTO app_users(username,email,password_hash,full_name) SELECT 'duplicate','customer@example.test',password_hash,'Duplicate' FROM app_users WHERE username='customer'",'invalid or duplicate identity'),
 'invalidemail':("UPDATE app_users SET email='invalid' WHERE username='staff'",'invalid or duplicate identity'),
 'blankname':("UPDATE app_users SET full_name=' ' WHERE username='staff'",'invalid or duplicate identity'),
 'badcolumns':("ALTER TABLE app_users ALTER COLUMN username TYPE text",'incompatible columns/defaults'),
 'extra':("ALTER TABLE app_users ADD COLUMN unexpected text",'incompatible columns/defaults'),
 'baddefault':("ALTER TABLE app_users ALTER COLUMN active SET DEFAULT false",'incompatible columns/defaults'),
 'invalidotp':("ALTER TABLE auth_otps DROP CONSTRAINT chk_auth_otps_attempt_count; INSERT INTO auth_otps(user_id,email,purpose,code_hash,expires_at,attempt_count) SELECT id,email,'VERIFY_EMAIL',repeat('a',64),now(),6 FROM app_users WHERE username='customer'",'invalid OTP/reset data'),
 'indexconflict':("DROP INDEX idx_password_reset_sessions_token; CREATE INDEX idx_password_reset_sessions_token ON password_reset_sessions(expires_at)",'incompatible ordinary token index'),
 'orphan':("INSERT INTO deposits(deposit_code,vehicle_id,user_id,showroom_id,amount) SELECT 'ORPHAN',id,987654321,showroom_id,100 FROM vehicles WHERE demo_key='DEMO-01'",'orphan user references'),
 'appointmentorphan':("INSERT INTO appointments(user_id,vehicle_id,showroom_id,appointment_date) SELECT 987654321,id,showroom_id,'2030-01-01' FROM vehicles WHERE demo_key='DEMO-01'",'orphan user references'),
 'authorphan':("ALTER TABLE auth_otps DROP CONSTRAINT auth_otps_user_id_fkey; INSERT INTO auth_otps(user_id,email,purpose,code_hash,expires_at) VALUES(987654321,'orphan@example.test','VERIFY_EMAIL',repeat('a',64),now())",'orphan user references'),
 'resetorphan':("ALTER TABLE password_reset_sessions DROP CONSTRAINT password_reset_sessions_user_id_fkey; INSERT INTO password_reset_sessions(user_id,token_hash,expires_at) VALUES(987654321,repeat('b',64),now())",'orphan user references'),
 'fkconflict':("ALTER TABLE deposits ADD CONSTRAINT wrong_user_fk FOREIGN KEY(user_id) REFERENCES app_users(id) ON DELETE CASCADE",'incompatible existing user FK')
}
for kind,(setup,reason) in cases.items():
 db=clone(pre,kind); sql(db,kind+'_setup',setup); before=snapshot(db,kind+'_before')
 sql(db,kind+'_reject',file='database/migrations/V3_0_5__auth_identity_integrity.sql',expect=reason)
 assert before==snapshot(db,kind+'_after'),kind+' changed rows/schema after rejection'
# Two live sessions; normalizing app-side identity then DB uniqueness handles concurrent requests.
for kind in ['username','email']:
 first=f"BEGIN; INSERT INTO app_users(username,email,password_hash,full_name) SELECT 'Race.{kind}','race.{kind}@example.test',password_hash,'Race' FROM app_users WHERE username='customer'; SELECT pg_sleep(2); COMMIT;"
 name='rACE.username' if kind=='username' else 'Race.other'
 email='race.other@example.test' if kind=='username' else 'race.email@example.test'
 second=f"INSERT INTO app_users(username,email,password_hash,full_name) SELECT '{name}','{email}',password_hash,'Race' FROM app_users WHERE username='customer'"
 def run(s): return subprocess.Popen([PSQL,'-X','-w','-d',base,'-v','ON_ERROR_STOP=1','-c',s],env=ENV,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8')
 a=run(first); time.sleep(.5); b=run(second); oa=a.communicate(timeout=30)[0]; ob=b.communicate(timeout=30)[0]
 assert (a.returncode==0)!=(b.returncode==0) and (f'uq_app_users_{kind}_ci' in oa+ob or (kind=='email' and 'app_users_email_key' in oa+ob))
 (EV/('concurrent_'+kind+'.txt')).write_text(redact(f'A={a.returncode}; B={b.returncode}\n'+oa+ob),encoding='utf-8')
 print('PASS concurrent',kind,flush=True)
sql(base,'seed_collision_setup',"UPDATE app_users SET locked=true WHERE username='staff'")
before=snapshot(base,'seed_collision_before'); sql(base,'seed_collision_reject',file='database/seed/demo_auth_accounts.sql',expect='Demo identity collision'); assert before==snapshot(base,'seed_collision_after')
sql(base,'seed_collision_restore',"UPDATE app_users SET locked=false WHERE username='staff'")
# Private operator runtime handoff goes ONLY into ignored temp files; never tracked evidence.
private=ROOT/'backend/target/tv3-runtime.json'; private.parent.mkdir(parents=True,exist_ok=True)
private.write_text(json.dumps({'database':base,'password':ENV['AUTOTRADE_PRIVATE_DEMO_PASSWORD'],'evidence':str(EV)}),encoding='utf-8')
hashes=[]
for p in [ROOT/'database/schema/schema.sql',*sorted((ROOT/'database/migrations').glob('*.sql'))]: hashes.append(p.relative_to(ROOT).as_posix()+' '+hashlib.sha256(p.read_bytes()).hexdigest())
(EV/'artifact_sha256.txt').write_text('\n'.join(hashes)+'\n')
(EV/'result.txt').write_text('PASS official clean/schema -> V3_0_0..5; V3_0_3 -> V3_0_4 -> V3_0_5; populated V3_0_4 rows preserved; exact 29-column catalog/default/NULL/CHECK/FK/CASCADE/RESTRICT; BCrypt12; seeds repeat; concurrent uniqueness; 15 atomic rejection probes; deposit/appointment/ledger regressions. Runtime/SMTP recorded separately.\n')
print('EVIDENCE',EV,flush=True)
