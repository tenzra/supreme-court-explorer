from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings
from app.db.session import get_db
from app.models import Case, Topic
from app.schemas import CaseResponse, CaseDetailResponse, CaseSearchResult, TopicResponse
from app.services.search_service import search_cases, get_similar_cases
from app.middleware.auth import require_api_key

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(dependencies=[Depends(require_api_key)])


def _snippet(case: Case, max_len: int = 150) -> str | None:
    for field in [case.ratio_decidendi, case.facts, case.judgment]:
        if field and len(field) > 0:
            return field[:max_len] + "..." if len(field) > max_len else field
    return None


@router.get("/search", response_model=list[CaseSearchResult])
@limiter.limit(settings.rate_limit_search)
async def search(
    request: Request,
    q: str | None = Query(None, description="Search query for semantic search"),
    topic_ids: str | None = Query(None, description="Comma-separated topic IDs"),
    year_from: int | None = Query(None),
    year_to: int | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    topic_id_list = None
    if topic_ids:
        topic_id_list = [int(x.strip()) for x in topic_ids.split(",") if x.strip()]
    results = await search_cases(
        db, q=q, topic_ids=topic_id_list, year_from=year_from, year_to=year_to, limit=limit, offset=offset
    )
    return [
        CaseSearchResult(
            case=CaseResponse(
                id=c.id,
                case_name=c.case_name,
                citation=c.citation,
                year=c.year,
                bench=c.bench,
                snippet=_snippet(c),
                similarity=sim,
            ),
            similarity=sim,
        )
        for c, sim in results
    ]


@router.get("/cases", response_model=list[CaseResponse])
@limiter.limit(settings.rate_limit_default)
async def list_cases(
    request: Request,
    topic_ids: str | None = Query(None),
    year_from: int | None = Query(None),
    year_to: int | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Browse cases with filters (no semantic search)."""
    topic_id_list = [int(x.strip()) for x in topic_ids.split(",")] if topic_ids else None
    results = await search_cases(
        db, q=None, topic_ids=topic_id_list, year_from=year_from, year_to=year_to, limit=limit, offset=offset
    )
    return [
        CaseResponse(
            id=c.id,
            case_name=c.case_name,
            citation=c.citation,
            year=c.year,
            bench=c.bench,
            snippet=_snippet(c),
        )
        for c, _ in results
    ]


@router.get("/cases/{case_id}", response_model=CaseDetailResponse)
@limiter.limit(settings.rate_limit_default)
async def get_case(request: Request, case_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Case).where(Case.id == case_id))
    case = r.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return CaseDetailResponse(
        id=case.id,
        case_name=case.case_name,
        citation=case.citation,
        year=case.year,
        bench=case.bench,
        facts=case.facts,
        legal_issues=case.legal_issues,
        judgment=case.judgment,
        ratio_decidendi=case.ratio_decidendi,
        key_principles=case.key_principles or [],
        source_url=case.source_url,
    )


@router.get("/cases/{case_id}/similar", response_model=list[CaseSearchResult])
@limiter.limit(settings.rate_limit_search)
async def similar_cases(
    request: Request,
    case_id: int,
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    results = await get_similar_cases(db, case_id=case_id, limit=limit)
    return [
        CaseSearchResult(
            case=CaseResponse(
                id=c.id,
                case_name=c.case_name,
                citation=c.citation,
                year=c.year,
                bench=c.bench,
                snippet=_snippet(c),
                similarity=sim,
            ),
            similarity=sim,
        )
        for c, sim in results
    ]


@router.get("/topics", response_model=list[TopicResponse])
@limiter.limit(settings.rate_limit_default)
async def list_topics(request: Request, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Topic).order_by(Topic.name))
    return [TopicResponse.model_validate(t) for t in r.scalars().all()]
