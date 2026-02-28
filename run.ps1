# Supreme Court AI Case Explorer - Run Script
# Prerequisites: Docker, Python 3.11+, Node 20+, Ollama

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "Supreme Court AI Case Explorer - Starting..." -ForegroundColor Cyan

# Check prerequisites
$missing = @()
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { $missing += "Docker" }
if (-not (Get-Command python -ErrorAction SilentlyContinue) -and -not (Get-Command py -ErrorAction SilentlyContinue)) { $missing += "Python 3.11+" }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { $missing += "Node.js 20+" }
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) { $missing += "Ollama" }

if ($missing.Count -gt 0) {
    Write-Host "`nMissing prerequisites: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "`nInstall them first:" -ForegroundColor Yellow
    Write-Host "  - Docker: https://docs.docker.com/desktop/install/windows-install/"
    Write-Host "  - Python: winget install Python.Python.3.11"
    Write-Host "  - Node:   winget install OpenJS.NodeJS.LTS"
    Write-Host "  - Ollama: https://ollama.ai"
    exit 1
}

# 1. Start database
Write-Host "`n[1/5] Starting Postgres..." -ForegroundColor Green
Set-Location $ProjectRoot
if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker compose up -d 2>$null
    if (-not $?) { docker-compose up -d }
    Start-Sleep -Seconds 3
}

# 2. Run migrations
Write-Host "`n[2/5] Running migrations..." -ForegroundColor Green
Set-Location "$ProjectRoot\backend"
$py = if (Get-Command py -ErrorAction SilentlyContinue) { "py -3" } else { "python" }
& $py -m pip install -r requirements.txt -q
& $py -m alembic upgrade head

# 3. Ingest sample cases (if not already done)
Write-Host "`n[3/5] Ingesting sample cases..." -ForegroundColor Green
if (Test-Path "data\sample_cases.json") {
    & $py scripts/ingest_cases.py data/sample_cases.json
} else {
    Write-Host "  (Skipping - data/sample_cases.json not found)" -ForegroundColor Gray
}

# 4. Start backend
Write-Host "`n[4/5] Starting backend (FastAPI)..." -ForegroundColor Green
Start-Process -FilePath $py -ArgumentList "-m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -WorkingDirectory "$ProjectRoot\backend" -WindowStyle Normal

Start-Sleep -Seconds 3

# 5. Start web
Write-Host "`n[5/5] Starting web (Next.js)..." -ForegroundColor Green
Set-Location "$ProjectRoot\web"
npm install --silent 2>$null
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$ProjectRoot\web" -WindowStyle Normal

Write-Host "`nDone! Open http://localhost:3000 in your browser" -ForegroundColor Cyan
Write-Host "API: http://localhost:8000" -ForegroundColor Gray
