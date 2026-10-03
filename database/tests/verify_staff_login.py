"""Read-only login/Hibernate probe using the existing packaged backend.

Does not build, edit or restart team services. Own temporary process only.
JWTs/password hashes are never written to public evidence or stdout.
"""
import argparse
import base64
import json
import os
import secrets
import socket
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path
from run_staff_database import ENV, ROOT, Runner, require, save

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--database',required=True)
parser.add_argument('--evidence',type=Path,required=True)
args=parser.parse_args()
require(args.database=='autotrade_final' or args.database.startswith('tv3_staff_'),'Unexpected probe database')
ev=args.evidence.resolve()
require(ev.is_relative_to(ROOT/'database/evidence'),'Evidence outside workspace')
ev.mkdir(parents=True,exist_ok=False)
runner=Runner(ev)
private=ROOT/'database/backups'/ev.parent.name
require(private.exists(),'Protected backup directory missing')
before=runner.rows(args.database)
with socket.socket() as sock:
    sock.bind(('127.0.0.1',0)); port=sock.getsockname()[1]
env=ENV.copy()
env.update(DB_HOST='localhost',DB_PORT='5432',DB_NAME=args.database,DB_USERNAME='postgres',DB_PASSWORD=ENV['PGPASSWORD'],
           DB_SSLMODE='disable',HIBERNATE_DDL_AUTO='validate',SERVER_PORT=str(port),JWT_SECRET=base64.b64encode(secrets.token_bytes(48)).decode(),
           JAVA_TOOL_OPTIONS='-Dfile.encoding=UTF-8',SPRING_JPA_SHOW_SQL='false')
output=(private/(ev.name+'_backend.log')).open('wb')
proc=None
try:
    proc=subprocess.Popen(['java','-jar',str(ROOT/'backend/target/backend-0.0.1-SNAPSHOT.war')],env=env,cwd=ROOT/'backend',
                          stdout=output,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
    base=f'http://127.0.0.1:{port}/api/v1'
    ready=False
    for _ in range(60):
        if proc.poll() is not None:break
        try:
            with urllib.request.urlopen(base+'/listings?size=1',timeout=2) as response:
                ready=response.status==200
            if ready:break
        except (urllib.error.URLError,TimeoutError):time.sleep(1)
    require(ready,'Packaged backend unavailable; private log retained')
    accounts=[('staff_hn_01','staff_hn1@autotrade.vn'),('staff_hn_02','staff_hn2@autotrade.vn'),
      ('staff_hcm_01','staff_hcm1@autotrade.vn'),('staff_hcm_02','staff_hcm2@autotrade.vn'),('staff_hcm_03','staff_hcm3@autotrade.vn'),
      ('staff_dn_01','staff_dn1@autotrade.vn'),('staff_dn_02','staff_dn2@autotrade.vn')]
    results=[]
    for username,email in accounts:
        for identity in (username,email):
            request=urllib.request.Request(base+'/auth/login',data=json.dumps(dict(usernameOrEmail=identity,password='Password@123')).encode(),
                                           headers={'Content-Type':'application/json'},method='POST')
            with urllib.request.urlopen(request,timeout=10) as response:
                data=json.load(response)
                require(response.status==200 and data['username']==username and data['role']=='STAFF' and bool(data['token']),'Wrong login response')
            results.append(dict(username=username,identity_type='username' if identity==username else 'email',http_status=200,role='STAFF'))
    require(runner.rows(args.database)==before,'Login probe changed database rows')
    save(ev/'result.json',dict(status='PASS',database=args.database,hibernate_validate=True,logins=results,rows_unchanged=True,
      staff_assignment_API='NOT VERIFIED: TV4 implementation pending'))
    print('PASS Hibernate validate and 14 staff logins (username/email); rows unchanged')
except Exception as error:
    detail={}
    if isinstance(error,urllib.error.HTTPError):
        detail['http_status']=error.code
        try:
            body=json.loads(error.read())
            detail['message']=body.get('message')
        except Exception:pass
    save(ev/'result.json',dict(status='FAILED',error=str(error) if isinstance(error,RuntimeError) else type(error).__name__,**detail))
    print('FAILED login probe; private diagnostic retained')
    raise SystemExit(1)
finally:
    if proc is not None and proc.poll() is None:
        proc.terminate()
        try:proc.wait(timeout=15)
        except subprocess.TimeoutExpired:proc.kill();proc.wait(timeout=10)
    output.close()
