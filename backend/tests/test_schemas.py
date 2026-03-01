from app.schemas import CaseResponse, CaseDetailResponse, CaseSearchResult, TopicResponse


def test_case_response_valid():
    data = {
        "id": 1,
        "case_name": "Test v. State",
        "citation": "AIR 2020 SC 100",
        "year": 2020,
        "bench": "3 Judge Bench",
        "snippet": "Some snippet...",
        "similarity": 0.95,
    }
    r = CaseResponse(**data)
    assert r.id == 1
    assert r.similarity == 0.95


def test_case_response_optional_fields():
    r = CaseResponse(id=1, case_name="X", citation="C", year=2020, bench=None)
    assert r.bench is None
    assert r.snippet is None
    assert r.similarity is None


def test_case_detail_response():
    r = CaseDetailResponse(
        id=1,
        case_name="X v. Y",
        citation="AIR 2020 SC 1",
        year=2020,
        bench="5 Judge Bench",
        facts="Facts here",
        legal_issues="Issues here",
        judgment="Judgment here",
        ratio_decidendi="Ratio here",
        key_principles=["P1", "P2"],
        source_url="https://example.com",
    )
    assert r.key_principles == ["P1", "P2"]
    assert r.source_url == "https://example.com"


def test_case_detail_response_nullable():
    r = CaseDetailResponse(
        id=1, case_name="X", citation="C", year=2020, bench=None,
        facts=None, legal_issues=None, judgment=None,
        ratio_decidendi=None, key_principles=None, source_url=None,
    )
    assert r.facts is None


def test_case_search_result():
    case = CaseResponse(id=1, case_name="X", citation="C", year=2020, bench=None)
    r = CaseSearchResult(case=case, similarity=0.88)
    assert r.similarity == 0.88
    assert r.case.id == 1


def test_topic_response():
    r = TopicResponse(id=1, name="Constitutional Law", slug="constitutional-law")
    assert r.slug == "constitutional-law"
