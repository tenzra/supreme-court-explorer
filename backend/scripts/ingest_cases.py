#!/usr/bin/env python3
"""
Ingest Supreme Court cases from a JSON file.
Usage: python scripts/ingest_cases.py path/to/cases.json

JSON format per case:
{
  "case_name": "...",
  "citation": "...",
  "year": 2020,
  "bench": "...",
  "full_text": "...",
  "source_url": "..."
}
"""
import asyncio
import json
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.config import settings
from app.services.ingestion_service import process_case


async def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/ingest_cases.py <path/to/cases.json>")
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File not found: {path}")
        sys.exit(1)

    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    cases = data if isinstance(data, list) else [data]

    db_url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(db_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print(f"Ingesting {len(cases)} cases...")
    async with async_session() as session:
        for i, raw in enumerate(cases):
            try:
                case = await process_case(session, raw)
                await session.commit()
                print(f"  [{i+1}/{len(cases)}] {case.case_name} ({case.citation})")
            except Exception as e:
                await session.rollback()
                print(f"  [{i+1}/{len(cases)}] ERROR: {raw.get('case_name', '?')} - {e}")

    await engine.dispose()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
