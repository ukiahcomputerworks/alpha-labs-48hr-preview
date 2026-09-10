[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $root 'mirror-manifest.json'
$stylesPath = Join-Path $root 'styles.css'
$scriptPath = Join-Path $root 'script.js'
$failures = [System.Collections.Generic.List[string]]::new()

if (-not (Test-Path -LiteralPath $manifestPath)) { throw 'mirror-manifest.json is missing.' }
if (-not (Test-Path -LiteralPath $stylesPath)) { throw 'styles.css is missing.' }
if (-not (Test-Path -LiteralPath $scriptPath)) { throw 'script.js is missing.' }

$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
$styles = Get-Content -Raw -LiteralPath $stylesPath
$script = Get-Content -Raw -LiteralPath $scriptPath

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
    if ($html -notmatch 'styles\.css\?v=41') {
        $failures.Add("Missing Alpha After Dark design cache key v41: $($item.Route)")
    }
    if ($html -notmatch 'script\.js\?v=11') {
        $failures.Add("Missing Alpha After Dark behavior cache key v11: $($item.Route)")
    }
    if ($html -match 'PDF Download[^<]*(?:requires|Requires)|Adobe Acrobat Reader|get\.adobe\.com/reader') {
        $failures.Add("Obsolete Adobe Reader requirement remains: $($item.Route)")
    }
}

$careers = Get-Content -Raw -LiteralPath (Join-Path $root 'careers\index.html')
if ($careers -notmatch 'data-staged-template="lab-tech-careers"') {
    $failures.Add('The retained Laboratory Technician page is missing.')
}
if ($careers -notmatch 'No information is transmitted, stored, or sent') {
    $failures.Add('The Careers form safety notice is missing.')
}

$contact = Get-Content -Raw -LiteralPath (Join-Path $root 'contact-us-alpha-analytical-laboratories-inc\index.html')
if ($contact -notmatch 'TIGERweb 2025 State_County geometry, STATE 06' -or $contact -notmatch 'id="california-boundary"' -or $contact -notmatch 'california-map__shine-sweep') {
    $failures.Add('The official Census-derived California locator or its clipped shimmer is missing.')
}
if ($styles -notmatch '\.california-map\s*\{[\s\S]*?transform:\s*scale\(1\.12\);' -or $styles -notmatch 'transform-origin:\s*center;') {
    $failures.Add('The California locator is missing its approved 12 percent proportional enlargement.')
}

$regulatory = Get-Content -Raw -LiteralPath (Join-Path $root 'regulatory\index.html')
if ($regulatory -notmatch 'data-agency-vault' -or @([regex]::Matches($regulatory, 'data-agency-target=')).Count -ne 6 -or @([regex]::Matches($regulatory, 'data-agency-panel=')).Count -ne 6) {
    $failures.Add('The six-agency regulatory vault interaction is incomplete.')
}
if ($regulatory -notmatch 'agency-vault__masthead' -or $regulatory -notmatch 'agency-vault__poster') {
    $failures.Add('The compact regulatory intelligence masthead or selector poster is missing.')
}
if ($styles -notmatch 'body\.page-id-13 \.entry\s*\{[\s\S]*?border:\s*0\s*!important' -or $styles -notmatch 'agency-vault__masthead::before') {
    $failures.Add('The regulatory outer-frame removal or top-rule masthead treatment is missing.')
}
if ($script -notmatch 'centerDesktopDossier' -or $script -notmatch "behavior:\s*'smooth'") {
    $failures.Add('The regulatory desktop dossier-centering behavior is missing.')
}
if ($styles -notmatch '@media \(min-width: 901px\) and \(max-height: 900px\)' -or $styles -notmatch 'agency-intelligence__panel \{ animation: agency-file-release \.38s ease both; padding: \.5rem 0 \.25rem; \}') {
    $failures.Add('The compact-height regulatory dossier treatment is missing.')
}
foreach ($asset in @('epa.jpg', 'cdph.jpg', 'calrecycle.gif', 'water-board.jpg', 'dtsc.jpg', 'carb.jpg')) {
    if (-not (Test-Path -LiteralPath (Join-Path $root "assets\regulatory\$asset") -PathType Leaf)) {
        $failures.Add("Missing locally preserved agency logo: $asset")
    }
}

$homeMarkup = Get-Content -Raw -LiteralPath (Join-Path $root 'index.html')
if ($homeMarkup -match '<div class="title-area">') {
    $failures.Add('The redundant homepage header logo markup remains.')
}
foreach ($homeMarker in @('California&#8217;s quiet powerhouse for environmental analysis', 'The VIP Treatment&mdash;from Homeowners to the EPA', 'Six premier California locations', 'Over 25,000 square feet of state-of-the-art processing power', 'Fully ELAP-certified across Microbiology, Wet Chemistry, and Organic/Inorganic Chemistry', 'We don&#8217;t just run tests; we craft certainty', 'data-home-business-cta')) {
    if (-not $homeMarkup.Contains($homeMarker)) {
        $failures.Add("The approved homepage story is missing: $homeMarker")
    }
}
if ($homeMarkup -match 'feedback-btn\.png' -or $homeMarkup -match 'is a premier California \(ELAP certifications') {
    $failures.Add('Superseded homepage copy or the obsolete feedback image remains.')
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "PASS: $(@($manifest).Count) retained routes reference the Alpha After Dark design system."
Write-Host 'PASS: robots, responsive viewport, staged Careers content, and preview-form safety are preserved.'
