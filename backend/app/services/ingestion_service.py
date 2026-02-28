import json
import re
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Case, Topic, CaseTopic
from app.services.ollama_client import ollama_client


SUMMARY_SYSTEM = """You are an expert legal summarizer for Indian Supreme Court judgments.
Output ONLY valid JSON. No markdown, no code blocks, no extra text."""

SUMMARY_PROMPT = """Summarize this Indian Supreme Court case into the following JSON structure.
Output ONLY the JSON object, nothing else.

{
  "facts": "Brief factual background (2-4 sentences)",
  "legal_issues": "Key legal questions raised (2-4 sentences)",
  "judgment": "Court's decision and outcome (2-4 sentences)",
  "ratio_decidendi": "The legal principle/ratio of the decision (2-4 sentences)",
  "key_principles": ["Principle 1", "Principle 2", "Principle 3"]
}

Case name: {case_name}
Citation: {citation}
Year: {year}

Full text (excerpt):
{full_text_excerpt}
"""

TOPICS_PROMPT = """Given this Indian Supreme Court case summary, suggest 3-5 legal topic labels.
Output ONLY a JSON array of topic names as strings. No other text.
Example: ["Constitutional Law", "Right to Privacy", "Fundamental Rights"]

Case: {case_name}
Summary excerpt: {summary_excerpt}
"""


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _truncate(text: str, max_chars: int = 8000) -> str:
    if not text:
        return ""
    return text[:max_chars] + "..." if len(text) > max_chars else text


async def get_or_create_topic(session: AsyncSession, name: str, source_type: str = "ai_suggested") -> Topic:
    slug = slugify(name)
    result = await session.execute(select(Topic).where(Topic.slug == slug))
    topic = result.scalar_one_or_none()
    if not topic:
        topic = Topic(name=name, slug=slug)
        session.add(topic)
        await session.flush()
    return topic


async def process_case(session: AsyncSession, raw: dict) -> Case:
    """Process a single case: summarize, suggest topics, embed, store."""
    case_name = raw.get("case_name", "")
    citation = raw.get("citation", "")
    year = int(raw.get("year", 0))
    bench = raw.get("bench", "")
    full_text = raw.get("full_text", "")
    source_url = raw.get("source_url", "")

    full_text_excerpt = _truncate(full_text, 6000)

    summary_prompt = SUMMARY_PROMPT.format(
        case_name=case_name,
        citation=citation,
        year=year,
        full_text_excerpt=full_text_excerpt or "Not available",
    )
    summary_raw = await ollama_client.generate(summary_prompt, system=SUMMARY_SYSTEM)

    try:
        summary_json = json.loads(summary_raw)
    except json.JSONDecodeError:
        summary_json = _extract_json_from_response(summary_raw)

    facts = summary_json.get("facts", "")
    legal_issues = summary_json.get("legal_issues", "")
    judgment = summary_json.get("judgment", "")
    ratio_decidendi = summary_json.get("ratio_decidendi", "")
    key_principles = summary_json.get("key_principles", [])

    topics_prompt = TOPICS_PROMPT.format(
        case_name=case_name,
        summary_excerpt=_truncate(f"{facts} {legal_issues} {ratio_decidendi}", 1500),
    )
    topics_raw = await ollama_client.generate(topics_prompt, system=SUMMARY_SYSTEM)
    topic_names = _parse_topic_list(topics_raw)

    text_for_embedding = f"{facts} {legal_issues} {judgment} {ratio_decidendi} " + " ".join(
        key_principles if isinstance(key_principles, list) else []
    )
    embedding = await ollama_client.embed(text_for_embedding)

    result = await session.execute(select(Case).where(Case.citation == citation))
    case = result.scalar_one_or_none()
    if case:
        case.case_name = case_name
        case.year = year
        case.bench = bench
        case.full_text = full_text
        case.facts = facts
        case.legal_issues = legal_issues
        case.judgment = judgment
        case.ratio_decidendi = ratio_decidendi
        case.key_principles = key_principles
        case.embedding = embedding
        case.source_url = source_url
        case.processed_at = datetime.utcnow()
        case.updated_at = datetime.utcnow()
        await session.execute(
            CaseTopic.__table__.delete().where(CaseTopic.case_id == case.id)
        )
    else:
        case = Case(
            case_name=case_name,
            citation=citation,
            year=year,
            bench=bench,
            full_text=full_text,
            facts=facts,
            legal_issues=legal_issues,
            judgment=judgment,
            ratio_decidendi=ratio_decidendi,
            key_principles=key_principles,
            embedding=embedding,
            source_url=source_url,
            processed_at=datetime.utcnow(),
        )
        session.add(case)
        await session.flush()

    for name in topic_names:
        topic = await get_or_create_topic(session, name.strip())
        ct = CaseTopic(case_id=case.id, topic_id=topic.id, source_type="ai_suggested")
        session.add(ct)

    await session.flush()
    return case


def _extract_json_from_response(text: str) -> dict:
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return {}


def _parse_topic_list(text: str) -> list[str]:
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [str(t) for t in parsed]
        if isinstance(parsed, dict) and "topics" in parsed:
            return [str(t) for t in parsed["topics"]]
    except json.JSONDecodeError:
        pass
    start = text.find("[")
    end = text.rfind("]") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return []
