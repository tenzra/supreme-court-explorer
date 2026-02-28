from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import router

app = FastAPI(
    title="Supreme Court AI Case Explorer",
    description="AI-assisted semantic search for Indian Supreme Court landmark cases",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api", tags=["api"])


@app.get("/health")
async def health():
    return {"status": "ok"}
