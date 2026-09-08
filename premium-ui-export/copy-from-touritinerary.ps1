# Copy premium UI kit into another local Next.js project
# Usage: .\copy-from-touritinerary.ps1 -Target "C:\GitHub\your-other-app"

param(
  [Parameter(Mandatory = $true)]
  [string]$Target
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcRoot = Join-Path $here "src"
$demos = Join-Path $here "demos"
$destSrc = Join-Path $Target "src"

if (-not (Test-Path $Target)) {
  Write-Error "Target project not found: $Target"
}

Write-Host "Copying premium UI kit to: $Target"
Write-Host ""

# Core kit (components, lib, app CSS example, etc.)
Copy-Item -Path (Join-Path $srcRoot "*") -Destination $destSrc -Recurse -Force

# Design preview routes
$routes = @{
  "design-sidebar-page.tsx"  = "app\design\sidebar\page.tsx"
  "prompt-page.tsx"          = "app\design\prompt\page.tsx"
  "chat-bubble-page.tsx"     = "app\design\chat-bubble\page.tsx"
  "dot-pattern-page.tsx"     = "app\design\dot-pattern\page.tsx"
  "user-dropdown-page.tsx"   = "app\design\user-dropdown\page.tsx"
  "footer-page.tsx"          = "app\design\footer\page.tsx"
}

foreach ($demo in $routes.Keys) {
  $from = Join-Path $demos $demo
  $to = Join-Path $destSrc $routes[$demo]
  $dir = Split-Path $to -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  Copy-Item -Path $from -Destination $to -Force
  Write-Host "  demo -> $($routes[$demo])"
}

Write-Host ""
Write-Host "Done. Next in the target project:"
Write-Host "  1. npm i (see package-deps.json)"
Write-Host "  2. Merge globals.css + layout.example.tsx"
Write-Host "  3. npm run build"
Write-Host "  4. Open /design/prompt for AI chat first page"
