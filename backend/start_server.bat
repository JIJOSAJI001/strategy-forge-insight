@echo off
cd /d "d:\strategy-forge-insight\Backend"
echo ============================================================
echo Starting Strategy Forge API Server on Port 8001
echo ============================================================
echo Press CTRL+C to stop the server
echo.
python -m uvicorn working_api:app --host 0.0.0.0 --port 8001
pause
