# Copy premium-ui-export into another Next.js project
# Usage: .\copy-to-project.ps1 -Target "C:\path\to\other-project"

param(
  [Parameter(Mandatory = $true)]
  [string]$Target
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $here "src"
$dest = Join-Path $Target "src"

if (-not (Test-Path $Target)) {
  Write-Error "Target project not found: $Target"
}

Write-Host "Copying premium UI from:"
Write-Host "  $src"
Write-Host "to:"
Write-Host "  $dest"
Write-Host ""

Copy-Item -Path (Join-Path $src "*") -Destination $dest -Recurse -Force

Write-Host "Done. Next steps:"
Write-Host "  1. npm i (see package-deps.json in export folder)"
Write-Host "  2. Merge layout.example.tsx into src/app/layout.tsx"
Write-Host "  3. Copy demos/*.tsx into src/app/design/ as page.tsx files"
Write-Host "  4. See README.md for full integration guide"
