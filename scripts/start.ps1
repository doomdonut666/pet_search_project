$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot 'backend'
$frontendRoot = Join-Path $projectRoot 'frontend'
$venvPython = Join-Path $projectRoot '.venv\Scripts\python.exe'
$frontendModules = Join-Path $frontendRoot 'node_modules'

Set-Location $projectRoot

if (-not (Test-Path $venvPython) -or -not (Test-Path $frontendModules)) {
    & (Join-Path $PSScriptRoot 'setup.ps1')
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

$oldProjectProcesses = Get-CimInstance Win32_Process | Where-Object {
    (
        $_.Name -eq 'python.exe' -and
        $_.CommandLine -like "*$venvPython*manage.py runserver*"
    ) -or (
        $_.Name -eq 'node.exe' -and
        $_.CommandLine -like "*$frontendRoot*node_modules*vite*"
    )
}

foreach ($process in $oldProjectProcesses) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}

if ($oldProjectProcesses) {
    Start-Sleep -Seconds 1
}

$backend = $null

try {
    Write-Host 'Starting Django backend...' -ForegroundColor Cyan
    $backend = Start-Process `
        -FilePath $venvPython `
        -ArgumentList @('manage.py', 'runserver', '127.0.0.1:8000', '--noreload') `
        -WorkingDirectory $backendRoot `
        -WindowStyle Hidden `
        -PassThru

    Start-Sleep -Seconds 2
    if ($backend.HasExited) {
        throw 'Django backend stopped during startup.'
    }

    Write-Host ''
    Write-Host 'GETPETBACK is running:' -ForegroundColor Green
    Write-Host 'Website: http://127.0.0.1:5173'
    Write-Host 'API:     http://127.0.0.1:8000/api/pets'
    Write-Host ''
    Write-Host 'Press Ctrl+C to stop both servers.'
    Write-Host ''

    Set-Location $frontendRoot
    & npm.cmd run dev -- --host 127.0.0.1
}
finally {
    if ($backend -and -not $backend.HasExited) {
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    }
}
