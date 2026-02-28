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
        """Generate embedding for text using nomic-embed-text."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url.rstrip('/')}/api/embeddings",
                json={"model": self.embedding_model, "prompt": text},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["embedding"]

    async def generate(self, prompt: str, system: str | None = None) -> str:
        """Generate text using LLM."""
        options = {"temperature": 0.3, "num_predict": 2048}
        payload = {"model": self.llm_model, "prompt": prompt, "options": options}
        if system:
            payload["system"] = system

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url.rstrip('/')}/api/generate",
                json=payload,
            )
            resp.raise_for_status()
            full_response = ""
            async for line in resp.aiter_lines():
                if line:
                    import json
                    try:
                        data = json.loads(line)
                        if "response" in data:
                            full_response += data["response"]
                        if data.get("done"):
                            break
                    except json.JSONDecodeError:
                        continue
            return full_response.strip()


ollama_client = OllamaClient()
