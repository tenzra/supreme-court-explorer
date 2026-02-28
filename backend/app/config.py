from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/supreme_court"
    ollama_base_url: str = "http://localhost:11434"
    ollama_embedding_model: str = "nomic-embed-text"
    ollama_llm_model: str = "llama3"
    embedding_dimension: int = 768
    cors_origins: str = "http://localhost:3000,http://localhost:8081"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
