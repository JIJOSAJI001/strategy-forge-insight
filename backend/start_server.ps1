# Start the backend server
Set-Location -Path "d:\strategy-forge-insight\Backend"
Write-Host "Starting backend server on port 8001..."
Write-Host "Press Ctrl+C to stop the server"
python -m uvicorn working_api:app --host 127.0.0.1 --port 8001
