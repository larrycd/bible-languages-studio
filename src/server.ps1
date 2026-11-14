#requires -version 5.1
<#
  Bible Languages Studio - local web server (Windows PowerShell 5.1)
  by Larry Dalton
  Serves the studio from the 'app' folder next to this script at http://localhost:8769/
  Everything runs on this computer. The studio itself does all writing and reading in the browser.
#>
param(
    [int]$Port = 8769,
    [string]$Root = '',
    [switch]$Open,
    [string]$MyDir = ''
)
$ErrorActionPreference = 'Stop'
$Version = '1.0.4'
if (-not $Root) { $Root = Join-Path $PSScriptRoot 'app' }
$Root = [System.IO.Path]::GetFullPath($Root)
if (-not (Test-Path -LiteralPath (Join-Path $Root 'index.html'))) { throw "Bible Languages Studio files not found in $Root" }
# Your own translations (for example your personal ESV or CSB) live outside the studio, in your Documents folder.
# They are only read from there; the studio, its installer and its releases never contain them.
if (-not $MyDir) {
    $docs = [Environment]::GetFolderPath('MyDocuments')
    if (-not $docs -and $env:USERPROFILE) { $docs = Join-Path $env:USERPROFILE 'Documents' }
    if ($docs) { $MyDir = Join-Path $docs 'bible-languages-studio-my-translations' }
}

$Mime = @{
    '.html' = 'text/html; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
    '.tsv' = 'text/plain; charset=utf-8'; '.txt' = 'text/plain; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
    '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.ico' = 'image/x-icon'; '.ttf' = 'font/ttf'; '.wasm' = 'application/wasm'; '.md' = 'text/plain; charset=utf-8'
}

function Send-Bytes {
    param($Response, [byte[]]$Bytes, [string]$Type, [int]$Status = 200)
    $Response.StatusCode = $Status
    $Response.ContentType = $Type
    $Response.Headers['Cache-Control'] = 'no-cache'
    $Response.Headers['X-Content-Type-Options'] = 'nosniff'
    $Response.ContentLength64 = $Bytes.Length
    if ($Bytes.Length -gt 0) { $Response.OutputStream.Write($Bytes, 0, $Bytes.Length) }
}
function Send-Text {
    param($Response, [string]$Text, [string]$Type = 'text/plain; charset=utf-8', [int]$Status = 200)
    Send-Bytes -Response $Response -Bytes ([System.Text.Encoding]::UTF8.GetBytes($Text)) -Type $Type -Status $Status
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() }
catch { Write-Error "Bible Languages Studio could not listen on port $Port. Another program may be using it. ($($_.Exception.Message))"; exit 2 }
Write-Host "Bible Languages Studio $Version is running at http://localhost:$Port/  (Ctrl+C to stop)"
if ($Open) { Start-Process "http://localhost:$Port/" }

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request; $res = $ctx.Response
        try {
            if ($req.HttpMethod -ne 'GET' -and $req.HttpMethod -ne 'HEAD') { Send-Text $res 'Method not allowed' -Status 405; continue }
            $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
            if ($path -eq '/api/health') {
                $json = '{"name":"Bible Languages Studio","version":"' + $Version + '","author":"Larry Dalton","port":' + $Port + '}'
                Send-Text $res $json 'application/json; charset=utf-8'; continue
            }
            if ($path -eq '/my/list') {
                $items = @()
                if ($MyDir -and (Test-Path -LiteralPath $MyDir -PathType Container)) {
                    foreach ($f in Get-ChildItem -LiteralPath $MyDir -Filter '*.json' -File | Sort-Object Name) {
                        $abbr = $f.BaseName; $name = ''
                        try {
                            $fs = [System.IO.File]::OpenRead($f.FullName); $buf = New-Object byte[] 600; $n = $fs.Read($buf, 0, 600); $fs.Close()
                            $head = [System.Text.Encoding]::UTF8.GetString($buf, 0, $n)
                            if ($head -match '"abbr"\s*:\s*"([^"]{1,20})"') { $abbr = $Matches[1] }
                            if ($head -match '"name"\s*:\s*"([^"]{1,80})"') { $name = $Matches[1] }
                        } catch { }
                        $items += ('{"file":"' + $f.Name.Replace('\', '\\').Replace('"', '\"') + '","abbr":"' + $abbr.Replace('"', '') + '","name":"' + $name.Replace('"', '') + '"}')
                    }
                }
                Send-Text $res ('[' + ($items -join ',') + ']') 'application/json; charset=utf-8'; continue
            }
            if ($path -like '/my/*') {
                $name = $path.Substring(4)
                if (-not $MyDir) { Send-Text $res 'Not found' -Status 404; continue }
                $mf = Join-Path $MyDir $name
                if ($name -notmatch '^[A-Za-z0-9 ._()-]{1,80}\.json$' -or -not (Test-Path -LiteralPath $mf -PathType Leaf)) { Send-Text $res 'Not found' -Status 404; continue }
                Send-Bytes $res ([System.IO.File]::ReadAllBytes($mf)) 'application/json; charset=utf-8'; continue
            }
            if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }
            $rel = $path.TrimStart('/').Replace('/', '\')
            if ($rel -match '(^|\\)\.\.(\\|$)' -or $rel -match ':') { Send-Text $res 'Not found' -Status 404; continue }
            $full = [System.IO.Path]::GetFullPath((Join-Path $Root $rel))
            if (-not $full.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $full -PathType Leaf)) {
                Send-Text $res 'Not found' -Status 404; continue
            }
            $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
            $type = $Mime[$ext]; if (-not $type) { $type = 'application/octet-stream' }
            $bytes = [System.IO.File]::ReadAllBytes($full)
            if ($req.HttpMethod -eq 'HEAD') { $res.ContentType = $type; $res.ContentLength64 = $bytes.Length; continue }
            Send-Bytes $res $bytes $type
        }
        catch {
            try { Send-Text $res ('Server error: ' + $_.Exception.Message) -Status 500 } catch { }
        }
        finally {
            try { $res.OutputStream.Close() } catch { }
        }
    }
}
finally {
    $listener.Stop(); $listener.Close()
}
