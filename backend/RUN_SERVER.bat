@echo off
echo ============================================================
echo   Strategy Forge API Server
echo ============================================================
echo.
echo Starting server on http://localhost:8001
echo API endpoint: http://localhost:8001/api/strategies
echo.
echo Press CTRL+C to stop the server
echo ============================================================
echo.

cd /d "%~dp0"
python working_api.py

pause
