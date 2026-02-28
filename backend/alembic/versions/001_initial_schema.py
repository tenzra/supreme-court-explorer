"""Initial schema with cases, topics, case_topics, pgvector, HNSW index

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "topics",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(200), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )

    op.create_table(
        "cases",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("case_name", sa.String(500), nullable=False),
        sa.Column("citation", sa.String(200), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("bench", sa.String(200), nullable=True),
        sa.Column("full_text", sa.Text(), nullable=True),
        sa.Column("facts", sa.Text(), nullable=True),
        sa.Column("legal_issues", sa.Text(), nullable=True),
        sa.Column("judgment", sa.Text(), nullable=True),
        sa.Column("ratio_decidendi", sa.Text(), nullable=True),
        sa.Column("key_principles", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("embedding", Vector(768), nullable=True),
        sa.Column("source_url", sa.String(1000), nullable=True),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("citation"),
    )

    op.create_table(
        "case_topics",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=False),
        sa.Column("topic_id", sa.Integer(), nullable=False),
        sa.Column("source_type", sa.String(20), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("case_id", "topic_id", name="uq_case_topic"),
    )

    op.execute(
        "CREATE INDEX idx_cases_embedding_hnsw ON cases "
        "USING hnsw (embedding vector_cosine_ops)"
    )
    op.create_index("ix_cases_year", "cases", ["year"])
    op.create_index("ix_cases_citation", "cases", ["citation"])
    op.create_index("ix_case_topics_case_id", "case_topics", ["case_id"])
    op.create_index("ix_case_topics_topic_id", "case_topics", ["topic_id"])


def downgrade() -> None:
    op.drop_index("ix_case_topics_topic_id", "case_topics")
    op.drop_index("ix_case_topics_case_id", "case_topics")
    op.drop_index("ix_cases_citation", "cases")
    op.drop_index("ix_cases_year", "cases")
    op.execute("DROP INDEX IF EXISTS idx_cases_embedding_hnsw")
    op.drop_table("case_topics")
    op.drop_table("cases")
    op.drop_table("topics")
