$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot 'backend'
$frontendRoot = Join-Path $projectRoot 'frontend'
Set-Location $projectRoot

$venvPython = Join-Path $projectRoot '.venv\Scripts\python.exe'
$requirements = Join-Path $backendRoot 'requirements.txt'

Write-Host 'Preparing Pet Search Service...' -ForegroundColor Cyan

if (-not (Test-Path $venvPython)) {
    $launcher = Get-Command py -ErrorAction SilentlyContinue
    if (-not $launcher) {
        Write-Host 'Python is not installed. Install Python and enable Add to PATH.' -ForegroundColor Red
        exit 1
    }

    Write-Host '[1/5] Creating virtual environment...'
    & py -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
else {
    Write-Host '[1/5] Virtual environment already exists.'
}

Write-Host '[2/5] Installing backend dependencies...'
& $venvPython -m pip install -r $requirements
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host '[3/5] Preparing local database...'
Set-Location $backendRoot
& $venvPython manage.py migrate --noinput
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host '[4/5] Adding reference data and administrator...'
& $venvPython manage.py seed_data
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
Set-Location $projectRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js is not installed or is not available in PATH.' -ForegroundColor Red
    exit 1
}

Write-Host '[5/5] Installing frontend dependencies...'
& npm.cmd install --prefix $frontendRoot
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Setup complete.' -ForegroundColor Green
Write-Host 'Administrator login: admin'
Write-Host 'Administrator password: AdminPass123!'
Write-Host 'Run start.cmd to start the server.'
