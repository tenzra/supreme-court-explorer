from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.config import settings
from app.db.base import Base

# Sync engine for migrations and scripts
sync_url = settings.database_url.replace("postgresql://", "postgresql+psycopg2://")
engine = create_engine(sync_url, echo=False)

# Async engine for FastAPI
async_url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")
async_engine = create_async_engine(async_url, echo=False)

async_session_maker = async_sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def init_db():
    """Create all tables. Called from migration or startup."""
    from app.models import Case, Topic, CaseTopic  # noqa: F401 - register models
    Base.metadata.create_all(bind=engine)
