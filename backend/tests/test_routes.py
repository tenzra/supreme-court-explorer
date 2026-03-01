from unittest.mock import AsyncMock, MagicMock, patch
import pytest


def _scalars_all(items):
    """Helper to make a mock result whose .scalars().all() returns items."""
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = items
    return mock_result


def _scalar_one_or_none(item):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = item
    return mock_result


class TestSearchEndpoint:
    @patch("app.api.routes.search_cases", new_callable=AsyncMock)
    async def test_search_no_query(self, mock_search, client, sample_case, mock_db):
        mock_search.return_value = [(sample_case, None)]
        resp = await client.get("/api/search")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["case"]["case_name"] == "Test Case v. State"

    @patch("app.api.routes.search_cases", new_callable=AsyncMock)
    async def test_search_with_query(self, mock_search, client, sample_case, mock_db):
        mock_search.return_value = [(sample_case, 0.92)]
        resp = await client.get("/api/search", params={"q": "right to privacy"})
        assert resp.status_code == 200
        data = resp.json()
        assert data[0]["similarity"] == 0.92

    @patch("app.api.routes.search_cases", new_callable=AsyncMock)
    async def test_search_with_filters(self, mock_search, client, sample_case, mock_db):
        mock_search.return_value = [(sample_case, 0.8)]
        resp = await client.get(
            "/api/search",
            params={"q": "test", "topic_ids": "1,2", "year_from": 2000, "year_to": 2025},
        )
        assert resp.status_code == 200
        mock_search.assert_called_once()
        call_kwargs = mock_search.call_args
        assert call_kwargs.kwargs.get("topic_ids") == [1, 2] or call_kwargs[1].get("topic_ids") == [1, 2]

    @patch("app.api.routes.search_cases", new_callable=AsyncMock)
    async def test_search_empty_results(self, mock_search, client, mock_db):
        mock_search.return_value = []
        resp = await client.get("/api/search", params={"q": "nonexistent"})
        assert resp.status_code == 200
        assert resp.json() == []


class TestCasesEndpoint:
    @patch("app.api.routes.search_cases", new_callable=AsyncMock)
    async def test_list_cases(self, mock_search, client, sample_case, mock_db):
        mock_search.return_value = [(sample_case, None)]
        resp = await client.get("/api/cases")
        assert resp.status_code == 200
        data = resp.json()
        assert data[0]["case_name"] == "Test Case v. State"

    @patch("app.api.routes.search_cases", new_callable=AsyncMock)
    async def test_list_cases_with_filters(self, mock_search, client, sample_case, mock_db):
        mock_search.return_value = [(sample_case, None)]
        resp = await client.get("/api/cases", params={"year_from": 2015, "limit": 5})
        assert resp.status_code == 200


class TestCaseDetailEndpoint:
    async def test_get_case_found(self, client, sample_case, mock_db):
        mock_db.execute.return_value = _scalar_one_or_none(sample_case)
        resp = await client.get("/api/cases/1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["case_name"] == "Test Case v. State"
        assert data["facts"] == "The petitioner challenged the order."
        assert data["key_principles"] == ["Equality", "Due Process"]

    async def test_get_case_not_found(self, client, mock_db):
        mock_db.execute.return_value = _scalar_one_or_none(None)
        resp = await client.get("/api/cases/999")
        assert resp.status_code == 404


class TestSimilarCasesEndpoint:
    @patch("app.api.routes.get_similar_cases", new_callable=AsyncMock)
    async def test_similar_cases(self, mock_similar, client, sample_case, mock_db):
        case2 = MagicMock()
        case2.id = 2
        case2.case_name = "Another Case"
        case2.citation = "AIR 2021 SC 200"
        case2.year = 2021
        case2.bench = None
        case2.ratio_decidendi = "Some ratio"
        case2.facts = None
        case2.judgment = None
        mock_similar.return_value = [(case2, 0.85)]
        resp = await client.get("/api/cases/1/similar")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["similarity"] == 0.85


class TestTopicsEndpoint:
    async def test_list_topics(self, client, sample_topic, mock_db):
        mock_db.execute.return_value = _scalars_all([sample_topic])
        resp = await client.get("/api/topics")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Constitutional Law"
        assert data[0]["slug"] == "constitutional-law"

    async def test_list_topics_empty(self, client, mock_db):
        mock_db.execute.return_value = _scalars_all([])
        resp = await client.get("/api/topics")
        assert resp.status_code == 200
        assert resp.json() == []
