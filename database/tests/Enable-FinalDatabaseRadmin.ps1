# Operator-run network provisioning only. Never bootstraps, resets or migrates a database.
# Credentials are read from protected ignored local JSON, never command arguments/logs.
[CmdletBinding()]
param(
    [string]$PrivateConfig=(Join-Path $PSScriptRoot '../../.env.tv3-vpn.operator.json'),
    [string]$Psql='C:\Program Files\PostgreSQL\18\bin\psql.exe'
)
$ErrorActionPreference='Stop'
$PSNativeCommandUseErrorActionPreference=$false
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$db='autotrade_final'
$serverIp='26.181.182.25'
$memberIps=@('26.79.139.16','26.252.98.44','26.91.16.138')
$remoteAddresses=@($memberIps | ForEach-Object { $_+'/32' })
$ruleName='AutoTrade-Final-Radmin-TCP5432'
$serviceName='postgresql-x64-18'
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
$ev=Join-Path $root ('database/evidence/radmin_access_'+$stamp)
$result=[ordered]@{
    started=(Get-Date -Format o);database=$db;host=$serverIp;port=5432;username='autotrade_app';
    members=@{TV1=$remoteAddresses[0];TV2=$remoteAddresses[1];TV4=$remoteAddresses[2]};
    status='RUNNING';teammate_tcp='NOT RUN: requires tests from the three member computers';
    teammate_psql='NOT RUN: requires tests from the three member computers';steps=@()
}
$backup=$null;$configFile=$null;$hbaFile=$null;$configChanged=$false;$hbaChanged=$false
$firewallCreated=$false;$profileChanged=$false;$oldCategory=$null;$ifIndex=$null
function Save-Result {
    $result.updated=(Get-Date -Format o)
    $destination=Join-Path $ev 'result.json'
    $temporary=Join-Path $ev 'result.pending.json'
    [IO.File]::WriteAllText($temporary,($result | ConvertTo-Json -Depth 12),[Text.UTF8Encoding]::new($false))
    for ($attempt=0;$attempt -lt 20;$attempt++) {
        try { [IO.File]::Move($temporary,$destination,$true);return }
        catch [IO.IOException] { if ($attempt -eq 19) { throw }; Start-Sleep -Milliseconds 100 }
    }
}
function Record-Step([string]$Name,[string]$Verdict,[string]$Diagnostic='') {
    $result.steps+=@{name=$Name;verdict=$Verdict;time=(Get-Date -Format o);diagnostic=$Diagnostic}
    Save-Result
}
function Protect-Directory([string]$Path) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
    & icacls $Path /inheritance:r /grant:r 'DESKTOP-42GEDK2\DELL:(OI)(CI)(F)' 'NT AUTHORITY\SYSTEM:(OI)(CI)(F)' 'DESKTOP-42GEDK2\CodexSandboxOffline:(OI)(CI)(F)' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Private backup ACL failed' }
}
function Invoke-Db([string]$Label,[string]$Sql,[string]$User='postgres',[switch]$AppCredential) {
    $previous=$env:PGPASSWORD
    try {
        $env:PGPASSWORD=if ($AppCredential) {$private.app_password} else {$private.admin_password}
        $env:PGCLIENTENCODING='UTF8'
        # Same-session identity guard precedes every operation. Suppress statements/error parameters
        # before handling a private credential. Do not persist or print raw psql output on failure.
        $prefix=@"
SET log_statement='none';
SET log_min_error_statement='panic';
SET log_parameter_max_length_on_error=0;
"@
        if ($AppCredential) { $prefix='' }
        $prefix+=@"

DO `$`$ BEGIN IF current_database()<>'autotrade_final' OR inet_server_port()<>5432
  OR current_user<>'$User' OR (SELECT oid FROM pg_database WHERE datname=current_database())<>26921
  THEN RAISE EXCEPTION 'Database target mismatch'; END IF; END `$`$;
"@
        if (-not $AppCredential) {
            $prefix+=@"

DO `$`$ BEGIN IF (SELECT system_identifier::text FROM pg_control_system())<>'7673721980907334164'
 THEN RAISE EXCEPTION 'Cluster identity mismatch'; END IF; END `$`$;
"@
        }
        $raw=($prefix+"`n"+$Sql) | & $Psql -X -w -q -h localhost -p 5432 -U $User -d $db -v ON_ERROR_STOP=1 -At -f - 2>&1
        $code=$LASTEXITCODE
        if ($code -ne 0) { Record-Step $Label 'FAIL' ('psql exit '+$code+'; private raw diagnostic suppressed'); throw "Database operation failed: $Label" }
        return ($raw | ForEach-Object {$_.ToString()}) -join "`n"
    } finally { $env:PGPASSWORD=$previous }
}
function Snapshot([string]$Name) {
    $catalogPath=(Join-Path $PSScriptRoot 'final_catalog.sql').Replace('\','/')
    $catalog=Invoke-Db ($Name+'_catalog') ("\i '$catalogPath'")
    # JSON is schema metadata only. Fingerprints never export auth/business values.
    $obj=$catalog | ConvertFrom-Json
    $rows=[ordered]@{}
    foreach ($table in ($obj.tables.table_name | Sort-Object)) {
        if ($table -notmatch '^[a-z_]+$') { throw 'Unexpected table identifier' }
        $rows[$table]=Invoke-Db ($Name+'_'+$table) ("SELECT md5(coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY id),'')),count(*) FROM public.$table t;")
    }
    [IO.File]::WriteAllText((Join-Path $ev ($Name+'_catalog.json')),$catalog,[Text.UTF8Encoding]::new($false))
    $rows | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $ev ($Name+'_row_fingerprints.json')) -Encoding utf8
    return @{catalog=$catalog;rows=($rows | ConvertTo-Json -Compress)}
}
try {
    $principal=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'Windows Administrator token required; no settings changed'
    }
    if ($env:COMPUTERNAME -ne 'DESKTOP-42GEDK2') { throw 'Wrong database machine' }
    $PrivateConfig=[IO.Path]::GetFullPath($PrivateConfig)
    if (-not $PrivateConfig.StartsWith($root+[IO.Path]::DirectorySeparatorChar) -or
        [IO.Path]::GetFileName($PrivateConfig) -ne '.env.tv3-vpn.operator.json') { throw 'Private config must be the expected ignored workspace file' }
    $private=Get-Content -LiteralPath $PrivateConfig -Raw | ConvertFrom-Json
    if (-not $private.admin_password -or -not $private.app_password) { throw 'Protected operator credentials missing' }
    New-Item -ItemType Directory -Path $ev | Out-Null
    Save-Result
    $vpnProfile=Get-NetConnectionProfile -InterfaceAlias 'Radmin VPN'
    $ifIndex=$vpnProfile.InterfaceIndex;$oldCategory=$vpnProfile.NetworkCategory
    if (-not (Get-NetIPAddress -InterfaceIndex $ifIndex -AddressFamily IPv4 | Where-Object IPAddress -eq $serverIp)) { throw 'Expected Radmin server IP absent' }
    $identity=Invoke-Db 'identity' "SELECT current_database(),current_user,inet_server_addr(),inet_server_port(),version(); SHOW config_file; SHOW hba_file;"
    $parts=$identity -split "`r?`n"
    $result.identity=$parts[0]
    $configFile=$parts[1];$hbaFile=$parts[2]
    if ($configFile -ne 'C:/Program Files/PostgreSQL/18/data/postgresql.conf' -or
        $hbaFile -ne 'C:/Program Files/PostgreSQL/18/data/pg_hba.conf') { throw 'Unexpected actual configuration paths' }
    Record-Step 'identity' 'PASS' $parts[0]
    $before=Snapshot 'before'
    Record-Step 'before_snapshot' 'PASS' 'Live physical catalog and every public-table full-row fingerprint captured'
    $backup=Join-Path $root ('database/backups/radmin_access_'+$stamp)
    Protect-Directory $backup
    Copy-Item -LiteralPath $configFile -Destination (Join-Path $backup 'postgresql.conf')
    Copy-Item -LiteralPath $hbaFile -Destination (Join-Path $backup 'pg_hba.conf')
    $result.backup=$backup
    $result.config_before_sha256=(Get-FileHash -LiteralPath $configFile -Algorithm SHA256).Hash
    $result.hba_before_sha256=(Get-FileHash -LiteralPath $hbaFile -Algorithm SHA256).Hash
    Record-Step 'private_configuration_backup' 'PASS'
    $exists=Invoke-Db 'role_preflight' "SELECT count(*) FROM pg_roles WHERE rolname='autotrade_app';"
    if ($exists.Trim() -ne '0' -and -not $private.role_provisioned) { throw 'Existing app role has no matching private provenance; do not reset its password' }
    if ($exists.Trim() -eq '0') {
        $env:AUTOTRADE_APP_PASSWORD=$private.app_password
        try {
            $null=Invoke-Db 'app_role_create' @'
\getenv app_password AUTOTRADE_APP_PASSWORD
BEGIN;
SET LOCAL password_encryption='scram-sha-256';
CREATE ROLE autotrade_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'app_password';
GRANT CONNECT ON DATABASE autotrade_final TO autotrade_app;
GRANT USAGE ON SCHEMA public TO autotrade_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO autotrade_app;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO autotrade_app;
COMMIT;
'@
        } finally { Remove-Item Env:AUTOTRADE_APP_PASSWORD -ErrorAction SilentlyContinue }
        $private.role_provisioned=$true
        $private | ConvertTo-Json | Set-Content -LiteralPath $PrivateConfig -Encoding utf8
    }
    $privileges=Invoke-Db 'app_role_privileges' @'
SELECT jsonb_build_object('login',rolcanlogin,'superuser',rolsuper,'createdb',rolcreatedb,'createrole',rolcreaterole,
 'replication',rolreplication,'bypassrls',rolbypassrls,'password_is_scram',rolpassword LIKE 'SCRAM-SHA-256$%',
 'schema_create',has_schema_privilege('autotrade_app','public','CREATE'),
 'all_tables_dml',(SELECT bool_and(has_table_privilege('autotrade_app',c.oid,'SELECT')
    AND has_table_privilege('autotrade_app',c.oid,'INSERT') AND has_table_privilege('autotrade_app',c.oid,'UPDATE')
    AND has_table_privilege('autotrade_app',c.oid,'DELETE'))
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'),
 'all_sequences_usage',(SELECT bool_and(has_sequence_privilege('autotrade_app',c.oid,'USAGE'))
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='S'))
 FROM pg_authid WHERE rolname='autotrade_app';
'@
    $permissions=$privileges | ConvertFrom-Json
    if (-not $permissions.login -or -not $permissions.password_is_scram -or $permissions.superuser -or
        $permissions.createdb -or $permissions.createrole -or $permissions.replication -or $permissions.bypassrls -or
        $permissions.schema_create -or -not $permissions.all_tables_dml -or -not $permissions.all_sequences_usage) { throw 'Unexpected app privileges' }
    $result.app_privileges=$permissions
    $appIdentity=Invoke-Db 'app_local_login' 'SELECT current_database(),current_user,version();' 'autotrade_app' -AppCredential
    Record-Step 'app_role_local_login' 'PASS' $appIdentity
    $config=[IO.File]::ReadAllText($configFile)
    $listenPattern='(?m)^\s*listen_addresses\s*=.*$'
    if ([regex]::Matches($config,$listenPattern).Count -ne 1) { throw 'Expected one active listen_addresses setting; review includes/config before editing' }
    $newConfig=[regex]::Replace($config,$listenPattern,"listen_addresses = 'localhost,26.181.182.25'")
    [IO.File]::WriteAllText($configFile,$newConfig,[Text.UTF8Encoding]::new($false));$configChanged=$true
    $hba=[IO.File]::ReadAllText($hbaFile)
    if ($hba -match '(?m)^# BEGIN AUTOTRADE_FINAL_RADMIN') { throw 'Existing managed HBA block requires review; no duplicate block appended' }
    $block="`r`n# BEGIN AUTOTRADE_FINAL_RADMIN`r`n"
    foreach ($ip in $memberIps) { $block+="host    autotrade_final    autotrade_app    $ip/32    scram-sha-256`r`n" }
    $block+="# END AUTOTRADE_FINAL_RADMIN`r`n"
    [IO.File]::WriteAllText($hbaFile,$hba.TrimEnd()+$block,[Text.UTF8Encoding]::new($false));$hbaChanged=$true
    $parseState=Invoke-Db 'config_parse' @'
SELECT jsonb_build_object(
 'hba_error_count',(SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL),
 'file_errors',(SELECT coalesce(jsonb_agg(jsonb_build_object('sourcefile',sourcefile,'line',sourceline,'name',name,'error',error)),'[]'::jsonb)
   FROM pg_file_settings WHERE error IS NOT NULL));
'@
    $parsed=$parseState | ConvertFrom-Json
    $result.pre_restart_parse=$parsed
    Save-Result
    # A changed postmaster-only listen setting may report "setting could not be applied"
    # until restart; that is not a syntax error. All other errors block the restart.
    $unexpected=@($parsed.file_errors | Where-Object { -not ($_.name -eq 'listen_addresses' -and $_.error -eq 'setting could not be applied') })
    if ($parsed.hba_error_count -ne 0 -or $unexpected.Count -ne 0) { throw 'HBA/config parse errors; restart forbidden; see sanitized parse diagnostics' }
    Record-Step 'restricted_postgresql_configuration' 'PASS' 'localhost plus exact VPN server IP; app HBA contains exactly three member /32 rules'
    if (Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue) { throw 'Managed Firewall rule already exists; review before changing' }
    if ($oldCategory -eq 'Public') { Set-NetConnectionProfile -InterfaceIndex $ifIndex -NetworkCategory Private;$profileChanged=$true }
    if ((Get-NetConnectionProfile -InterfaceIndex $ifIndex).NetworkCategory -ne 'Private') { throw 'VPN must be Private; no Public-profile firewall allowance' }
    New-NetFirewallRule -Name $ruleName -DisplayName 'AutoTrade final PostgreSQL - exact Radmin members' -Direction Inbound -Action Allow -Enabled True -Protocol TCP -LocalPort 5432 -LocalAddress $serverIp -RemoteAddress $remoteAddresses -InterfaceAlias 'Radmin VPN' -Profile Private -Program 'C:\Program Files\PostgreSQL\18\bin\postgres.exe' -EdgeTraversalPolicy Block | Out-Null
    $firewallCreated=$true
    Record-Step 'restricted_firewall' 'PASS' 'Private profile, VPN interface/local IP, PostgreSQL executable, TCP5432, three exact /32 remotes'
    Restart-Service -Name $serviceName -ErrorAction Stop
    (Get-Service $serviceName).WaitForStatus('Running',[TimeSpan]::FromSeconds(30))
    $listen=Invoke-Db 'post_restart_local' "SHOW listen_addresses; SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL; SELECT current_database(),current_user,version();"
    $lines=$listen -split "`r?`n"
    if ($lines[0] -ne 'localhost,26.181.182.25' -or $lines[1] -ne '0') { throw 'Unexpected restarted configuration' }
    Record-Step 'service_restart_local_connection' 'PASS' $lines[2]
    $hbaRules=Invoke-Db 'live_hba' "SELECT coalesce(jsonb_agg(jsonb_build_object('database',database,'username',user_name,'address',address,'netmask',netmask,'method',auth_method,'error',error) ORDER BY rule_number),'[]'::jsonb) FROM pg_hba_file_rules WHERE 'autotrade_final'=ANY(database);"
    $rules=$hbaRules | ConvertFrom-Json
    if ($rules.Count -ne 3 -or ($rules | Where-Object {$_.username.Count -ne 1 -or $_.username[0] -ne 'autotrade_app' -or $_.netmask -ne '255.255.255.255' -or $_.address -notin $memberIps -or $_.method -ne 'scram-sha-256' -or $_.error}).Count -gt 0) { throw 'Unexpected effective HBA scope' }
    $result.hba_rules=$rules
    $firewall=Get-NetFirewallRule -Name $ruleName
    $result.firewall=@{profile=$firewall.Profile.ToString();action=$firewall.Action.ToString();
        address=(Get-NetFirewallAddressFilter -AssociatedNetFirewallRule $firewall | Select-Object LocalAddress,RemoteAddress);
        ports=(Get-NetFirewallPortFilter -AssociatedNetFirewallRule $firewall | Select-Object Protocol,LocalPort);
        interface=(Get-NetFirewallInterfaceFilter -AssociatedNetFirewallRule $firewall | Select-Object InterfaceAlias)}
    if (-not (Get-NetTCPConnection -LocalAddress $serverIp -LocalPort 5432 -State Listen)) { throw 'Expected VPN TCP5432 listener missing' }
    Record-Step 'server_vpn_listener' 'PASS' 'Exact VPN address listens; member route still requires tests on their computers'
    $null=Invoke-Db 'app_post_restart_login' 'SELECT current_database(),current_user,version();' 'autotrade_app' -AppCredential
    $after=Snapshot 'after'
    if ($before.catalog -ne $after.catalog -or $before.rows -ne $after.rows) { throw 'Physical schema or public rows changed during network provisioning' }
    Record-Step 'schema_rows_preserved' 'PASS' 'Exact live physical catalog and all public-table full-row fingerprints equal; only role/GRANT/network settings changed'
    $result.config_after_sha256=(Get-FileHash -LiteralPath $configFile -Algorithm SHA256).Hash
    $result.hba_after_sha256=(Get-FileHash -LiteralPath $hbaFile -Algorithm SHA256).Hash
    $result.status='SERVER_CONFIG_PASS_PEER_TESTS_NOT_RUN'
    Save-Result
    Write-Output ('PASS server configuration; member tests NOT RUN; evidence: '+$ev)
} catch {
    # Restore only files/rule/profile changed by this invocation. Never change rows or reset schema.
    $message=$_.Exception.Message
    if ($private) {
        foreach ($secret in @($private.admin_password,$private.app_password)) { if ($secret) {$message=$message.Replace($secret,'[PRIVATE]')} }
    }
    if ($backup) {
        try {
            if ($configChanged) { Copy-Item -LiteralPath (Join-Path $backup 'postgresql.conf') -Destination $configFile -Force }
            if ($hbaChanged) { Copy-Item -LiteralPath (Join-Path $backup 'pg_hba.conf') -Destination $hbaFile -Force }
            if ($firewallCreated) { Remove-NetFirewallRule -Name $ruleName }
            if ($profileChanged) { Set-NetConnectionProfile -InterfaceIndex $ifIndex -NetworkCategory $oldCategory }
            if ($configChanged -or $hbaChanged) { Restart-Service -Name $serviceName -ErrorAction Stop }
            $result.rollback='PASS restored only this invocation configuration/firewall/profile; app role, if committed, retained'
        } catch { $result.rollback='BLOCKED restoring configuration; operator must inspect private backups/service' }
    }
    $result.status='BLOCKED';$result.blocker=$message
    if (Test-Path -LiteralPath $ev) { Save-Result }
    Write-Output ('BLOCKED: '+$message)
    exit 1
}
