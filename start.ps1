# Förbereder jobbsök-repot och stannar. Det finns ingen server att hålla igång.
# Själva sökningen och ansökan görs i agentchatten: /scrape och /apply.
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Test-Tool([string]$Name) {
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-Python {
    $arguments = @($args)
    if (Test-Tool "py") {
        & py -3 @arguments
    } elseif (Test-Tool "python") {
        & python @arguments
    } elseif (Test-Tool "python3") {
        & python3 @arguments
    } else {
        $global:LASTEXITCODE = 127
    }
}

Write-Host "AI Job Search"
Write-Host "Mapp: $PSScriptRoot"
Write-Host ""

if (-not (Test-Tool "py") -and -not (Test-Tool "python") -and -not (Test-Tool "python3")) {
    Write-Host "Python 3.10 eller nyare saknas. Installera Python och kör skriptet igen."
    exit 1
}

Invoke-Python --version
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (Test-Tool "bun") {
    Write-Host ""
    Write-Host "Installerar portal-CLI:er..."
    Invoke-Python "tools/install_portal_clis.py"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "Bun saknas, så portal-CLI:erna installeras inte. Övriga arbetsflöden fungerar ändå."
}

if (-not (Test-Path "profile.local.md")) {
    Copy-Item "profile.local.example.md" "profile.local.md"
    Write-Host "Skapade profile.local.md. Fyll i namn, telefon och e-post där. Personnummer ska inte stå i filen."
}

Write-Host ""
foreach ($tool in @("lualatex", "xelatex")) {
    if (Test-Tool $tool) {
        Write-Host "$tool finns."
    } else {
        Write-Host "$tool saknas. CV och personligt brev kan inte kompileras förrän LaTeX är installerat."
    }
}

Write-Host ""
Write-Host "Klart. Inget program hålls igång."
Write-Host "I agentchatten, i den här mappen:"
Write-Host "  /scrape    sök jobb"
Write-Host "  /apply     bedöm en annons och skriv CV och brev"
exit 0
