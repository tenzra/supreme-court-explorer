import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def health_client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


async def test_health_returns_ok(health_client):
    resp = await health_client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
