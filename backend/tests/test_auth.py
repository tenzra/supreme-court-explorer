from unittest.mock import patch, AsyncMock
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.db.session import get_db


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def authed_client(mock_db):
    async def _override():
        yield mock_db
    app.dependency_overrides[get_db] = _override
    transport = ASGITransport(app=app)
    c = AsyncClient(transport=transport, base_url="http://test")
    yield c
    app.dependency_overrides.clear()


class TestAuthDisabled:
    """When API_KEY is empty, all routes are accessible."""

    @patch("app.middleware.auth.settings")
    async def test_no_key_required(self, mock_settings, authed_client):
        mock_settings.api_key = ""
        resp = await authed_client.get("/health")
        assert resp.status_code == 200


class TestAuthEnabled:
    """When API_KEY is set, routes require a valid key."""

    @patch("app.middleware.auth.settings")
    @patch("app.api.routes.search_cases", new_callable=AsyncMock)
    async def test_missing_key_returns_401(self, mock_search, mock_settings, authed_client):
        mock_settings.api_key = "secret123"
        resp = await authed_client.get("/api/search")
        assert resp.status_code == 401

    @patch("app.middleware.auth.settings")
    @patch("app.api.routes.search_cases", new_callable=AsyncMock)
    async def test_wrong_key_returns_401(self, mock_search, mock_settings, authed_client):
        mock_settings.api_key = "secret123"
        resp = await authed_client.get("/api/search", headers={"X-API-Key": "wrong"})
        assert resp.status_code == 401

    @patch("app.middleware.auth.settings")
    @patch("app.api.routes.search_cases", new_callable=AsyncMock)
    async def test_valid_header_key(self, mock_search, mock_settings, authed_client):
        mock_settings.api_key = "secret123"
        mock_search.return_value = []
        resp = await authed_client.get("/api/search", headers={"X-API-Key": "secret123"})
        assert resp.status_code == 200

    @patch("app.middleware.auth.settings")
    @patch("app.api.routes.search_cases", new_callable=AsyncMock)
    async def test_valid_query_key(self, mock_search, mock_settings, authed_client):
        mock_settings.api_key = "secret123"
        mock_search.return_value = []
        resp = await authed_client.get("/api/search?api_key=secret123")
        assert resp.status_code == 200

    @patch("app.middleware.auth.settings")
    async def test_health_is_public(self, mock_settings, authed_client):
        mock_settings.api_key = "secret123"
        resp = await authed_client.get("/health")
        assert resp.status_code == 200
