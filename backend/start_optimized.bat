@echo off
cd /d "d:\strategy-forge-insight\Backend"
echo ============================================================
echo Starting Optimized Strategy Forge API Server on Port 8001
echo ============================================================
echo.
echo Initializing MongoDB connection and indexes...
echo Redis cache: Will attempt connection (fallback mode if unavailable)
echo.
python -c "import uvicorn; uvicorn.run('main:app', host='0.0.0.0', port=8001, reload=False)"
pause
