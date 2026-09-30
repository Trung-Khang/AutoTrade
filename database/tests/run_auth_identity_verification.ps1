# Official sequence verifier. Requires Python, Java and psql; PG credentials stay in environment.
[CmdletBinding()]
param([string]$Python='python',[string]$Psql='psql',[string]$CryptoJar,[string]$LoggingJar)
$ErrorActionPreference='Stop'
$saved=@{PSQL=$env:PSQL;TV3_CRYPTO_JAR=$env:TV3_CRYPTO_JAR;TV3_LOGGING_JAR=$env:TV3_LOGGING_JAR}
try {
 $env:PSQL=$Psql
 if ($CryptoJar) { $env:TV3_CRYPTO_JAR=$CryptoJar }
 if ($LoggingJar) { $env:TV3_LOGGING_JAR=$LoggingJar }
 & $Python (Join-Path $PSScriptRoot 'verify_official_tv3.py')
 if ($LASTEXITCODE -ne 0) { throw 'Official verification failed; inspect redacted fresh evidence' }
} finally {
 foreach ($key in $saved.Keys) { [Environment]::SetEnvironmentVariable($key,$saved[$key],'Process') }
}
