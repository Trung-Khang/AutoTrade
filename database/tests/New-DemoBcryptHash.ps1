# Invoke with stdout captured into AUTOTRADE_DEMO_BCRYPT_HASH, never a log.
param([Parameter(Mandatory)][string]$CryptoJar,[Parameter(Mandatory)][string]$LoggingJar,[string]$Java='java')
$ErrorActionPreference='Stop'
$secure=Read-Host 'Private local demo credential (retain in your private vault)' -AsSecureString
$ptr=[IntPtr]::Zero
$previous=$env:AUTOTRADE_PRIVATE_DEMO_PASSWORD
try {
    $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $env:AUTOTRADE_PRIVATE_DEMO_PASSWORD=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    $cp=$CryptoJar+[IO.Path]::PathSeparator+$LoggingJar
    $hash=& $Java --class-path $cp (Join-Path $PSScriptRoot 'DemoBcrypt.java') --operator-env 2>&1
    if ($LASTEXITCODE -ne 0 -or ($hash -join '') -notmatch '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$') {
        throw 'Spring BCrypt hash/credential verification failed; diagnostics suppressed'
    }
    Write-Output ($hash -join '')
} finally {
    if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    $env:AUTOTRADE_PRIVATE_DEMO_PASSWORD=$previous
    $secure.Dispose()
}
