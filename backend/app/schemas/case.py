from pydantic import BaseModel


class CaseResponse(BaseModel):
    id: int
    case_name: str
    citation: str
    year: int
    bench: str | None
    snippet: str | None = None
    similarity: float | None = None

    class Config:
        from_attributes = True


class CaseDetailResponse(BaseModel):
    id: int
    case_name: str
    citation: str
    year: int
    bench: str | None
    facts: str | None
    legal_issues: str | None
    judgment: str | None
    ratio_decidendi: str | None
    key_principles: list[str] | None
    source_url: str | None

    class Config:
        from_attributes = True


class CaseSearchResult(BaseModel):
    case: CaseResponse
    similarity: float | None = None
