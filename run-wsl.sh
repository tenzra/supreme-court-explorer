#!/bin/bash
# Supreme Court AI Case Explorer - Run in WSL Ubuntu
# Run from WSL: bash run-wsl.sh

set -e
cd ~/supreme-court-explorer

echo "=== Supreme Court AI Case Explorer ==="

# Check/install prerequisites
install_if_missing() {
    if ! command -v "$1" &>/dev/null; then
        echo "Installing $1..."
        sudo apt-get update -qq
        case "$1" in
            docker) sudo apt-get install -y docker.io docker-compose-v2 ;;
            node)   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs ;;
            *)      sudo apt-get install -y "$1" ;;
        esac
    fi
}

# Check Python
if ! command -v python3 &>/dev/null; then
    echo "Python3 required. Install: sudo apt install python3 python3-pip python3-venv"
    exit 1
fi

# Check Docker (Docker Desktop on Windows may expose docker to WSL)
if ! command -v docker &>/dev/null; then
    echo "Docker not found. Options:"
    echo "  1. Install Docker Desktop for Windows (uses WSL2) - recommended"
    echo "  2. Or in WSL: sudo apt install docker.io docker-compose-v2"
    echo "     Then: sudo usermod -aG docker \$USER (logout/login after)"
    read -p "Continue without Docker? Postgres must be running. [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi
fi

# Check Node
if ! command -v node &>/dev/null; then
    echo "Node.js not found. Install:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

# 1. Start Postgres
echo ""
echo "[1/5] Starting Postgres..."
if command -v docker &>/dev/null; then
    docker compose up -d 2>/dev/null || docker-compose up -d
    sleep 5
else
    echo "  (Skipping - start Postgres manually)"
fi

# 2. Python venv and deps
echo ""
echo "[2/5] Setting up backend..."
cd backend
python3 -m venv .venv 2>/dev/null || true
source .venv/bin/activate 2>/dev/null || true
pip install -q -r requirements.txt
alembic upgrade head

# 3. Ingest
echo ""
echo "[3/5] Ingesting sample cases..."
if [ -f data/sample_cases.json ]; then
    python scripts/ingest_cases.py data/sample_cases.json
else
    echo "  (Skipping - data/sample_cases.json not found)"
fi

# 4. Start backend in background
echo ""
echo "[4/5] Starting backend..."
cd ~/supreme-court-explorer/backend
source .venv/bin/activate 2>/dev/null || true
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
sleep 3

# 5. Start web
echo ""
echo "[5/5] Starting web..."
cd ~/supreme-court-explorer/web
npm install --silent 2>/dev/null
npm run dev &
WEB_PID=$!
sleep 5

echo ""
echo "=== Ready ==="
echo "  Web:   http://localhost:3000"
echo "  API:   http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop. Backend log: /tmp/backend.log"

wait $WEB_PID 2>/dev/null || wait
