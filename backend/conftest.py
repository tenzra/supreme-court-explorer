from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.db.session import get_db
from app.models import Case, Topic


def _make_case(**overrides) -> MagicMock:
    defaults = dict(
        id=1,
        case_name="Test Case v. State",
        citation="AIR 2020 SC 100",
        year=2020,
        bench="5 Judge Bench",
        full_text="Full text of the case.",
        facts="The petitioner challenged the order.",
        legal_issues="Whether the right was violated.",
        judgment="The Court upheld the petition.",
        ratio_decidendi="Right to equality is fundamental.",
        key_principles=["Equality", "Due Process"],
        embedding=[0.1] * 768,
        source_url="https://example.com/case/1",
        processed_at=None,
        created_at=None,
        updated_at=None,
    )
    defaults.update(overrides)
    m = MagicMock(spec=Case)
    for k, v in defaults.items():
        setattr(m, k, v)
    return m


def _make_topic(**overrides) -> MagicMock:
    defaults = dict(id=1, name="Constitutional Law", slug="constitutional-law")
    defaults.update(overrides)
    m = MagicMock(spec=Topic)
    for k, v in defaults.items():
        setattr(m, k, v)
    return m


@pytest.fixture
def sample_case():
    return _make_case()


@pytest.fixture
def sample_topic():
    return _make_topic()


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def client(mock_db):
    """AsyncClient with the DB dependency overridden to a mock."""

    async def _override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    c = AsyncClient(transport=transport, base_url="http://test")
    yield c
    app.dependency_overrides.clear()
