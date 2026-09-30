# Run from repository root. Uses existing DB_PASSWORD/PGPASSWORD/pgpass;
# never writes or prints credentials. Retains the fresh disposable DB for evidence.
[CmdletBinding()]
param([switch]$ApplyAudit, [string]$DbUser='postgres')
$ErrorActionPreference='Stop'
$psql='C:\Program Files\PostgreSQL\18\bin\psql.exe'
$repoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$testDb='autotrade_tv3_integrity_' + (Get-Date -Format 'yyyyMMdd_HHmmss_fff')
$evidence=Join-Path $repoRoot ('database/evidence/appointment_ledger_20260930/' + $testDb)
[IO.Directory]::CreateDirectory($evidence) | Out-Null
$auditDb='autotrade_tv3_audit_20260930'
$savedPgPassword=$env:PGPASSWORD
try {
    if (-not $env:PGPASSWORD -and $env:DB_PASSWORD) { $env:PGPASSWORD=$env:DB_PASSWORD }
    function Invoke-SqlFile([string]$db,[string]$file,[string]$log) {
        $output=& $psql -X -w -U $DbUser -d $db -v ON_ERROR_STOP=1 -f (Join-Path $repoRoot $file) 2>&1
        $code=$LASTEXITCODE
        [IO.File]::WriteAllLines((Join-Path $evidence $log),[string[]]$output,[Text.UTF8Encoding]::new($false))
        if ($code -ne 0) { throw "psql failed ($code): $file; see $log" }
        Write-Output "PASS $db : $file"
    }
    # CREATE without IF NOT EXISTS guarantees this DB was not previously populated.
    $output=& $psql -X -w -U $DbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $testDb" 2>&1
    if ($LASTEXITCODE -ne 0) { throw 'Cannot create new isolated database' }
    [IO.File]::WriteAllText((Join-Path $evidence 'isolated_database.txt'),$testDb,[Text.UTF8Encoding]::new($false))
    $files=@('database/schema/schema.sql',
        'database/tests/schema_v2_0_1_smoke_test.sql',
        'database/migrations/V3_0_0__showroom_deposit_appointment.sql',
        'database/migrations/V3_0_1__archive_inventory_boundary.sql',
        'database/migrations/V3_0_2__deposit_integrity.sql',
        'database/seed/demo_showroom_vehicles.sql',
        'database/seed/demo_showroom_vehicles.sql',
        'database/tests/appointment_ledger_preflight.sql',
        'database/migrations/V3_0_3__appointment_ledger_integrity.sql',
        'database/tests/deposit_integrity_test.sql',
        'database/tests/appointment_ledger_integrity_test.sql',
        'database/tests/appointment_ledger_catalog_test.sql',
        'database/tests/appointment_ledger_snapshot.sql')
    $i=0
    foreach ($file in $files) {
        if ($file -eq 'database/migrations/V3_0_3__appointment_ledger_integrity.sql') {
            # Separate disposable clone retains the deliberate violating row.
            $probeDb=$testDb + '_preflight'
            $output=& $psql -X -w -U $DbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $probeDb TEMPLATE $testDb" 2>&1
            if ($LASTEXITCODE -ne 0) { throw 'Cannot create isolated preflight probe' }
            Invoke-SqlFile $probeDb 'database/tests/appointment_ledger_preflight_fixture.sql' 'probe_fixture.log'
            $output=& $psql -X -w -U $DbUser -d $probeDb -v ON_ERROR_STOP=1 -f (Join-Path $repoRoot $file) 2>&1
            $code=$LASTEXITCODE
            [IO.File]::WriteAllLines((Join-Path $evidence 'probe_rejected_migration.log'),[string[]]$output,[Text.UTF8Encoding]::new($false))
            if ($code -eq 0 -or (($output -join "`n") -notmatch 'V3_0_3 preflight failed')) { throw 'Migration preflight did not reject by intended guard' }
            Invoke-SqlFile $probeDb 'database/tests/appointment_ledger_preflight_rejection_test.sql' 'probe_preserved.log'
        }
        $i++; Invoke-SqlFile $testDb $file ('isolated_{0:D2}.log' -f $i)
    }
    Invoke-SqlFile $auditDb 'database/tests/appointment_ledger_snapshot.sql' 'audit_before.log'
    Invoke-SqlFile $auditDb 'database/tests/appointment_ledger_preflight.sql' 'audit_preflight.log'
    if ($ApplyAudit) {
        Invoke-SqlFile $auditDb 'database/migrations/V3_0_3__appointment_ledger_integrity.sql' 'audit_migration.log'
        Invoke-SqlFile $auditDb 'database/tests/appointment_ledger_snapshot.sql' 'audit_after.log'
        if ([IO.File]::ReadAllText((Join-Path $evidence 'audit_before.log')) -cne
            [IO.File]::ReadAllText((Join-Path $evidence 'audit_after.log'))) {
            throw 'Audit row snapshot changed; investigate before declaring preservation'
        }
        Write-Output 'PASS audit complete-row fingerprints and counts unchanged'
    }
} finally {
    if ($null -eq $savedPgPassword) { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
    else { $env:PGPASSWORD=$savedPgPassword }
}
