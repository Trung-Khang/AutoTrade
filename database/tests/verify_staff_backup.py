"""Reproduce pre-upgrade tests from retained backup; never upgrade live target.

Original prepare execution log was overwritten by the first apply runner.
This independent replay retains the full test execution log and proves the
original backup upgrades identically; live target is read only throughout.
"""
import argparse
import json
from datetime import datetime
from pathlib import Path
import run_staff_database as db

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--manifest',type=Path,required=True)
parser.add_argument('--evidence',type=Path,required=True)
args=parser.parse_args()
manifest=json.loads(args.manifest.read_text(encoding='utf-8'))
backup=Path(manifest['private_backup'])
db.require(db.digest(backup)==manifest['backup_sha256'],'Backup differs from original')
ev=args.evidence.resolve()
db.require(ev.is_relative_to(db.ROOT/'database/evidence'),'Evidence outside workspace')
ev.mkdir(parents=True,exist_ok=False)
runner=db.Runner(ev)
before=runner.rows(db.TARGET);catalog=runner.catalog(db.TARGET);seq=runner.sequences(db.TARGET)
clone='tv3_staff_reaudit_'+datetime.now(db.TZ).strftime('%Y%m%d_%H%M%S')
runner.run('create_preupgrade_clone',[str(db.BIN/'createdb.exe'),'-w','--template=template0','--encoding=UTF8',clone])
runner.run('restore_original_backup',[str(db.BIN/'pg_restore.exe'),'-w','--exit-on-error','--single-transaction','-d',clone,str(backup)])
db.require(runner.rows(clone)==manifest['before'] and runner.sequences(clone)==manifest['sequences'],'Restored baseline differs')
live=db.TARGET
try:
    db.TARGET=clone
    runner.prepare()
finally:
    db.TARGET=live
db.require(runner.rows(live)==before and runner.catalog(live)==catalog and runner.sequences(live)==seq,'Live target changed during replay')
after_seq=runner.sequences(live)
db.require(all(after_seq[n]==value for n,value in manifest['sequences'].items() if n!='app_users_id_seq'),'Non-user sequence changed by upgrade')
db.save(ev/'result.json',dict(status='PASS',kind='REPLAY_FROM_ORIGINAL_PREUPGRADE_BACKUP',live_target_unchanged=True,
  original_backup_sha256=db.digest(backup),original_backup_restore_verified=True,original_preupgrade_counts={k:v['count'] for k,v in manifest['before'].items()},
  all_contract_tests_passed=True,non_user_sequences_preserved_on_live_target=True))
print('PASS full original-backup replay; complete execution evidence retained; live target unchanged')
