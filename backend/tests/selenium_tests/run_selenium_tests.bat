@echo off
cd /d D:\strategy-forge-insight\Backend\tests\selenium_tests
set TEST_BASE_URL=http://localhost:8081
python run_tests.py
pause
