param([Parameter(Mandatory)][string]$Database,[string]$Psql='psql',
    [string]$DbHost=$env:PGHOST,[string]$Port=$env:PGPORT,[string]$Username=$env:PGUSER)
$ErrorActionPreference='Stop'
if (-not $env:AUTOTRADE_DEMO_BCRYPT_HASH -or $env:AUTOTRADE_DEMO_BCRYPT_HASH -notmatch '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$') {
    throw 'Set AUTOTRADE_DEMO_BCRYPT_HASH privately with DemoBcrypt.java; retain the same hash for reruns.'
}
if (-not $DbHost -or $Port -notmatch '^\d{1,5}$' -or [int]$Port -lt 1 -or [int]$Port -gt 65535 -or
    $Username -notmatch '^[a-zA-Z0-9_]+$' -or $Database -notmatch '^[a-zA-Z0-9_]+$') {
    throw 'Explicit host, port, username and safe database name required'
}
# Guard and seed share one connection. Raw diagnostics may contain a hash.
$seed=(Join-Path $PSScriptRoot '../seed/demo_auth_accounts.sql').Replace('\','/')
$inputSql="DO `$`$ BEGIN IF current_database() <> '$Database' OR inet_server_port() <> $Port OR current_user <> '$Username' THEN RAISE EXCEPTION 'Seed target mismatch'; END IF; END `$`$;`n\i '$seed'"
$result=$inputSql | & $Psql -X -w -h $DbHost -p $Port -U $Username -d $Database -v ON_ERROR_STOP=1 -f - 2>&1
if ($LASTEXITCODE -ne 0) { throw 'Demo seed rejected: check schema or identity collision privately; raw diagnostic suppressed.' }
Write-Output 'PASS local demo seed (no credentials logged)'
