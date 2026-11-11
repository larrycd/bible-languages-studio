# Bible Languages Studio - update the installed copy to the version in the release folder (by Larry Dalton)
# Run:  powershell -NoProfile -ExecutionPolicy Bypass -File "$([Environment]::GetFolderPath('MyDocuments'))\bible-languages-studio-release\Update-BibleLanguagesStudio.ps1"
$ErrorActionPreference = 'Stop'
$docs = [Environment]::GetFolderPath('MyDocuments')
$zip  = Join-Path $docs 'bible-languages-studio-release\BibleLanguagesStudio-Package.zip'
$work = Join-Path $env:TEMP 'BibleLanguagesStudio-update'
if (-not (Test-Path -LiteralPath $zip)) { throw "Package not found: $zip" }
if (Test-Path -LiteralPath $work) { Remove-Item -LiteralPath $work -Recurse -Force }
Expand-Archive -LiteralPath $zip -DestinationPath $work -Force
# The installer stops the running studio, backs up the current version, installs, verifies over HTTP and rolls back on failure.
& (Join-Path $work 'BibleLanguagesStudio\Install.ps1') -Source (Join-Path $work 'BibleLanguagesStudio\payload')
$health = (Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8769/api/health' -TimeoutSec 10).Content
Write-Host "Server reports: $health"
if ($health -match '"version":"1\.0\.0"') { Write-Host 'Bible Languages Studio 1.0.0 is running. Refresh the studio tab with Ctrl+F5.' -ForegroundColor Green }
else { Write-Host 'The version did not change - see the messages above.' -ForegroundColor Yellow }
