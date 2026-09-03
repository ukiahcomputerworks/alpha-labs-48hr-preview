[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$stylesPath = Join-Path $siteRoot 'styles.css'
$stagedCssPath = Join-Path $siteRoot 'meeting-staged\banner-overrides.css'
$manifestPath = Join-Path $siteRoot 'mirror-manifest.json'
$testPath = Join-Path $siteRoot 'Test-PublicMirror.ps1'
$cacheVersionPath = Join-Path $siteRoot 'meeting-staged\cache-version.txt'

$styles = Get-Content -Raw -LiteralPath $stylesPath
if ($styles -match 'BEGIN STAGED WATER TRANSITION BANNER') {
    throw 'The staged banner is already applied.'
}

$stagedCss = Get-Content -Raw -LiteralPath $stagedCssPath
if ($stagedCss -notmatch 'alpha-logo-overlay-hd-v1\.png' -or
    $stagedCss -notmatch 'alpha-water-transition-background-v1\.png') {
    throw 'The staged banner CSS is invalid.'
}

$currentVersion = [int](Get-Content -Raw -LiteralPath $cacheVersionPath)
$nextVersion = $currentVersion + 1
[IO.File]::WriteAllText($stylesPath, "$($styles.TrimEnd())`r`n`r`n$($stagedCss.Trim())`r`n", [Text.UTF8Encoding]::new($false))

$manifest = @(Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json)
foreach ($item in $manifest) {
    $path = Join-Path $siteRoot $item.Output
    $html = [IO.File]::ReadAllText($path)
    $updated = [regex]::Replace($html, 'styles\.css\?v=\d+', "styles.css?v=$nextVersion")
    [IO.File]::WriteAllText($path, $updated, [Text.UTF8Encoding]::new($false))
}

$stagedCareersPath = Join-Path $siteRoot 'meeting-staged\careers-lab-tech\index.html'
$stagedCareers = [IO.File]::ReadAllText($stagedCareersPath)
$stagedCareers = [regex]::Replace($stagedCareers, 'styles\.css\?v=\d+', "styles.css?v=$nextVersion")
[IO.File]::WriteAllText($stagedCareersPath, $stagedCareers, [Text.UTF8Encoding]::new($false))

$testScript = [IO.File]::ReadAllText($testPath)
$testScript = [regex]::Replace($testScript, "styles\\\.css\\\?v=\d+", "styles\.css\?v=$nextVersion")
[IO.File]::WriteAllText($testPath, $testScript, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText($cacheVersionPath, "$nextVersion`r`n", [Text.UTF8Encoding]::new($false))

[pscustomobject]@{
    Status = 'READY_TO_PUBLISH'
    CacheVersion = $nextVersion
    RoutesUpdated = $manifest.Count
}
