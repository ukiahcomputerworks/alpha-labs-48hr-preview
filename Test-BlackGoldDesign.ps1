[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $root 'mirror-manifest.json'
$stylesPath = Join-Path $root 'styles.css'
$failures = [System.Collections.Generic.List[string]]::new()

if (-not (Test-Path -LiteralPath $manifestPath)) { throw 'mirror-manifest.json is missing.' }
if (-not (Test-Path -LiteralPath $stylesPath)) { throw 'styles.css is missing.' }

$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
$styles = Get-Content -Raw -LiteralPath $stylesPath

if (@($manifest).Count -ne 35) {
    $failures.Add("Expected 35 retained routes; found $(@($manifest).Count).")
}

foreach ($token in @('--alpha-black', '--alpha-gold-material', '--alpha-champagne', '--alpha-ivory', '--alpha-display', '.alpha-after-dark', '@media (max-width: 600px)')) {
    if (-not $styles.Contains($token)) { $failures.Add("Missing visual-system marker: $token") }
}

foreach ($item in $manifest) {
    $path = Join-Path $root $item.Output
    if (-not (Test-Path -LiteralPath $path)) {
        $failures.Add("Missing route file: $($item.Output)")
        continue
    }

    $html = Get-Content -Raw -LiteralPath $path
    if ($html -notmatch '<meta name="robots" content="noindex, nofollow">') {
        $failures.Add("Missing preview robots protection: $($item.Route)")
    }
    if ($html -notmatch '<meta name="viewport" content="width=device-width, initial-scale=1"') {
        $failures.Add("Missing responsive viewport: $($item.Route)")
    }
    if ($html -notmatch 'styles\.css\?v=31') {
        $failures.Add("Missing Alpha After Dark design cache key v31: $($item.Route)")
    }
}

$careers = Get-Content -Raw -LiteralPath (Join-Path $root 'careers\index.html')
if ($careers -notmatch 'data-staged-template="lab-tech-careers"') {
    $failures.Add('The retained Laboratory Technician page is missing.')
}
if ($careers -notmatch 'No information is transmitted, stored, or sent') {
    $failures.Add('The Careers form safety notice is missing.')
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "PASS: $(@($manifest).Count) retained routes reference the Alpha After Dark design system."
Write-Host 'PASS: robots, responsive viewport, staged Careers content, and preview-form safety are preserved.'
