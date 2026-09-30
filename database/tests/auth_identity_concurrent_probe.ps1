# Separate two-session uniqueness probe, disposable DB only.
param([Parameter(Mandatory)][string]$Database,[Parameter(Mandatory)][string]$EvidenceDirectory,[string]$Psql='psql')
$ErrorActionPreference='Stop'
if ($Database -notmatch '^tv3_auth_[0-9_]+[a-f0-9]+(?:_[a-z]+)?$') { throw 'Require a runner-created disposable DB' }
foreach ($kind in @('username','email')) {
    $first="BEGIN; INSERT INTO public.app_users(username,email,password_hash,full_name) SELECT 'Race.$kind','race.$kind@example.test',password_hash,'Concurrent fixture' FROM public.app_users WHERE username='customer'; SELECT pg_sleep(3); COMMIT;"
    $name=if ($kind -eq 'username') { 'rACE.username' } else { 'Race.email.other' }
    $email=if ($kind -eq 'email') { 'race.email@example.test' } else { 'race.other@example.test' }
    $second="INSERT INTO public.app_users(username,email,password_hash,full_name) SELECT '$name','$email',password_hash,'Concurrent fixture' FROM public.app_users WHERE username='customer';"
    $task={ param($exe,$db,$stmt)
        $output=& $exe -X -w -d $db -v ON_ERROR_STOP=1 -c $stmt 2>&1
        [pscustomobject]@{Code=$LASTEXITCODE;Text=($output -join "`n")}
    }
    $a=Start-Job -ScriptBlock $task -ArgumentList $Psql,$Database,$first
    # Give first session a head start; scheduler order is not required for correctness.
    Start-Sleep -Milliseconds 700
    $b=Start-Job -ScriptBlock $task -ArgumentList $Psql,$Database,$second
    $null=Wait-Job $a,$b -Timeout 30
    if ($a.State -ne 'Completed' -or $b.State -ne 'Completed') { Stop-Job $a,$b; throw 'Concurrent probe timed out' }
    $ra=Receive-Job $a; $rb=Receive-Job $b; Remove-Job $a,$b
    $output=($ra.Text+"`n"+$rb.Text) -replace '\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}','[REDACTED_HASH]'
    if ($env:PGPASSWORD) { $output=$output.Replace($env:PGPASSWORD,'[REDACTED]') }
    [IO.File]::WriteAllText((Join-Path $EvidenceDirectory "concurrent_$kind.log"),"session_A_exit=$($ra.Code); session_B_exit=$($rb.Code)`n$output")
    if (($ra.Code -eq 0) -eq ($rb.Code -eq 0) -or $output -notmatch "uq_app_users_${kind}_ci") { throw "Wrong concurrent rejection: $kind" }
    Write-Output "PASS concurrent ${kind}: exactly one commit; intended unique index rejected the other session"
}
