from functools import lru_cache
from pathlib import Path
from secrets import token_urlsafe

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
STORAGE_DIR = BASE_DIR / "storage"


class Settings(BaseSettings):
    app_name: str = "TrustVault AI"
    environment: str = "development"
    secret_key: str = Field(default_factory=lambda: token_urlsafe(48))
    access_token_expire_minutes: int = 480

    database_url: str = f"sqlite:///{(STORAGE_DIR / 'trustvault.db').as_posix()}"
    upload_dir: str = str(STORAGE_DIR / "uploads")
    chroma_dir: str = str(STORAGE_DIR / "chroma")
    chroma_collection: str = "trustvault_chunks"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    max_upload_mb: int = 15
    chunk_size_words: int = 220
    chunk_overlap_words: int = 45
    retrieval_top_k: int = 5
    similarity_threshold: float = 0.35

    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_backend: str = "sentence-transformers"
    llm_provider: str = "mock"

    default_admin_username: str = "admin"
    default_admin_password: str = ""
    default_viewer_username: str = "viewer"
    default_viewer_password: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @field_validator("secret_key", mode="before")
    @classmethod
    def generate_secret_key_when_blank(cls, value: str | None) -> str:
        if value is None or not str(value).strip():
            return token_urlsafe(48)
        return str(value)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.chroma_dir).mkdir(parents=True, exist_ok=True)
    return settings
