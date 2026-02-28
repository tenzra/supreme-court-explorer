from sqlalchemy import select, exists
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Case, CaseTopic
from app.services.ollama_client import ollama_client


async def search_cases(
    session: AsyncSession,
    q: str | None = None,
    topic_ids: list[int] | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[tuple[Case, float | None]]:
    if q and q.strip():
        embedding = await ollama_client.embed(q.strip())
        sim_expr = (1 - Case.embedding.cosine_distance(embedding)).label("sim")
        stmt = (
            select(Case, sim_expr)
            .where(Case.embedding.isnot(None))
            .order_by(Case.embedding.cosine_distance(embedding))
        )
    else:
        stmt = select(Case).order_by(Case.year.desc())

    if topic_ids:
        stmt = stmt.where(
            exists(
                select(CaseTopic.id)
                .where(CaseTopic.case_id == Case.id)
                .where(CaseTopic.topic_id.in_(topic_ids))
            )
        )
    if year_from is not None:
        stmt = stmt.where(Case.year >= year_from)
    if year_to is not None:
        stmt = stmt.where(Case.year <= year_to)

    stmt = stmt.limit(limit).offset(offset)
    result = await session.execute(stmt)
    rows = result.all()

    if rows and len(rows[0]) == 2:
        return [(r[0], float(r[1]) if r[1] is not None else None) for r in rows]
    return [(r[0] if isinstance(r, tuple) else r, None) for r in rows]


async def get_similar_cases(
    session: AsyncSession, case_id: int, limit: int = 5
) -> list[tuple[Case, float]]:
    r = await session.execute(
        select(Case).where(Case.id == case_id).where(Case.embedding.isnot(None))
    )
    case = r.scalar_one_or_none()
    if not case or not case.embedding:
        return []

    embedding = list(case.embedding)
    sim_expr = (1 - Case.embedding.cosine_distance(embedding)).label("sim")
    stmt = (
        select(Case, sim_expr)
        .where(Case.id != case_id)
        .where(Case.embedding.isnot(None))
        .order_by(Case.embedding.cosine_distance(embedding))
        .limit(limit)
    )
    result = await session.execute(stmt)
    return [(row[0], float(row[1])) for row in result.all()]
