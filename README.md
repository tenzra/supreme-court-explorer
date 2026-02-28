# Supreme Court AI Case Explorer

A local-first AI-assisted legal case explorer for Indian Supreme Court landmark cases.

## Prerequisites

- Docker
- Ollama
- Python 3.11+
- Node 20+

## Quick Start

### 1. Start the database

```bash
docker-compose up -d
```

### 2. Pull Ollama models

```bash
ollama pull nomic-embed-text
ollama pull llama3
```

### 3. Run migrations

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
```

### 4. Ingest sample cases (optional)

```bash
cd backend
python scripts/ingest_cases.py data/sample_cases.json
```

### 5. Start the backend

```bash
uvicorn app.main:app --reload
```

### 6. Start the web app

```bash
cd web
npm install
npm run dev
```

### 7. Start the mobile app (optional)

```bash
cd mobile
npm install
npx expo start
```

## Project Structure

```
supreme-court-explorer/
├── backend/     # FastAPI + Postgres + pgvector
├── web/         # Next.js 14
├── mobile/      # Expo React Native
└── docker-compose.yml
```

## API

- `GET /search?q=...&topic_ids=...&year_from=...&year_to=...` - Semantic search
- `GET /cases` - Browse cases (with filters)
- `GET /cases/{id}` - Case detail
- `GET /cases/{id}/similar?limit=5` - Similar cases
- `GET /topics` - List topics

## Disclaimer

AI-generated summaries. Verify with official judgment.
