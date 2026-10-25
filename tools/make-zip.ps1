<#
Builds offline-build.zip for the GamePix / Xsolla upload: index.html at the zip root, forward-slash entry names.
Only the whitelist below is packaged; everything else in the repo (Godot leftovers, .git, prototype/, store/, tools/ ...) stays out.

  powershell -ExecutionPolicy Bypass -File tools\make-zip.ps1             # build offline-build.zip in the repo root
  powershell -ExecutionPolicy Bypass -File tools\make-zip.ps1 -DryRun     # list what would ship and run the checks, write nothing
  powershell -ExecutionPolicy Bypass -File tools\make-zip.ps1 -Out C:\x\game.zip

Checks (exit code 1 if any fails): index.html exists, every local src/href in it is in the zip (case-sensitive,
like a Linux host), entry names have no backslash or "./" prefix, and the zip lists back with index.html at its root.
Asset paths in scripts that do not resolve from the zip root are only warnings.
#>
[CmdletBinding()]
param(
  [switch]$DryRun,
  [string]$Out
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

$repo = Split-Path -Parent $PSScriptRoot
if (-not $Out) { $Out = Join-Path $repo 'offline-build.zip' }
$Out = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Out)

# A directory is packaged recursively (optionally only files matching Filter); a file is packaged as is.
$whitelist = @(
  @{ Path = 'index.html' },
  @{ Path = 'lib' },
  @{ Path = 'game' },
  @{ Path = 'assets/printer/js' },
  @{ Path = 'assets/printer/css' },
  @{ Path = 'assets/office/js' },
  @{ Path = 'assets/office/css' },
  @{ Path = 'audio'; Filter = '*.mp3' }
)
$junk = 'Thumbs.db', 'desktop.ini', '.DS_Store', '.gitkeep', '*.import', '*.psd', '*.bak', '*.tmp'

function Test-Junk([string]$name) {
  foreach ($pattern in $junk) { if ($name -like $pattern) { return $true } }
  return $false
}

function Test-Remote([string]$ref) { return [bool]($ref -match '^(?:https?:)?//') }

# The path a browser would request from the zip root, or $null for data:/mailto:/anchor references.
function Get-LocalPath([string]$ref) {
  if ($ref -match '^(?:[a-z][a-z0-9+.-]*:|//|#)') { return $null }
  return (($ref -split '[?#]')[0] -replace '^\./', '')
}

# ---- collect the files that ship ----
$files = New-Object System.Collections.Generic.List[object]
foreach ($w in $whitelist) {
  $src = Join-Path $repo ($w['Path'] -replace '/', '\')
  if (-not (Test-Path -LiteralPath $src)) { Write-Warning "not found, skipped: $($w['Path'])"; continue }
  $item = Get-Item -LiteralPath $src
  $before = $files.Count
  if ($item.PSIsContainer) {
    # -Include is ignored together with -LiteralPath in Windows PowerShell 5.1, so the filter is applied by hand.
    $found = @(Get-ChildItem -LiteralPath $item.FullName -Recurse -File |
      Where-Object { -not (Test-Junk $_.Name) -and (-not $w['Filter'] -or $_.Name -like $w['Filter']) })
    foreach ($f in $found) {
      $rel = $w['Path'] + '/' + $f.FullName.Substring($item.FullName.Length + 1).Replace('\', '/')
      $files.Add([pscustomobject]@{ Full = $f.FullName; Rel = $rel; Size = $f.Length })
    }
  } elseif (-not (Test-Junk $item.Name)) {
    $files.Add([pscustomobject]@{ Full = $item.FullName; Rel = $w['Path']; Size = $item.Length })
  }
  $bytes = 0
  for ($i = $before; $i -lt $files.Count; $i++) { $bytes += $files[$i].Size }
  Write-Host ('  {0,-22} {1,4} files {2,10:N1} KB' -f $w['Path'], ($files.Count - $before), ($bytes / 1KB))
  if ($files.Count -eq $before) { Write-Warning "nothing to package in: $($w['Path'])" }
}
$totalBytes = 0
foreach ($f in $files) { $totalBytes += $f.Size }
Write-Host ('  total: {0} files, {1:N2} MB unpacked' -f $files.Count, ($totalBytes / 1MB))

if ($DryRun) {
  Write-Host ''
  foreach ($f in $files) { Write-Host ('  {0,10:N0}  {1}' -f $f.Size, $f.Rel) }
}

# ---- checks on what is about to ship ----
$problems = New-Object System.Collections.Generic.List[string]
$known = New-Object 'System.Collections.Generic.HashSet[string]'     # default comparer is case-sensitive
foreach ($f in $files) { [void]$known.Add($f.Rel) }

if (-not $known.Contains('index.html')) {
  if ($DryRun) { Write-Warning 'index.html is missing from the repo root (a real build refuses to run without it)' }
  else { $problems.Add('index.html is missing: it must exist in the repo root and sit at the zip root') }
} else {
  $html = [IO.File]::ReadAllText((Join-Path $repo 'index.html'))
  $refs = foreach ($m in [regex]::Matches($html, '(?:src|href)\s*=\s*["'']([^"'']+)["'']', 'IgnoreCase')) { $m.Groups[1].Value }
  foreach ($ref in @($refs | Select-Object -Unique)) {
    if (Test-Remote $ref) { Write-Host "  remote dependency in index.html: $ref"; continue }
    $p = Get-LocalPath $ref
    if ($p -and -not $known.Contains($p)) { $problems.Add("index.html references '$ref', which is not in the zip") }
  }
}

# Browsers resolve a script's relative asset paths against index.html, not against the script's own folder.
$assetRx = [regex]'["'']([^"''\s]+\.(?:mp3|ogg|wav|png|jpe?g|webp|gif|svg|json|glb|gltf))["'']'
$dangling = New-Object System.Collections.Generic.List[string]
foreach ($f in $files) {
  if ($f.Rel -notlike '*.js' -or $f.Rel -like 'lib/*') { continue }
  foreach ($m in $assetRx.Matches([IO.File]::ReadAllText($f.Full))) {
    $ref = $m.Groups[1].Value
    if (Test-Remote $ref) { continue }
    $p = Get-LocalPath $ref
    if ($p -and -not $known.Contains($p)) {
      $line = "$($f.Rel): '$ref'"
      if (-not $dangling.Contains($line)) { $dangling.Add($line) }
    }
  }
}
if ($dangling.Count) {
  Write-Warning ('{0} asset path(s) in scripts do not resolve from the zip root:' -f $dangling.Count)
  foreach ($line in ($dangling | Select-Object -First 30)) { Write-Host "    $line" }
  if ($dangling.Count -gt 30) { Write-Host "    ... and $($dangling.Count - 30) more" }
}

if ($DryRun) {
  Write-Host ''
  if ($problems.Count) {
    foreach ($p in $problems) { Write-Host "WOULD FAIL: $p" -ForegroundColor Red }
    exit 1
  }
  Write-Host 'Dry run finished: nothing written.' -ForegroundColor Green
  exit 0
}

# ---- stage, zip, verify ----
$tar = Join-Path $env:SystemRoot 'System32\tar.exe'   # bsdtar; Git's GNU tar can shadow "tar" on PATH
if (-not (Test-Path -LiteralPath $tar)) { $problems.Add("bsdtar not found at $tar") }
if ($problems.Count) {
  foreach ($p in $problems) { Write-Host "ERROR: $p" -ForegroundColor Red }
  exit 1
}

$stage = Join-Path $env:TEMP ('offline-stage-' + [guid]::NewGuid().ToString('N'))
try {
  foreach ($f in $files) {
    $dest = Join-Path $stage ($f.Rel -replace '/', '\')
    $dir = Split-Path -Parent $dest
    if (-not (Test-Path -LiteralPath $dir)) { [void](New-Item -ItemType Directory -Path $dir) }
    Copy-Item -LiteralPath $f.Full -Destination $dest
  }

  if (Test-Path -LiteralPath $Out) { Remove-Item -LiteralPath $Out -Force }
  # Explicit top-level names rather than "." so entries carry no "./" prefix.
  $names = @(Get-ChildItem -LiteralPath $stage | ForEach-Object { $_.Name })
  & $tar -a -c -f $Out -C $stage @names
  if ($LASTEXITCODE -ne 0) { throw "tar exited with code $LASTEXITCODE" }

  $entries = @(& $tar -tf $Out)
  if ($LASTEXITCODE -ne 0) { throw "tar could not list $Out (exit code $LASTEXITCODE)" }
  $bad = @($entries | Where-Object { $_ -match '\\' -or $_ -match '^\.?/' })
  if ($bad.Count) { throw "bad entry names (backslash or leading ./ or /): $($bad -join ', ')" }
  if ($entries -cnotcontains 'index.html') { throw 'index.html is not an entry at the zip root' }
  $fileEntries = @($entries | Where-Object { $_ -notmatch '/$' })
  if ($fileEntries.Count -ne $files.Count) { throw "zip holds $($fileEntries.Count) files but $($files.Count) were staged" }
} catch {
  if (Test-Path -LiteralPath $Out) { Remove-Item -LiteralPath $Out -Force }
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
} finally {
  if ($stage -like (Join-Path $env:TEMP 'offline-stage-*') -and (Test-Path -LiteralPath $stage)) {
    Remove-Item -LiteralPath $stage -Recurse -Force
  }
}

Write-Host ''
Write-Host ('Wrote {0}' -f $Out) -ForegroundColor Green
Write-Host ('  {0} files, {1:N2} MB zipped ({2:N2} MB unpacked), index.html at the root, forward-slash entries' -f $fileEntries.Count, ((Get-Item -LiteralPath $Out).Length / 1MB), ($totalBytes / 1MB))
