import httpx
from app.config import settings


class OllamaClient:
    def __init__(
        self,
        base_url: str | None = None,
        embedding_model: str | None = None,
        llm_model: str | None = None,
    ):
        self.base_url = base_url or settings.ollama_base_url
        self.embedding_model = embedding_model or settings.ollama_embedding_model
        self.llm_model = llm_model or settings.ollama_llm_model
        self.dimension = settings.embedding_dimension

    async def embed(self, text: str) -> list[float]:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url.rstrip('/')}/api/embeddings",
                json={"model": self.embedding_model, "prompt": text},
            )
            resp.raise_for_status()
            return resp.json()["embedding"]

    async def generate(self, prompt: str, system: str | None = None) -> str:
        payload = {
            "model": self.llm_model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.3, "num_predict": 2048},
        }
        if system:
            payload["system"] = system

        async with httpx.AsyncClient(timeout=300.0) as client:
            resp = await client.post(
                f"{self.base_url.rstrip('/')}/api/generate",
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()["response"].strip()


ollama_client = OllamaClient()
