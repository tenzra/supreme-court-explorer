from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader, APIKeyQuery

from app.config import settings

_header_scheme = APIKeyHeader(name="X-API-Key", auto_error=False)
_query_scheme = APIKeyQuery(name="api_key", auto_error=False)


async def require_api_key(
    header_key: str | None = Security(_header_scheme),
    query_key: str | None = Security(_query_scheme),
) -> str | None:
    """Validate API key from header or query param.

    When settings.api_key is empty, auth is disabled (dev mode).
    """
    if not settings.api_key:
        return None

    key = header_key or query_key
    if not key or key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return key
