from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from pgvector.sqlalchemy import Vector

from app.db.base import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_name = Column(String(500), nullable=False)
    citation = Column(String(200), nullable=False, unique=True)
    year = Column(Integer, nullable=False)
    bench = Column(String(200), nullable=True)
    full_text = Column(Text, nullable=True)
    facts = Column(Text, nullable=True)
    legal_issues = Column(Text, nullable=True)
    judgment = Column(Text, nullable=True)
    ratio_decidendi = Column(Text, nullable=True)
    key_principles = Column(JSONB, nullable=True)  # array of strings
    embedding = Column(Vector(768), nullable=True)
    source_url = Column(String(1000), nullable=True)
    processed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CaseTopic(Base):
    __tablename__ = "case_topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    source_type = Column(String(20), nullable=False, default="ai_suggested")  # manual | ai_suggested

    __table_args__ = (UniqueConstraint("case_id", "topic_id", name="uq_case_topic"),)
