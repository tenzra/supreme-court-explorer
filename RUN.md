# How to Run Locally

## Prerequisites

Install these first (if not already installed):

| Tool | Install |
|------|---------|
| **Docker Desktop** | [Download](https://docs.docker.com/desktop/install/windows-install/) |
| **Python 3.11+** | `winget install Python.Python.3.11` |
| **Node.js 20+** | `winget install OpenJS.NodeJS.LTS` |
| **Ollama** | [Download](https://ollama.ai) |

After installing, **restart your terminal** (or Cursor) so PATH updates.

---

## Quick Run (PowerShell)

```powershell
cd D:\Cursor\supreme-court-explorer
.\run.ps1
```

Then open **http://localhost:3000** in your browser.

---

## Manual Steps

### 1. Start Postgres

```powershell
cd D:\Cursor\supreme-court-explorer
docker compose up -d
```

Wait ~5 seconds for Postgres to start.

### 2. Pull Ollama models

```powershell
ollama pull nomic-embed-text
ollama pull llama3
```

### 3. Backend setup and run

```powershell
cd D:\Cursor\supreme-court-explorer\backend
pip install -r requirements.txt
alembic upgrade head
python scripts/ingest_cases.py data/sample_cases.json
uvicorn app.main:app --reload --port 8000
```

Keep this terminal open. Backend runs at http://localhost:8000

### 4. Web app (new terminal)

```powershell
cd D:\Cursor\supreme-court-explorer\web
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Validation Queries

Try these searches:

- **"Right to privacy"** → Puttaswamy
- **"Basic structure doctrine"** → Kesavananda Bharati  
- **"Rarest of rare death penalty"** → Bachan Singh
