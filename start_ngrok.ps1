# start_ngrok.ps1
# ─────────────────────────────────────────────────────────────────────────────
# Starts ngrok tunnels for Strategy Forge Insight
# Frontend: localhost:8080  →  public HTTPS URL
# Backend:  localhost:8000  →  public HTTPS URL
#
# Usage: .\start_ngrok.ps1
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# ── Check if Python is available ─────────────────────────────────────────────
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python not found in PATH. Please install Python 3.11+."
    exit 1
}

# ── Check if ngrok is installed ───────────────────────────────────────────────
$ngrokBin = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokBin) {
    Write-Host ""
    Write-Host "  ngrok not found in PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Install it from the Microsoft Store (no admin required):" -ForegroundColor Cyan
    Write-Host "  https://apps.microsoft.com/store/detail/ngrok/9mvs1j51gmk6" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  After installing, re-run this script." -ForegroundColor Green
    Write-Host ""

    # Try to open the store link automatically
    try { Start-Process "ms-windows-store://pdp/?ProductId=9mvs1j51gmk6" } catch {}
    exit 1
}

Write-Host ""
Write-Host "  ngrok found: $($ngrokBin.Source)" -ForegroundColor Green
Write-Host ""

# ── Configure authtoken ───────────────────────────────────────────────────────
$AUTHTOKEN = "3Bh60fGHrlqVOzdg5gbZUrdTZdH_81u1bsCNGAJo9Gg5gKfuv"
& ngrok config add-authtoken $AUTHTOKEN | Out-Null

# ── Run the tunnel script ─────────────────────────────────────────────────────
Set-Location $scriptDir
python ngrok_tunnel.py
