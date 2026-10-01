"""One guarded PostgreSQL acceptance instance; no reset, clones or draft migrations.

Run using Python 3 with DB_PASSWORD/PGPASSWORD supplied privately. Windows operator
credentials and provenance journal are ACL-protected ignored local JSON files.
An uncertain in-progress step blocks automatic resume; never infer migration history.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import time
from datetime import datetime, timezone, timedelta

ROOT = Path(__file__).resolve().parents[2]
DB = 'autotrade_final'
TZ = timezone(timedelta(hours=7))
FILES = ['database/schema/schema.sql',
 'database/migrations/V3_0_0__showroom_deposit_appointment.sql',
 'database/migrations/V3_0_1__archive_inventory_boundary.sql',
 'database/migrations/V3_0_2__deposit_integrity.sql',
 'database/migrations/V3_0_3__appointment_ledger_integrity.sql',
 'database/migrations/V3_0_4__auth_and_otp.sql',
 'database/migrations/V3_0_5__auth_identity_integrity.sql',
 'database/seed/demo_showroom_vehicles.sql', 'database/seed/demo_auth_accounts.sql']

def now(): return datetime.now(TZ).isoformat()
def digest(data): return hashlib.sha256(data).hexdigest()
def canonical(obj): return json.dumps(obj, ensure_ascii=False, sort_keys=True).encode('utf-8')
def require(condition, message):
    if not condition: raise RuntimeError(message)

class Acceptance:
    def __init__(self, args):
        self.a = args
        self.env = os.environ.copy()
        self.env.update(PGHOST=args.host, PGPORT=str(args.port), PGUSER=args.username,
                        PGDATABASE=DB, PGCLIENTENCODING='UTF8', PGCONNECT_TIMEOUT='10')
        self.env['PGPASSWORD'] = self.env.get('PGPASSWORD') or self.env.get('DB_PASSWORD', '')
        self.env['AUTOTRADE_ACCEPTANCE_ROOT']=str(ROOT)
        self.operator_account = args.operator_account or subprocess.check_output(
            [args.pwsh,'-NoProfile','-Command','(Get-Acl -LiteralPath $env:AUTOTRADE_ACCEPTANCE_ROOT).Owner'],
            env=self.env,text=True).strip()
        require(self.operator_account and not self.operator_account.upper().startswith(('BUILTIN\\','NT AUTHORITY\\')),
                'Specify an individual operator account for protected credential handoff')
        self.private = ROOT / '.env.tv3-final.private.json'
        self.journal = ROOT / '.env.tv3-final.journal.json'
        self.ev = None
        self.state = None
        self.server = None
        self.logs = []
        require(re.fullmatch(r'[A-Za-z0-9_]+', args.username), 'Unsupported username')
        require(subprocess.run(['git','branch','--show-current'],cwd=ROOT,capture_output=True,text=True).stdout.strip() == 'TV3', 'Must run on TV3')
        self.baseline = subprocess.check_output(['git','rev-parse','origin/main'],cwd=ROOT,text=True).strip()
        require(subprocess.run(['git','merge-base','--is-ancestor',self.baseline,'HEAD'],cwd=ROOT).returncode == 0, 'Fetch/integrate main first')
        for file in FILES: require((ROOT/file).is_file(), 'Missing official source: '+file)
        self.hashes = {f:digest((ROOT/f).read_bytes()) for f in FILES}

    def redact(self, output):
        for k,v in self.env.items():
            if v and (k in ['PGPASSWORD','DB_PASSWORD','AUTOTRADE_PRIVATE_DEMO_PASSWORD','AUTOTRADE_DEMO_BCRYPT_HASH','SMTP_PASSWORD','SMTP_USERNAME','JWT_SECRET']):
                output = output.replace(v, '[PRIVATE]')
        output = re.sub(r'\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}', '[PRIVATE_BCRYPT]', output)
        # Error DETAIL/CONTEXT can contain whole auth rows, tokens or SQL parameters.
        return '\n'.join(line.rstrip() for line in output.splitlines() if not re.match(r'^(DETAIL|CONTEXT|STATEMENT):',line)).rstrip()

    def private_write(self, path, obj):
        require(os.name == 'nt', 'This private handoff uses Windows ACL; port ACL protection explicitly on other OS')
        if not path.exists(): path.touch()
        sid = subprocess.check_output(['whoami','/user','/fo','csv','/nh'],text=True).strip().split(',')[-1].strip('"')
        acl = subprocess.run(['icacls',str(path),'/inheritance:r','/grant:r',f'*{sid}:(F)',
                              '*S-1-5-18:(F)',self.operator_account+':(F)'],capture_output=True)
        require(acl.returncode == 0, 'Private file ACL failed')
        path.write_text(json.dumps(obj,indent=2),encoding='utf-8')

    def save(self): self.private_write(self.journal,self.state)

    def guard(self):
        s = self.server
        return ("DO $$ BEGIN IF current_database() <> 'autotrade_final' "
            f"OR current_user <> '{self.a.username}' OR inet_server_port() <> {self.a.port} "
            f"OR (SELECT system_identifier::text FROM pg_control_system()) <> '{s['system_identifier']}' "
            f"OR (SELECT oid FROM pg_database WHERE datname=current_database()) <> {self.state['database_oid']} "
            "THEN RAISE EXCEPTION 'Acceptance target/server mismatch'; END IF; END $$;\n")

    def command(self, db):
        return [self.a.psql,'-X','-w','-h',self.a.host,'-p',str(self.a.port),'-U',self.a.username,
                '-d',db,'-v','ON_ERROR_STOP=1','-At','-f','-']

    def run(self, label, query=None, file=None, db=DB, guard=True):
        text = self.guard() if guard else ''
        if file == FILES[0]:
            require(self.state['created_empty'] and not self.state['completed'], 'Schema replay forbidden')
            text += """DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
              WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%')
              THEN RAISE EXCEPTION 'Schema requires empty database on this connection'; END IF; END $$;
"""
        text += f"\\i '{(ROOT/file).as_posix()}'\n" if file else query
        start = now()
        p = subprocess.run(self.command(db),input=text,env=self.env,capture_output=True,encoding='utf-8',errors='replace')
        entry = dict(label=label,file=file,sha256=digest((ROOT/file).read_bytes()) if file else None,
                     order=FILES.index(file)+1 if file in FILES else None,
                     target_database=db,server=self.server,start=start,end=now(),exit_code=p.returncode,
                     verdict='PASS' if p.returncode==0 else 'FAIL')
        self.logs.append(entry)
        if self.ev:
            (self.ev/(label+'.txt')).write_text(json.dumps(entry,ensure_ascii=False)+'\n'+self.redact(p.stdout+p.stderr)+'\n',encoding='utf-8')
            (self.ev/'execution_log.json').write_text(json.dumps(self.logs,indent=2,ensure_ascii=False),encoding='utf-8')
        require(p.returncode==0, label+': failed; sanitized evidence retained; no subsequent stage executed')
        if file in FILES: print('PASS stage',FILES.index(file)+1,file,flush=True)
        return p.stdout

    def json_query(self,label,query):
        out=self.run(label,query=query)
        return json.loads(next(line for line in out.splitlines() if line.startswith('{') or line.startswith('[')))

    def catalog(self, label):
        out=self.run(label,file='database/tests/final_catalog.sql')
        return json.loads(next(line for line in out.splitlines() if line.startswith('{')))

    def row_state(self):
        # Full-row digests stay in memory/private journal. Never export hashes or temporary auth values.
        out=self.run('row_fingerprint',query="""SELECT jsonb_object_agg(name,fp) FROM
          (SELECT c.relname name, NULL::text fp FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind='r') s;""")
        payload=next((x for x in out.splitlines() if x.startswith('{')), None)
        names=list(json.loads(payload)) if payload else []
        result={}
        for name in sorted(names):
            require(re.fullmatch('[a-z_]+',name),'Unexpected table identifier')
            # SQL returns only a one-way digest; content including credentials never leaves PostgreSQL.
            out=self.run('rows_'+name,query=f"SELECT md5(coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY id),'')),count(*) FROM public.{name} t;")
            result[name]=next(x for x in out.splitlines() if '|' in x)
        return result

    def setup(self):
        stamp=datetime.now(TZ).strftime('%Y%m%d_%H%M%S')
        self.ev=ROOT/'database/evidence'/('final_acceptance_'+stamp)
        self.ev.mkdir()
        out=self.run('server_preflight',query="""SELECT jsonb_build_object('host',inet_server_addr()::text,
          'port',inet_server_port(),'username',current_user,'version',version(),
          'system_identifier',(SELECT system_identifier::text FROM pg_control_system()),
          'data_directory',current_setting('data_directory'));
          SELECT oid FROM pg_database WHERE datname='autotrade_final';""",db='postgres',guard=False)
        lines=out.strip().splitlines()
        self.server=json.loads(lines[0])
        exists=len(lines)>1
        if exists:
            require(self.journal.exists(), 'Existing autotrade_final has no trusted local provenance; blocked, no changes')
            self.state=json.loads(self.journal.read_text(encoding='utf-8'))
            if args_evidence := self.a.recover_created_empty_evidence:
                # Reviewed recovery of an interrupted EMPTY creation checkpoint only.
                # No migration can be replayed; prove CREATE exit=0, same OID/server and still empty.
                require(self.state['pending']=='CREATE DATABASE' and not self.state['completed'], 'Recovery only supports empty creation checkpoint')
                previous=(ROOT/args_evidence).resolve()
                require(previous.is_relative_to(ROOT/'database/evidence'), 'Recovery evidence must be inside repository evidence')
                creation=(previous/'create_database.txt').read_text(encoding='utf-8').splitlines()
                record=json.loads(creation[0])
                require(record['exit_code']==0 and record['server']==self.server and 'CREATE DATABASE' in creation,
                        'No proof of successful creation on intended server')
                identity=(previous/'created_database_identity.txt').read_text(encoding='utf-8').splitlines()
                require(json.loads(identity[0])['exit_code']==0 and int(identity[-1])==int(lines[1]),'Created database OID differs')
                self.state['database_oid']=int(lines[1])
                empty=self.run('recovery_empty_proof',query="SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%'; SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname=current_database();")
                require(empty.strip().splitlines()[-2:]==['0','UTF8'],'Creation recovery requires still-empty UTF8 database')
                self.state.update(created_empty=True,pending=None,catalog_digest=digest(canonical(self.catalog('recovery_empty_catalog'))),rows={},creation_evidence=args_evidence)
                self.save()
                (self.ev/'creation_checkpoint_recovery.txt').write_text('PASS reviewed local checkpoint recovery from '+args_evidence+'; CREATE exit=0; same OID/server; still empty UTF8; no SQL scripts previously executed. Runner empty-row parser fixed; no schema repair needed.\n',encoding='utf-8')
            require(self.state['server']==self.server and self.state['database_oid']==int(lines[1]), 'Existing database/server provenance mismatch')
            require(self.state['hashes']==self.hashes and self.state['baseline']==self.baseline,'Source manifest/baseline changed; requires explicit review')
            require(self.state.get('pending') is None and self.state.get('created_empty') is True,'Ambiguous pending bootstrap; requires review, no replay')
            require(self.state['catalog_digest']==digest(canonical(self.catalog('resume_catalog'))),'Catalog differs from completed checkpoint')
            require(self.state['rows']==self.row_state(),'Rows differ from completed checkpoint; no automated replay')
            require(self.private.exists() or FILES[-1] not in self.state['completed'], 'Retained private seed credential missing')
        else:
            require(not self.journal.exists(),'Database absent but previous provenance exists; no recreation')
            self.state=dict(baseline=self.baseline,server=self.server,hashes=self.hashes,completed=[],pending='CREATE DATABASE',created_empty=False,creation_evidence=self.ev.relative_to(ROOT).as_posix())
            self.save()
            self.run('create_database',query="CREATE DATABASE autotrade_final OWNER "+self.a.username+" ENCODING 'UTF8' TEMPLATE template0;",db='postgres',guard=False)
            out=self.run('created_database_identity',query="SELECT oid FROM pg_database WHERE datname='autotrade_final';",db='postgres',guard=False)
            self.state['database_oid']=int(out.strip())
            self.save()
            out=self.run('prove_empty',query="""SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
              WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%';
              SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname=current_database();""")
            require(out.strip().splitlines()[-2:]==['0','UTF8'],'New database not empty UTF8; schema forbidden')
            self.state.update(created_empty=True,pending=None,catalog_digest=digest(canonical(self.catalog('empty_catalog'))),rows=self.row_state())
            self.save()
        self.credentials()
        (self.ev/'baseline.json').write_text(json.dumps(dict(origin_main=self.baseline,server=self.server,
            configured_host=self.a.host,database=DB,database_oid=self.state['database_oid'],machine=os.environ.get('COMPUTERNAME'),
            previous_evidence=self.state.get('evidence'),started=now()),indent=2),encoding='utf-8')
        self.state['evidence']=self.ev.relative_to(ROOT).as_posix()
        self.save()

    def credentials(self):
        if self.private.exists():
            obj=json.loads(self.private.read_text(encoding='utf-8'))
            require(obj['database']==DB,'Private credential target mismatch')
        else:
            obj=dict(database=DB,demo_password=self.env.get('AUTOTRADE_PRIVATE_DEMO_PASSWORD') or secrets.token_urlsafe(32),
                     host=self.a.host,port=self.a.port,username=self.a.username)
            # Protect the plaintext handoff before persisting it or computing the hash.
            self.private_write(self.private,obj)
        self.env['AUTOTRADE_PRIVATE_DEMO_PASSWORD']=obj['demo_password']
        if obj.get('bcrypt_hash'): self.env['AUTOTRADE_DEMO_BCRYPT_HASH']=obj['bcrypt_hash']
        args=[self.a.pwsh,'-NoProfile','-File',str(ROOT/'database/tests/New-DemoBcryptHash.ps1'),
              '-CryptoJar',self.a.crypto_jar,'-LoggingJar',self.a.logging_jar,'-OperatorEnvironment']
        p=subprocess.run(args,env=self.env,capture_output=True,text=True)
        require(p.returncode==0 and re.fullmatch(r'\$2[aby]\$12\$[./A-Za-z0-9]{53}',p.stdout.strip()), 'Private BCrypt12 generation/compatibility failed; raw diagnostics suppressed')
        self.env['AUTOTRADE_DEMO_BCRYPT_HASH']=p.stdout.strip()
        obj['bcrypt_hash']=p.stdout.strip()
        self.private_write(self.private,obj)

    def auth_seed(self, label):
        self.run(label+'_target',query='SELECT current_database(),inet_server_addr(),inet_server_port(),current_user;')
        start=now()
        p=subprocess.run([self.a.pwsh,'-NoProfile','-File',str(ROOT/'database/tests/run_demo_auth_seed.ps1'),
          '-Database',DB,'-Psql',self.a.psql,'-DbHost',self.a.host,'-Port',str(self.a.port),'-Username',self.a.username],
          env=self.env,capture_output=True,encoding='utf-8',errors='replace')
        entry=dict(label=label,file=FILES[-1],sha256=self.hashes[FILES[-1]],target_database=DB,server=self.server,
                   order=9,
                   start=start,end=now(),exit_code=p.returncode,verdict='PASS' if p.returncode==0 else 'FAIL')
        self.logs.append(entry)
        (self.ev/(label+'.txt')).write_text(json.dumps(entry)+'\n'+self.redact(p.stdout+p.stderr),encoding='utf-8')
        (self.ev/'execution_log.json').write_text(json.dumps(self.logs,indent=2),encoding='utf-8')
        require(p.returncode==0,label+': seed failed (private raw diagnostics suppressed)')
        print('PASS',label,flush=True)

    def bootstrap(self):
        completed=self.state['completed']
        require(completed==FILES[:len(completed)],'Journal is not an ordered completed prefix')
        for i,file in enumerate(FILES):
            if file in completed: continue
            if i==0:
                out=self.run('schema_empty_guard',query="SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public';")
                require(out.strip().splitlines()[-1]=='0' and self.state['created_empty'],'schema requires proven fresh empty database')
            self.state['pending']=file
            self.save()
            try:
                if i==8: self.auth_seed(f'{i+1:02d}_auth_seed')
                else: self.run(f'{i+1:02d}_'+Path(file).stem,file=file)
            except RuntimeError:
                # No repair or replay. Record actual remaining catalog after failed session disconnect.
                self.state['failed_catalog_digest']=digest(canonical(self.catalog('failed_stage_live_catalog')))
                self.save()
                raise
            completed.append(file)
            self.state.update(pending=None,catalog_digest=digest(canonical(self.catalog(f'checkpoint_{i+1}'))),rows=self.row_state())
            self.save()
        (self.ev/'migration_manifest.json').write_text(json.dumps([
            dict(order=i+1,path=f,sha256=self.hashes[f],verdict='PASS',target_database=DB,
                 execution='this invocation' if any(l.get('file')==f for l in self.logs) else 'prior trusted checkpoint')
            for i,f in enumerate(FILES)],indent=2),encoding='utf-8')

    def inventory(self,label):
        obj=self.json_query(label,"""SELECT jsonb_build_object(
          'vehicles',(SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM
            (SELECT v.*,s.name showroom_name FROM vehicles v JOIN showrooms s ON s.id=v.showroom_id WHERE demo_key IS NOT NULL) v),
          'accounts',(SELECT jsonb_agg(to_jsonb(u) ORDER BY id) FROM
            (SELECT id,username,email,role,active,email_verified,locked FROM app_users WHERE username IN ('customer','staff','admin')) u),
          'counts',jsonb_build_object('vehicles',(SELECT count(*) FROM vehicles),'users',(SELECT count(*) FROM app_users),
            'sources',(SELECT count(*) FROM sources),'listings',(SELECT count(*) FROM listings),
            'deposits',(SELECT count(*) FROM deposits),'appointments',(SELECT count(*) FROM appointments),
            'ledger',(SELECT count(*) FROM transaction_ledger),'otps',(SELECT count(*) FROM auth_otps),
            'reset_sessions',(SELECT count(*) FROM password_reset_sessions)),
          'bcrypt12_same_private_hash', (SELECT count(*)=3 AND bool_and(password_hash ~ '^\\$2[aby]\\$12\\$')
            AND count(DISTINCT password_hash)=1 FROM app_users WHERE username IN ('customer','staff','admin')));""")
        require(len(obj['vehicles'])==10 and sorted(v['demo_key'] for v in obj['vehicles'])==[f'DEMO-{i:02d}' for i in range(1,11)],'Demo vehicle keys invalid')
        require([v['status'] for v in sorted(obj['vehicles'],key=lambda v:v['demo_key'])]==['AVAILABLE']*7+['HOLD','RESERVED','SOLD'],'Demo vehicle states changed')
        require(len(obj['accounts'])==3 and {u['username']:u['role'] for u in obj['accounts']}==dict(customer='CUSTOMER',staff='STAFF',admin='ADMIN'),'Demo identities/roles invalid')
        require(all(u['active'] and u['email_verified'] and not u['locked'] for u in obj['accounts']) and obj['bcrypt12_same_private_hash'],'Auth seed states/hash invalid')
        (self.ev/(label+'.json')).write_text(json.dumps(obj,indent=2,ensure_ascii=False),encoding='utf-8')
        return obj

    def verify(self):
        before=self.row_state()
        inventory=self.inventory('seed_before_repeat')
        self.run('seed_repeat_showroom',file=FILES[-2])
        self.auth_seed('seed_repeat_auth')
        require(before==self.row_state() and inventory==self.inventory('seed_after_repeat'),'Seed rerun altered IDs, fields, credentials or business rows')
        (self.ev/'seed_repeat_verdict.txt').write_text('PASS both seeds twice; all public-table full-row fingerprints equal; stable IDs/credentials/roles/states; no additional business rows.\n',encoding='utf-8')
        for name in ['auth_catalog_test','auth_identity_test','auth_required_identity_test','auth_temporary_records_test','appointment_ledger_catalog_test','deposit_integrity_test','appointment_ledger_integrity_test']:
            p=ROOT/'database/tests'/(name+'.sql')
            source=p.read_text(encoding='utf-8')
            if name in ['auth_identity_test','auth_required_identity_test','auth_temporary_records_test','deposit_integrity_test','appointment_ledger_integrity_test']:
                require(source.strip().endswith('ROLLBACK;') and 'BEGIN;' in source,'Unsafe mutation test transaction')
                require(not re.search(r'\b(DROP|TRUNCATE|ALTER TABLE|COMMIT|setval)\b',source,re.I),'Unsafe mutation test content')
                customer="(SELECT id FROM public.app_users WHERE username='customer')"
                source=source.replace('v_vehicle, 1,',f'v_vehicle, {customer},').replace(',v,1,s,100',f',v,{customer},s,100')
                source=source.replace('VALUES (1,%s',"VALUES ("+customer.replace("'","''")+",%s")
                if name=='deposit_integrity_test':
                    source=source.replace('BEGIN;',"BEGIN;\nINSERT INTO vehicles(brand,model,manufacture_year,showroom_id,status,demo_key) VALUES('TV3','Final transactional fixture',2020,1,'AVAILABLE','TV3-FINAL-ROLLBACK');",1)
                    source=source.replace("WHERE v.status = 'AVAILABLE'", "WHERE v.demo_key = 'TV3-FINAL-ROLLBACK' AND v.status = 'AVAILABLE'")
                if name=='auth_temporary_records_test':
                    marker=" INSERT INTO public.appointments(user_id,vehicle_id,showroom_id,appointment_date) VALUES(u,v,s,'2030-01-01') RETURNING id INTO a;"
                    isolated=""" -- Deposit independently prevents deletion with both auth records still present.
 PERFORM pg_temp.expect_temp_error(format('DELETE FROM public.app_users WHERE id=%s',u),'23001,23503','fk_deposits_user');
 IF NOT EXISTS(SELECT 1 FROM public.auth_otps WHERE id=o)
   OR NOT EXISTS(SELECT 1 FROM public.password_reset_sessions WHERE id=r)
   OR NOT EXISTS(SELECT 1 FROM public.deposits WHERE id=d)
   OR EXISTS(SELECT 1 FROM public.appointments WHERE user_id=u)
 THEN RAISE EXCEPTION 'Independent deposit RESTRICT lost records'; END IF;
 RAISE NOTICE 'PASS independent deposit RESTRICT preserves both auth records and history';
"""
                    require(marker in source,'Temporary auth fixture source changed; review needed')
                    source=source.replace(marker,isolated+marker)
                source='-- Acceptance-safe reviewed transactional variant; fixtures rollback.\n'+source
                file=self.ev/(name+'.acceptance.sql')
                file.write_text(source,encoding='utf-8')
                self.run('test_'+name,file=file.relative_to(ROOT).as_posix())
            else: self.run('test_'+name,file=p.relative_to(ROOT).as_posix())
            require(before==self.row_state(),'Test changed persisted rows: '+name)
            print('PASS integrity',name,flush=True)
        self.run('test_base_inventory_integrity',file='database/tests/final_inventory_integrity.sql')
        require(before==self.row_state(),'Base inventory test changed persisted rows')
        self.concurrent_deposit()
        require(before==self.row_state(),'Concurrency cleanup changed persisted rows')
        catalog=self.catalog('live_catalog')
        (self.ev/'live_catalog.json').write_text(json.dumps(catalog,indent=2,ensure_ascii=False),encoding='utf-8')
        self.inventory('final_inventory')
        self.state.update(catalog_digest=digest(canonical(catalog)),rows=before,acceptance='PASS',pending=None)
        self.save()
        self.run('connection_route',query="SELECT current_database(),inet_server_addr(),inet_server_port(),current_user; SHOW listen_addresses; SHOW port; SELECT type,database,user_name,address,auth_method,error FROM pg_hba_file_rules ORDER BY rule_number;")
        (self.ev/'integrity_verdict.txt').write_text('PASS exact auth29 catalog; identity/CHECK/NULL/default/index/FK; independent deposit and appointment RESTRICT preserves auth/business; soft disable; eligible user auth CASCADE; deposit positive amount and uniqueness; concurrent uniqueness 23505 + uq_deposits_vehicle_deposited; appointment/ledger; full-row rollback preservation; zero tagged test residue. PostgreSQL sequence gaps retained.\n',encoding='utf-8')

    def concurrent_deposit(self):
        tag='TV3-FINAL-'+secrets.token_hex(6)
        self.state['pending']='concurrent_test:'+tag
        self.save()
        ids=self.json_query('concurrent_fixture',f"""WITH u AS (
          INSERT INTO app_users(username,email,password_hash,full_name)
          SELECT '{tag}','{tag.lower()}@example.test',password_hash,'{tag}' FROM app_users WHERE username='customer' RETURNING id
        ), v AS (INSERT INTO vehicles(brand,model,manufacture_year,showroom_id,status,demo_key,description)
          VALUES('TV3','Concurrent fixture',2020,1,'AVAILABLE','{tag}','{tag}') RETURNING id)
          SELECT jsonb_build_object('user_id',(SELECT id FROM u),'vehicle_id',(SELECT id FROM v));""")
        u,v=ids['user_id'],ids['vehicle_id']
        require(u and v,'Concurrent fixture creation failed')
        def insert(suffix): return f"INSERT INTO deposits(deposit_code,vehicle_id,user_id,showroom_id,amount,status) VALUES('{tag}-{suffix}',{v},{u},1,100,'DEPOSITED');"
        a=b=None
        try:
            env=self.env.copy();env['PGAPPNAME']=tag+'-A'
            a=subprocess.Popen(self.command(DB),env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding='utf-8')
            a.stdin.write(self.guard()+"\\set VERBOSITY verbose\nBEGIN;\n"+insert('A')+"SELECT pg_sleep(4); COMMIT;\n");a.stdin.close()
            for _ in range(60):
                out=self.run('concurrent_sync',query=f"SELECT count(*) FROM pg_stat_activity WHERE application_name='{tag}-A' AND wait_event='PgSleep';")
                if out.strip().splitlines()[-1]=='1': break
                require(a.poll() is None,'First concurrent client exited before synchronization')
                time.sleep(.05)
            else: raise RuntimeError('Concurrent synchronization timeout')
            start=now()
            b=subprocess.run(self.command(DB),input=self.guard()+"\\set VERBOSITY verbose\n"+insert('B'),env=self.env,capture_output=True,text=True,encoding='utf-8',timeout=25)
            oa=a.stdout.read();ea=a.stderr.read();a.wait(timeout=25)
            require(a.returncode==0 and b.returncode!=0 and '23505' in b.stderr and 'uq_deposits_vehicle_deposited' in b.stderr,'Unexpected concurrent outcome')
            check=self.run('concurrent_winner_count',query=f"SELECT count(*) FROM deposits WHERE vehicle_id={v} AND status='DEPOSITED';")
            require(check.strip().splitlines()[-1]=='1','Wrong number of winners')
            (self.ev/'concurrent_deposit.json').write_text(json.dumps(dict(start=start,end=now(),target=DB,server=self.server,
               fixture_tag=tag,user_id=u,vehicle_id=v,session_A_exit=a.returncode,session_B_exit=b.returncode,
               expected_sqlstate='23505',expected_constraint='uq_deposits_vehicle_deposited',verdict='PASS',
               diagnostics=self.redact(ea+b.stderr)),indent=2),encoding='utf-8')
        finally:
            if a and a.poll() is None: a.terminate();a.wait(timeout=10)
            # Only exact tagged IDs created by this test; refuse cleanup of any foreign fixture history.
            cleanup=self.run('concurrent_cleanup',query=f"""BEGIN;
              DO $$ BEGIN
                IF NOT EXISTS(SELECT 1 FROM app_users WHERE id={u} AND username='{tag}' AND full_name='{tag}')
                  OR NOT EXISTS(SELECT 1 FROM vehicles WHERE id={v} AND demo_key='{tag}' AND description='{tag}')
                  OR EXISTS(SELECT 1 FROM deposits WHERE (user_id={u} OR vehicle_id={v}) AND deposit_code NOT IN ('{tag}-A','{tag}-B'))
                  OR EXISTS(SELECT 1 FROM appointments WHERE user_id={u} OR vehicle_id={v})
                  OR EXISTS(SELECT 1 FROM transaction_ledger WHERE deposit_id IN(SELECT id FROM deposits WHERE vehicle_id={v}))
                THEN RAISE EXCEPTION 'Fixture cleanup provenance/history mismatch'; END IF;
              END $$;
              DELETE FROM deposits WHERE vehicle_id={v} AND user_id={u} AND deposit_code IN ('{tag}-A','{tag}-B');
              DELETE FROM vehicles WHERE id={v} AND demo_key='{tag}';
              DELETE FROM app_users WHERE id={u} AND username='{tag}'; COMMIT;
              SELECT (SELECT count(*) FROM app_users WHERE username='{tag}')+
                (SELECT count(*) FROM vehicles WHERE demo_key='{tag}')+
                (SELECT count(*) FROM deposits WHERE deposit_code LIKE '{tag}%') AS residue;""")
            require(cleanup.strip().splitlines()[-1]=='0','Tagged concurrent fixture residue remains')
            self.state['pending']=None
            self.save()

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--host',default=os.environ.get('DB_HOST','localhost'))
    p.add_argument('--port',type=int,default=int(os.environ.get('DB_PORT','5432')))
    p.add_argument('--username',default=os.environ.get('DB_USERNAME','postgres'))
    p.add_argument('--psql',default=r'C:\Program Files\PostgreSQL\18\bin\psql.exe')
    p.add_argument('--pwsh',default='pwsh')
    p.add_argument('--crypto-jar',default=r'D:\maven-repository\org\springframework\security\spring-security-crypto\6.3.3\spring-security-crypto-6.3.3.jar')
    p.add_argument('--logging-jar',default=r'D:\maven-repository\commons-logging\commons-logging\1.3.5\commons-logging-1.3.5.jar')
    p.add_argument('--recover-created-empty-evidence',help='Explicit reviewed proof for interrupted empty CREATE checkpoint; never migration recovery')
    p.add_argument('--operator-account',help='Individual Windows operator account; defaults to workspace owner')
    args=p.parse_args()
    # Prevent two local runners from racing creation/checkpoint writes. File is ignored.
    import msvcrt
    lock=open(ROOT/'.env.tv3-final.lock','a+b')
    lock.seek(0);lock.write(b'0');lock.flush();lock.seek(0)
    try: msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
    except OSError:
        print('BLOCKED: another final acceptance runner holds the local lock',file=sys.stderr)
        return 1
    a=Acceptance(args)
    try:
        a.setup(); a.bootstrap(); a.verify()
        print('PASS TV3 database acceptance:',a.ev.relative_to(ROOT).as_posix())
    except Exception as exc:
        message=a.redact(type(exc).__name__+': '+str(exc))
        if a.ev: (a.ev/'BLOCKER.txt').write_text(now()+' '+message+'\n',encoding='utf-8')
        print('BLOCKED:',message,file=sys.stderr)
        return 1
    return 0

if __name__=='__main__': sys.exit(main())
