param(
    [ValidateSet('Auto', 'Owner', 'Yuri')][string]$Machine = 'Auto',
    [switch]$InstallDependencies,
    [switch]$InstallBrowser,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\Use-DevTools.ps1" -Machine $Machine
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    if ($InstallDependencies) {
        npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
    }
    if ($InstallBrowser) {
        npx.cmd --no-install playwright install chromium
        if ($LASTEXITCODE -ne 0) { throw 'Browser installation failed.' }
    }
    if (-not $SkipBuild) {
        npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Plugin build failed.' }
    }
    if (-not (Test-Path dist\module.js)) { throw 'Build the plugin before starting Grafana.' }
    docker compose config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Invalid Compose configuration.' }
    $container = docker compose ps -a -q grafana
    if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop and retry.' }
    if ($container) {
        # The older PC may still keep its database in the container writable layer.
        # Never let compose up replace that existing container during a normal deploy.
        $containerInfo = docker inspect $container | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect the existing Grafana container.' }
        if ($containerInfo[0].Config.Image -ne 'grafana/grafana-enterprise:13.2.2') {
            throw 'Existing Grafana uses a different image. Review and back up before changing it.'
        }
        docker restart $container | Out-Null
    } else {
        docker compose up -d --wait
    }
    if ($LASTEXITCODE -ne 0) { throw 'Grafana startup failed.' }
    $healthy = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        try {
            $health = Invoke-RestMethod http://127.0.0.1:3001/api/health -TimeoutSec 3
            if ($health.database -eq 'ok' -and $health.version -eq '13.2.2') { $healthy = $true; break }
        } catch { }
        Start-Sleep -Seconds 2
    }
    if (-not $healthy) { throw 'Grafana 13.2.2 did not become healthy; inspect docker compose logs.' }
    Write-Host 'Ready: http://localhost:3001/d/network-map-data-dev'
    Write-Host 'Keep the fixed fixture range: 2026-09-25 00:00-12:00 UTC.'
} finally {
    Pop-Location
}
