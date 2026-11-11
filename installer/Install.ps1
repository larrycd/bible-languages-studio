#requires -version 5.1
<#
  Bible Languages Studio installer - by Larry Dalton
  Installs for the current Windows account only (no administrator rights), in %LOCALAPPDATA%\BibleLanguagesStudio.
  Steps: back up any previous version, free port 8769 only if the previous Bible Languages Studio holds it,
  copy the files, start the server, verify it over HTTP, add a sign-in shortcut, open the studio.
  On any failure the previous version is restored. The result is written to %TEMP%\BibleLanguagesStudio-install-result.txt.
#>
param(
    [string]$Source = '',
    [switch]$NoBrowser
)
$ErrorActionPreference = 'Stop'
$Port = 8769
$Version = '1.0.0'
$ResultFile = Join-Path $env:TEMP 'BibleLanguagesStudio-install-result.txt'
if (-not $Source) { $Source = Join-Path $PSScriptRoot 'payload' }
$App = Join-Path $env:LOCALAPPDATA 'BibleLanguagesStudio'
$Startup = [Environment]::GetFolderPath('Startup')
$StartupLnk = Join-Path $Startup 'Bible Languages Studio.lnk'
$PsExe = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$Backup = $null

function Write-Result([string]$Text) { [System.IO.File]::WriteAllText($ResultFile, $Text, [System.Text.Encoding]::ASCII) }
function Step([string]$Text) { Write-Host ('  - ' + $Text) }
function Get-Url([string]$Url, [int]$TimeoutMs = 4000) {
    $rq = [System.Net.WebRequest]::Create($Url)
    $rq.Proxy = $null; $rq.Timeout = $TimeoutMs
    $rs = $rq.GetResponse()
    try {
        $ms = New-Object System.IO.MemoryStream
        $rs.GetResponseStream().CopyTo($ms)
        return , $ms.ToArray()
    } finally { $rs.Close() }
}
function Get-Text([string]$Url) { return [System.Text.Encoding]::UTF8.GetString((Get-Url $Url)) }
function Stop-Studio {
    Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match '\\BibleLanguagesStudio\\server\.ps1' -and $_.ProcessId -ne $PID } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 800
}
function Test-PortFree {
    try { $l = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port); $l.Start(); $l.Stop(); return $true } catch { return $false }
}
function Start-Studio {
    $srv = Join-Path $App 'server.ps1'
    Start-Process -FilePath $PsExe -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', ('"' + $srv + '"')) -WindowStyle Hidden | Out-Null
}

Write-Host ''
Write-Host "Bible Languages Studio $Version installer - by Larry Dalton" -ForegroundColor Red
Write-Host ''
try {
    if ($PSVersionTable.PSVersion.Major -lt 5) { throw 'Windows PowerShell 5.1 or later is required.' }
    foreach ($f in @('server.ps1', 'app\index.html', 'app\engine.js', 'app\data\books.json', 'app\data\glyphs.json', 'app\data\lex\heb.json', 'app\data\lex\grk.json', 'app\data\text\ot_Gen.json', 'app\data\text\nt_Rev.json', 'app\data\text\lxx_Gen.json', 'app\vendor\hb.wasm', 'app\fonts\BLHebrew.ttf', 'app\fonts\BLGreek.ttf', 'app\fonts\BLPaleo.ttf')) {
        if (-not (Test-Path -LiteralPath (Join-Path $Source $f))) { throw "Package file missing: $f" }
    }
    Step 'Package files present'

    $hadOld = Test-Path -LiteralPath $App
    Stop-Studio
    if (-not (Test-PortFree)) { throw "Port $Port is in use by another program. Bible Languages Studio did not stop it and did not change the port." }
    Step "Port $Port is free"

    if ($hadOld) {
        $Backup = $App + '-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
        Move-Item -LiteralPath $App -Destination $Backup
        Step "Previous version backed up to $Backup"
    }
    New-Item -ItemType Directory -Path $App -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $Source 'server.ps1') -Destination $App -Force
    Copy-Item -LiteralPath (Join-Path $Source 'app') -Destination $App -Recurse -Force
    foreach ($f in @('Uninstall.ps1', 'bible.ico')) { $p = Join-Path $Source $f; if (Test-Path -LiteralPath $p) { Copy-Item -LiteralPath $p -Destination $App -Force } }
    Step "Files written to $App"

    Start-Studio
    $health = $null
    for ($i = 0; $i -lt 40 -and -not $health; $i++) {
        Start-Sleep -Milliseconds 500
        try { $health = Get-Text "http://localhost:$Port/api/health" } catch { }
    }
    if (-not $health -or $health -notmatch '"Bible Languages Studio"') { throw 'The server did not start (no answer from /api/health).' }
    Step 'Server started'

    $page = Get-Text "http://localhost:$Port/"
    if ($page -notmatch 'Bible Languages Studio') { throw 'The studio page was not served correctly.' }
    $eng = Get-Text "http://localhost:$Port/engine.js"
    if ($eng -notmatch 'Bible Languages Studio engine') { throw 'The engine was not served correctly.' }
    $books = Get-Text "http://localhost:$Port/data/books.json"
    $bookCount = ([regex]::Matches($books, '"corpus":')).Count
    if ($bookCount -lt 121) { throw "Book list incomplete ($bookCount books)." }
    $missing = 0
    foreach ($b in ([regex]::Matches($books, '"id":"([^"]+)","name":"[^"]*","corpus":"(ot|nt|lxx)"'))) {
        $id = $b.Groups[1].Value; $c = $b.Groups[2].Value
        if ($c -eq 'lxx') { $id = $id.Substring(3) }
        if (-not (Test-Path -LiteralPath (Join-Path $App ('app\data\text\' + $c + '_' + $id + '.json')))) { $missing++ }
    }
    if ($missing -gt 0) { throw "$missing Bible book files are missing." }
    $gen = Get-Text "http://localhost:$Port/data/text/ot_Gen.json"
    if ($gen -notmatch '"H7225G\}"' -and $gen -notmatch 'H7225G') { throw 'The Hebrew text was not served correctly.' }
    $lexh = Get-Text "http://localhost:$Port/data/lex/heb.json"
    $hebEntries = ([regex]::Matches($lexh, '"H\d+[A-Za-z]?":\[')).Count
    if ($hebEntries -lt 11000) { throw "Hebrew dictionary incomplete ($hebEntries entries)." }
    $lexg = Get-Text "http://localhost:$Port/data/lex/grk.json"
    $grkEntries = ([regex]::Matches($lexg, '"G\d+[A-Za-z]?":\[')).Count
    if ($grkEntries -lt 10000) { throw "Greek dictionary incomplete ($grkEntries entries)." }
    foreach ($pair in @(@('vendor\hb.wasm', 'vendor/hb.wasm'), @('fonts\BLHebrew.ttf', 'fonts/BLHebrew.ttf'), @('fonts\BLGreek.ttf', 'fonts/BLGreek.ttf'), @('fonts\BLPaleo.ttf', 'fonts/BLPaleo.ttf'))) {
        $local = (Get-Item -LiteralPath (Join-Path $App ('app\' + $pair[0]))).Length
        $served = (Get-Url ("http://localhost:$Port/" + $pair[1]) 20000).Length
        if ($local -ne $served) { throw ('Not served correctly: ' + $pair[1]) }
    }
    $bad = $false; try { Get-Url "http://localhost:$Port/..%5Cserver.ps1" | Out-Null; $bad = $true } catch { }
    if ($bad) { throw 'The server allowed access outside the studio folder.' }
    Step "Verified over HTTP: page, engine, $bookCount books, $hebEntries Hebrew and $grkEntries Greek dictionary entries, fonts, text shaper, folder protection"

    $ws = New-Object -ComObject WScript.Shell
    $lnk = $ws.CreateShortcut($StartupLnk)
    $lnk.TargetPath = $PsExe
    $lnk.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $App 'server.ps1') + '"'
    $lnk.WindowStyle = 7
    $lnk.Description = 'Bible Languages Studio server (http://localhost:8769/)'
    $ico = Join-Path $App 'bible.ico'; if (Test-Path -LiteralPath $ico) { $lnk.IconLocation = $ico }
    $lnk.Save()
    Step 'Starts automatically when you sign in'

    Write-Result ("OK Bible Languages Studio $Version installed at http://localhost:$Port/")
    Write-Host ''
    Write-Host "Bible Languages Studio is installed and running at http://localhost:$Port/" -ForegroundColor Green
    if (-not $NoBrowser) { Start-Process "http://localhost:$Port/" }
    exit 0
}
catch {
    $msg = $_.Exception.Message
    Write-Host ''
    Write-Host ('Install failed: ' + $msg) -ForegroundColor Red
    try {
        Stop-Studio
        if ($Backup -and (Test-Path -LiteralPath $Backup)) {
            if (Test-Path -LiteralPath $App) { Remove-Item -LiteralPath $App -Recurse -Force }
            Move-Item -LiteralPath $Backup -Destination $App
            Start-Studio
            Write-Host 'The previous version has been restored.'
        }
    } catch { Write-Host ('Restore problem: ' + $_.Exception.Message) }
    Write-Result ('FAIL ' + ($msg -replace '[^\x20-\x7E]', '?'))
    exit 1
}
