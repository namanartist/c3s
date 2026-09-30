@echo off
echo ==========================================================
echo    UniMap ^<--^> Crowd Monitoring Service Launcher
echo ==========================================================
set CROWD_DIR=C:\Users\naman\Crowd_monitoring
set PYTHON_EXE=%CROWD_DIR%\.venv\Scripts\python.exe

if not exist "%PYTHON_EXE%" (
    set PYTHON_EXE=python
)

echo Starting Detection Engine on port 8001...
start "Crowd Detection Engine :8001" /D "%CROWD_DIR%" "%PYTHON_EXE%" detection.py

echo Starting Crowd FastAPI on port 8000...
start "Crowd FastAPI Server :8000" /D "%CROWD_DIR%" "%PYTHON_EXE%" -m uvicorn api_server:app --host 0.0.0.0 --port 8000

echo.
echo [SUCCESS] Crowd Monitoring surveillance feeds active!
echo - Video Stream: http://localhost:8001/video_feed/Main%%20Gate
echo - AI Estimation: http://localhost:8000/docs
echo ==========================================================
