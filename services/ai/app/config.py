import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    service_name: str = "kuripp-ai-service"
    environment: str = os.getenv("NODE_ENV", "development")
    port: int = 8000
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    openrouter_default_model: str = os.getenv(
        "OPENROUTER_DEFAULT_MODEL", "meta-llama/llama-3.3-70b-instruct:free"
    )
    openrouter_base_url: str = os.getenv(
        "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
    )

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
