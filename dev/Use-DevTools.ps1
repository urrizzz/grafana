param([ValidateSet('Auto', 'Owner', 'Yuri')][string]$Machine = 'Auto')

$repoPath = Split-Path -Parent $PSScriptRoot
if ($Machine -eq 'Auto') {
    if ($repoPath -like 'C:\Codex\*') { $Machine = 'Yuri' }
    elseif ($repoPath -like 'C:\code\*') { $Machine = 'Owner' }
    else { throw 'Choose -Machine Owner or -Machine Yuri for this checkout.' }
}
if ($Machine -eq 'Yuri') {
    if ((whoami) -ne 'desktop-f40gd5i\yuri') {
        throw 'The Yuri profile requires DESKTOP-F40GD5I\Yuri for EFS access.'
    }
    $toolDirs = @('C:\Codex\tools\node', 'C:\Codex\tools\git\cmd', 'C:\Codex\.venv\Scripts',
        'C:\Program Files\Docker\Docker\resources\bin')
    $env:PLAYWRIGHT_BROWSERS_PATH = 'C:\Codex\tools\playwright'
} else {
    $toolDirs = @('C:\code\.tools\grafana\node-v24.21.0-win-x64',
        (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin'))
    $env:PLAYWRIGHT_BROWSERS_PATH = 'C:\code\.tools\playwright'
}
$env:PATH = (($toolDirs | Where-Object { Test-Path -LiteralPath $_ }) -join ';') + ';' + $env:PATH
foreach ($command in @('node', 'npm.cmd', 'python', 'git', 'docker')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { throw "Missing prerequisite: $command. See docs/development-pcs.md." }
}
if ((node --version) -notmatch '^v24\.') { throw 'Node 24 is required. See docs/development-pcs.md.' }
Write-Host "Using $Machine development tools for $repoPath"
