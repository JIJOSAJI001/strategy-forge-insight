# Selenium Test Suite - Quick Start Script
# Run this script to install dependencies and execute tests

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "SELENIUM TEST SUITE - STRATEGY FORGE INSIGHT" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if Chrome is installed
Write-Host "Checking Chrome installation..." -ForegroundColor Yellow
$chromeRegistryPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"
)

$chromeFound = $false
foreach ($path in $chromeRegistryPaths) {
    if (Test-Path $path) {
        $chromeFound = $true
        break
    }
}

if ($chromeFound) {
    Write-Host "✓ Chrome browser found" -ForegroundColor Green
} else {
    Write-Host "⚠ Chrome browser not found. Please install Google Chrome." -ForegroundColor Yellow
    Write-Host "  Download from: https://www.google.com/chrome/" -ForegroundColor Yellow
}

Write-Host ""

# Install dependencies
Write-Host "Installing test dependencies..." -ForegroundColor Yellow
Write-Host ""

try {
    pip install -r requirements_selenium.txt
    Write-Host ""
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    Write-Host "  Please run manually: pip install -r requirements_selenium.txt" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan

# Prompt user to confirm application is running
Write-Host ""
Write-Host "IMPORTANT: Before running tests, ensure:" -ForegroundColor Yellow
Write-Host "  1. Backend is running on http://localhost:8000" -ForegroundColor Yellow
Write-Host "  2. Frontend is running on http://localhost:5173" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Are both frontend and backend running? (y/n)"

if ($response -ne "y" -and $response -ne "Y") {
    Write-Host ""
    Write-Host "Please start the application first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Terminal 1 - Backend:" -ForegroundColor Cyan
    Write-Host "  cd Backend" -ForegroundColor White
    Write-Host "  python main.py" -ForegroundColor White
    Write-Host ""
    Write-Host "Terminal 2 - Frontend:" -ForegroundColor Cyan
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "STARTING TEST EXECUTION" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Run tests
try {
    python run_tests.py
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor Cyan
    
    if ($exitCode -eq 0) {
        Write-Host "✓ ALL TESTS COMPLETED SUCCESSFULLY" -ForegroundColor Green
    } else {
        Write-Host "⚠ TESTS COMPLETED WITH SOME FAILURES" -ForegroundColor Yellow
    }
    
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Test reports available in:" -ForegroundColor Cyan
    Write-Host "  - reports/" -ForegroundColor White
    Write-Host "  - screenshots/" -ForegroundColor White
    Write-Host "  - logs/" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "✗ Test execution failed" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}
