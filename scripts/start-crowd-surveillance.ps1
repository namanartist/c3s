# scripts/start-crowd-surveillance.ps1
# Helper script to launch Crowd Monitoring services from C:\Users\naman\Crowd_monitoring

$CrowdDir = "C:\Users\naman\Crowd_monitoring"
$PythonExe = Join-Path $CrowdDir ".venv\Scripts\python.exe"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   UniMap <-> Crowd Monitoring Service Launcher           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target Path: $CrowdDir" -ForegroundColor Yellow

if (-not (Test-Path $CrowdDir)) {
    Write-Host "[ERROR] Crowd_monitoring directory not found at $CrowdDir" -ForegroundColor Red
    Exit 1
}

if (-not (Test-Path $PythonExe)) {
    Write-Host "[WARN] .venv python not found at $PythonExe. Falling back to system python." -ForegroundColor Yellow
    $PythonExe = "python"
}

Write-Host "[INFO] Starting Crowd Monitoring Video Engine on Port 8001..." -ForegroundColor Green
Start-Process -FilePath $PythonExe -ArgumentList "detection.py" -WorkingDirectory $CrowdDir

Write-Host "[INFO] Starting Crowd Monitoring FastAPI Server on Port 8000..." -ForegroundColor Green
Start-Process -FilePath $PythonExe -ArgumentList "-m uvicorn api_server:app --host 0.0.0.0 --port 8000" -WorkingDirectory $CrowdDir

Write-Host ""
Write-Host "[SUCCESS] Crowd Monitoring Services Launched!" -ForegroundColor Green
Write-Host " - Video Feed Service: http://localhost:8001/video_feed/<CameraName>" -ForegroundColor Cyan
Write-Host " - AI Estimate API:    http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host " - UniMap Dashboard:   http://localhost:5173/control-room/cameras" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
