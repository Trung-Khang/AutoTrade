"""TV3 prepare/apply: full private backup, verified restore, DB contract tests.

Uses Python standard library + installed PostgreSQL/Java; no backend edits.
Credentials only from DB_PASSWORD/PGPASSWORD. Evidence never includes row data.
Apply requires --writers-paused and the unchanged prepared target.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BIN = Path(r'C:\Program Files\PostgreSQL\18\bin')
TARGET = 'autotrade_final'
MIGRATION = ROOT/'database/migrations/V3_0_7__staff_showroom_and_assigned_appointments.sql'
SEED = ROOT/'database/seed/demo_showroom_staff.sql'
TEST = ROOT/'database/tests/staff_appointment_integrity.sql'
TABLES = ['app_users','appointments','auth_otps','deposits','listings',
          'password_reset_sessions','showrooms','sources','transaction_ledger','vehicles']
ENV = os.environ.copy()
ENV.update(PGHOST='localhost',PGPORT='5432',PGUSER='postgres',PGCLIENTENCODING='UTF8',PGTZ='UTC',PGCONNECT_TIMEOUT='10')
ENV['PGPASSWORD'] = ENV.get('PGPASSWORD') or ENV.get('DB_PASSWORD','')
TZ = timezone(timedelta(hours=7))

def require(ok, message):
    if not ok:
        raise RuntimeError(message)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def save(path, value):
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')

class Runner:
    def __init__(self, ev):
        self.ev = ev
        existing = ev/'execution.json'
        self.log = json.loads(existing.read_text(encoding='utf-8')) if existing.exists() else []

    def run(self,label,args,stdin=None,expected=0):
        p = subprocess.run(args,input=stdin,env=ENV,capture_output=True,text=True,encoding='utf-8',errors='replace')
        self.log.append(dict(stage=label,time=datetime.now(TZ).isoformat(),exit_code=p.returncode,expected_exit=expected))
        save(self.ev/'execution.json',self.log)
        require((p.returncode==0) if expected==0 else (p.returncode!=0),label+' failed; sensitive diagnostics suppressed')
        return p.stdout.strip()

    def command(self,db):
        return [str(BIN/'psql.exe'),'-X','-w','-q','-At','-v','ON_ERROR_STOP=1','-d',db,'-f','-']

    def sql(self,db,label,sql,expected=0):
        return self.run(label,self.command(db),sql,expected)

    def identity(self,db):
        return json.loads(self.sql(db,'identity',"SELECT json_build_object('database',current_database(),'user',current_user,'system_identifier',(SELECT system_identifier::text FROM pg_control_system()),'oid',(SELECT oid FROM pg_database WHERE datname=current_database()))"))

    def catalog(self,db):
        return json.loads(self.sql(db,'catalog',(ROOT/'database/tests/final_catalog.sql').read_text(encoding='utf-8')))

    def rows(self,db,original=False):
        queries=[]
        for t in TABLES:
            value='to_jsonb(t)'
            where=''
            if original and t=='app_users':
                value="to_jsonb(t)-'showroom_id'"
                where=" WHERE username NOT IN ('staff_hn_01','staff_hn_02','staff_hcm_01','staff_hcm_02','staff_hcm_03','staff_dn_01','staff_dn_02')"
            if original and t=='appointments':
                value="to_jsonb(t)-'assigned_staff_id'"
            queries.append(f"SELECT '{t}',json_build_object('count',count(*),'md5',md5(coalesce(string_agg(({value})::text,E'\\n' ORDER BY id),''))) FROM public.{t} t{where};")
        return {name:json.loads(value) for name,value in (line.split('|',1) for line in self.sql(db,'row_fingerprints','\n'.join(queries)).splitlines())}

    def sequences(self,db):
        names=json.loads(self.sql(db,'sequence_names',"SELECT json_agg(relname ORDER BY relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND relkind='S'"))
        require(all(re.fullmatch('[a-z_]+',n) for n in names),'Unsupported sequence identifier')
        return {n:self.sql(db,'sequence',f'SELECT last_value,is_called FROM public.{n}') for n in names}

    def bcrypt(self):
        crypto=Path.home()/'.m2/repository/org/springframework/security/spring-security-crypto/6.3.3/spring-security-crypto-6.3.3.jar'
        logging=Path.home()/'.m2/repository/org/springframework/spring-jcl/6.1.13/spring-jcl-6.1.13.jar'
        ENV['AUTOTRADE_PRIVATE_DEMO_PASSWORD']='Password@123'
        value=self.run('spring_bcrypt_cost12_verify',['java','--class-path',str(crypto)+os.pathsep+str(logging),str(ROOT/'database/tests/DemoBcrypt.java'),'--operator-env'])
        require(re.fullmatch(r'\$2[aby]\$12\$[./A-Za-z0-9]{53}',value) is not None,'Invalid BCrypt')
        ENV['AUTOTRADE_STAFF_BCRYPT_HASH']=value
        return value

    def bundle(self):
        # One transaction encompasses migration+seed and all target preservation guards.
        def body(p):
            return '\n'.join(line for line in p.read_text(encoding='utf-8').splitlines() if line.strip() not in ('BEGIN;','COMMIT;'))
        return body(MIGRATION)+'\n'+body(SEED)

    def verify(self,db):
        counts=json.loads(self.sql(db,'staff_distribution',"""SELECT json_object_agg(name,n) FROM
          (SELECT s.name,count(*) n FROM app_users u JOIN showrooms s ON s.id=u.showroom_id
           WHERE u.username IN ('staff_hn_01','staff_hn_02','staff_hcm_01','staff_hcm_02','staff_hcm_03','staff_dn_01','staff_dn_02') AND u.role='STAFF'
           GROUP BY s.name) x"""))
        require(counts=={'Showroom Hà Nội - Cầu Giấy':2,'Showroom Sài Gòn - Thủ Đức':3,'Showroom Đà Nẵng - Hải Châu':2},'Wrong showroom mapping')
        require(self.sql(db,'legacy_null',"SELECT count(*) FROM appointments WHERE assigned_staff_id IS NOT NULL")=='0','Old appointments assigned')
        nullable=self.sql(db,'nullable_columns',"SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND ((table_name='app_users' AND column_name='showroom_id') OR (table_name='appointments' AND column_name='assigned_staff_id')) AND udt_name='int8' AND is_nullable='YES'")
        require(nullable=='2','Column type/nullability mismatch')
        return counts

    def transaction_guard(self,before,identity):
        guard=f"""BEGIN;
SET LOCAL lock_timeout='10s'; SET LOCAL statement_timeout='60s';
LOCK TABLE {','.join('public.'+t for t in TABLES)} IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
IF current_database()<>'{TARGET}' OR current_user<>'postgres'
OR (SELECT system_identifier::text FROM pg_control_system())<>'{identity['system_identifier']}'
OR (SELECT oid FROM pg_database WHERE datname=current_database())<>{identity['oid']}
THEN RAISE EXCEPTION 'Target mismatch'; END IF;
END $$;
"""
        for t,fp in before.items():
            guard+=f"DO $$ BEGIN IF (SELECT count(*) FROM public.{t})<>{fp['count']} OR (SELECT md5(coalesce(string_agg(to_jsonb(t)::text,E'\\n' ORDER BY id),'')) FROM public.{t} t)<>'{fp['md5']}' THEN RAISE EXCEPTION 'Target rows drifted: {t}'; END IF; END $$;\n"
        return guard

    def preservation_guard(self,before):
        result=''
        for t,fp in before.items():
            value='to_jsonb(t)';where=''
            if t=='app_users':
                value="to_jsonb(t)-'showroom_id'"
                where=" WHERE username NOT IN ('staff_hn_01','staff_hn_02','staff_hcm_01','staff_hcm_02','staff_hcm_03','staff_dn_01','staff_dn_02')"
            if t=='appointments':value="to_jsonb(t)-'assigned_staff_id'"
            result+=f"DO $$ BEGIN IF (SELECT count(*) FROM public.{t} t{where})<>{fp['count']} OR (SELECT md5(coalesce(string_agg(({value})::text,E'\\n' ORDER BY id),'')) FROM public.{t} t{where})<>'{fp['md5']}' THEN RAISE EXCEPTION 'Original rows changed: {t}'; END IF; END $$;\n"
        return result

    def concurrency(self,db):
        values=self.sql(db,'concurrent_fixtures',"SELECT (SELECT min(id) FROM app_users),v.id,v.showroom_id,(SELECT id FROM app_users WHERE username='staff_hcm_01') FROM vehicles v WHERE showroom_id IS NOT NULL ORDER BY v.id LIMIT 1").split('|')
        u,v,s,staff=map(int,values)
        def insert(i):return f"INSERT INTO appointments(id,user_id,vehicle_id,showroom_id,appointment_date,assigned_staff_id) VALUES ({i},{u},{v},{s},'2099-11-05 09:30:00',{staff});"
        first=subprocess.Popen(self.command(db),stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=ENV,text=True,encoding='utf-8')
        first.stdin.write('BEGIN;'+insert(-72001)+"SELECT pg_sleep(2);COMMIT;")
        first.stdin.close();first.stdin=None
        second=subprocess.Popen(self.command(db),stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=ENV,text=True,encoding='utf-8')
        _,err2=second.communicate('BEGIN;'+insert(-72002)+'COMMIT;',timeout=30)
        _,err1=first.communicate(timeout=30)
        require(sorted([first.returncode,second.returncode])==[0,3],'Expected exactly one concurrent winner')
        require('uq_staff_appointment_slot' in (err1+err2),'Wrong concurrency rejection')
        require(self.sql(db,'concurrent_winner_count','SELECT count(*) FROM appointments WHERE id IN (-72001,-72002)')=='1','Wrong race winner count')
        self.sql(db,'concurrent_cleanup','DELETE FROM appointments WHERE id IN (-72001,-72002)')

    def prepare(self):
        private=ROOT/'database/backups'/self.ev.name
        private.mkdir(parents=True,exist_ok=False)
        self.run('protect_backup_acl',['icacls',str(private),'/inheritance:r','/grant:r',r'DESKTOP-42GEDK2\DELL:(OI)(CI)(F)',r'NT AUTHORITY\SYSTEM:(OI)(CI)(F)',r'DESKTOP-42GEDK2\CodexSandboxOffline:(OI)(CI)(F)'])
        identity=self.identity(TARGET)
        require(identity['database']==TARGET and identity['user']=='postgres','Unexpected target')
        before=self.rows(TARGET);cat=self.catalog(TARGET);seq=self.sequences(TARGET)
        require(all(c['column_name'] not in ('assigned_staff_id',) and not (c['table_name']=='app_users' and c['column_name']=='showroom_id') for c in cat['columns']),'Migration columns already exist; review before rerunning')
        require(self.sql(TARGET,'seed_identity_preflight',"SELECT count(*) FROM app_users WHERE username IN ('staff_hn_01','staff_hn_02','staff_hcm_01','staff_hcm_02','staff_hcm_03','staff_dn_01','staff_dn_02')")=='0','Existing seed accounts require an explicit preservation baseline')
        dump=private/'autotrade_final.full.dump'
        self.run('full_backup',[str(BIN/'pg_dump.exe'),'-w','-d',TARGET,'-Fc','-f',str(dump)])
        db='tv3_staff_'+datetime.now(TZ).strftime('%Y%m%d_%H%M%S')
        self.run('create_isolated',[str(BIN/'createdb.exe'),'-w','--template=template0','--encoding=UTF8',db])
        self.run('restore_backup',[str(BIN/'pg_restore.exe'),'-w','--exit-on-error','--single-transaction','-d',db,str(dump)])
        require(self.rows(db)==before and self.sequences(db)==seq,'Backup restore rows/sequences differ')
        # RI trigger internal OIDs are generated anew on restore; compare the rest.
        restored=self.catalog(db)
        def canonical(c):
            c=json.loads(json.dumps(c))
            c['triggers']=[t for t in c['triggers'] if not t['internal']]
            for x in c['constraints']:
                x['definition']=x['definition'].replace('::character varying::text','::character varying').replace(']::text[]',']')
            return c
        require(canonical(restored)==canonical(cat),'Backup restore schema differs')
        self.bcrypt()
        verified_hash=ENV['AUTOTRADE_STAFF_BCRYPT_HASH']
        ENV['AUTOTRADE_STAFF_BCRYPT_HASH']='invalid-fixture'
        self.sql(db,'combined_migration_seed_rollback','BEGIN;\n'+self.bundle()+'\nCOMMIT;',expected=1)
        require(self.rows(db)==before and self.catalog(db)==restored and self.sequences(db)==seq,'Combined migration/seed did not roll back')
        ENV['AUTOTRADE_STAFF_BCRYPT_HASH']=verified_hash
        self.sql(db,'migration_and_seed','BEGIN;\n'+self.bundle()+'\nCOMMIT;')
        require(self.rows(db,original=True)==before,'Original data changed')
        self.verify(db)
        stable=self.rows(db);stable_seq=self.sequences(db);stable_cat=self.catalog(db)
        self.sql(db,'seed_repeat',SEED.read_text(encoding='utf-8'))
        require(self.rows(db)==stable and self.sequences(db)==stable_seq,'Repeated seed changed rows/sequences')
        self.sql(db,'migration_repeat_rejected',MIGRATION.read_text(encoding='utf-8'),expected=1)
        require(self.rows(db)==stable and self.catalog(db)==stable_cat,'Rejected migration not atomic')
        self.sql(db,'integrity_and_P0',TEST.read_text(encoding='utf-8'))
        self.concurrency(db)
        require(self.rows(db)==stable and self.sequences(db)==stable_seq,'Fixtures leaked')
        # User-modified credentials/state must survive a seed repeat unchanged.
        self.sql(db,'seed_existing_state_preserved',"BEGIN; UPDATE app_users SET password_hash='retained-modified-hash',active=false,locked=true,email_verified=false,updated_at='2000-01-01' WHERE username='staff_hcm_01';\n"+
                 '\n'.join(x for x in SEED.read_text(encoding='utf-8').splitlines() if x.strip() not in ('BEGIN;','COMMIT;'))+
                 "\nDO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM app_users WHERE username='staff_hcm_01' AND password_hash='retained-modified-hash' AND NOT active AND locked AND NOT email_verified AND updated_at='2000-01-01') THEN RAISE EXCEPTION 'Seed overwrote account'; END IF; END $$; ROLLBACK;")
        self.sql(db,'seed_collision_rejected',"BEGIN; UPDATE app_users SET role='CUSTOMER' WHERE username='staff_hn_01';\n"+
                 '\n'.join(x for x in SEED.read_text(encoding='utf-8').splitlines() if x.strip() not in ('BEGIN;','COMMIT;'))+'\nCOMMIT;',expected=1)
        require(self.rows(db)==stable,'Collision changed data')
        seed_body='\n'.join(x for x in SEED.read_text(encoding='utf-8').splitlines() if x.strip() not in ('BEGIN;','COMMIT;'))
        self.sql(db,'missing_showroom_rejected',"BEGIN; UPDATE showrooms SET name='Missing fixture' WHERE name='Showroom Hà Nội - Cầu Giấy';\n"+seed_body+'\nCOMMIT;',expected=1)
        self.sql(db,'ambiguous_showroom_rejected',"BEGIN; INSERT INTO showrooms(id,name,address) VALUES (-73000,'Showroom Hà Nội - Cầu Giấy','Disposable');\n"+seed_body+'\nCOMMIT;',expected=1)
        require(self.rows(db)==stable and self.sequences(db)==stable_seq,'Showroom rejection changed rows/sequences')
        require(self.rows(TARGET)==before and self.catalog(TARGET)==cat and self.sequences(TARGET)==seq,'Target changed during preparation')
        manifest=dict(status='PREPARED',identity=identity,before=before,catalog=cat,sequences=seq,
          private_backup=str(dump),backup_sha256=digest(dump),test_database=db,full_backup_restore_verified=True,
          files={str(p.relative_to(ROOT)):digest(p) for p in (MIGRATION,SEED,TEST,Path(__file__))},
          tests=['restore full rows/schema/sequences','combined migration/seed rollback','migration atomic repeat rejection','seed idempotence','original full-row preservation','NULL legacy compatibility','FK delete policies','PENDING/SCHEDULED conflict','cancel/completed slot reuse','concurrent one winner','seed existing credentials/state preservation','seed collision rollback','missing/ambiguous showroom rejection','P0 deposit uniqueness/positive amount'])
        save(self.ev/'manifest.json',manifest)
        print('PASS preparation, verified backup/restore and isolated contract tests; target unchanged')

    def apply(self):
        m=json.loads((self.ev/'manifest.json').read_text(encoding='utf-8'))
        require(m['status']=='PREPARED' and m['full_backup_restore_verified'],'Preparation missing')
        require(self.identity(TARGET)==m['identity'],'Target identity changed')
        require(all(digest(ROOT/p)==h for p,h in m['files'].items()),'Implementation changed since tests')
        require(digest(Path(m['private_backup']))==m['backup_sha256'],'Backup changed')
        require(self.catalog(TARGET)==m['catalog'] and self.sequences(TARGET)==m['sequences'],'Target schema/sequences drifted')
        self.bcrypt()
        self.sql(TARGET,'apply_atomic_guarded',self.transaction_guard(m['before'],m['identity'])+self.bundle()+'\n'+self.preservation_guard(m['before'])+'COMMIT;')
        require(self.rows(TARGET,original=True)==m['before'],'Original data changed after commit')
        distribution=self.verify(TARGET)
        stable=self.rows(TARGET);seq=self.sequences(TARGET)
        self.sql(TARGET,'target_seed_repeat',SEED.read_text(encoding='utf-8'))
        require(self.rows(TARGET)==stable and self.sequences(TARGET)==seq,'Target repeat seed changed data')
        save(self.ev/'result.json',dict(status='PASS',database=TARGET,original_rows_preserved=True,legacy_appointments_unassigned=True,
          seed_repeat_preserved=True,staff_distribution=distribution,after_counts={k:v['count'] for k,v in stable.items()},
          login_API='NOT VERIFIED: TV4 entity/API integration pending',catalog=self.catalog(TARGET)))
        m['status']='APPLIED';save(self.ev/'manifest.json',m)
        print('PASS atomic target migration + 7 staff; original records preserved')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode',choices=['prepare','apply'])
    parser.add_argument('--evidence',type=Path,required=True)
    parser.add_argument('--writers-paused',action='store_true')
    args=parser.parse_args()
    try:
        require(bool(ENV['PGPASSWORD']),'Private admin credential missing')
        ev=args.evidence.resolve()
        require(ev.is_relative_to(ROOT/'database/evidence'),'Evidence must stay in workspace database/evidence')
        if args.mode=='prepare':ev.mkdir(parents=True,exist_ok=False)
        runner=Runner(ev)
        if args.mode=='prepare':runner.prepare()
        else:
            require(args.writers_paused,'Operator must confirm writers paused')
            runner.apply()
    except Exception as error:
        print('FAILED:',str(error) if isinstance(error,RuntimeError) else type(error).__name__)
        raise SystemExit(1)
