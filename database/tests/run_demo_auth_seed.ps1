param([Parameter(Mandatory)][string]$Database,[string]$Psql='psql')
$ErrorActionPreference='Stop'
if (-not $env:AUTOTRADE_DEMO_BCRYPT_HASH -or $env:AUTOTRADE_DEMO_BCRYPT_HASH -notmatch '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$') {
    throw 'Set AUTOTRADE_DEMO_BCRYPT_HASH privately with DemoBcrypt.java; retain the same hash for reruns.'
}
# psql may echo an offending row (including its hash). Keep raw output in memory.
$result=& $Psql -X -w -d $Database -v ON_ERROR_STOP=1 -f (Join-Path $PSScriptRoot '../seed/demo_auth_accounts.sql') 2>&1
if ($LASTEXITCODE -ne 0) { throw 'Demo seed rejected: check schema or identity collision privately; raw diagnostic suppressed.' }
Write-Output 'PASS local demo seed (no credentials logged)'
