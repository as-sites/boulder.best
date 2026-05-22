$ErrorActionPreference = 'Continue'
if (-not $env:CLOUDFLARE_ZONE_ID) {
  throw 'CLOUDFLARE_ZONE_ID is required (zone overview for boulder.best)'
}
wrangler r2 bucket domain get boulder-dot-best --domain cdn.boulder.best 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Host 'Custom domain cdn.boulder.best already connected to boulder-dot-best'
} else {
  wrangler r2 bucket domain add boulder-dot-best --domain cdn.boulder.best --zone-id $env:CLOUDFLARE_ZONE_ID --force
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
