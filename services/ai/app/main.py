from fastapi import FastAPI
from .config import settings
from .providers.openrouter import OpenRouterClient

app = FastAPI(
    title=settings.service_name,
    description="Internal Python AI, Document Intelligence & RAG Engine",
    version="0.1.0",
)

openrouter_client = OpenRouterClient()

@app.get("/health")
async def health_check():
    return {
        "status": "UP",
        "service": settings.service_name,
        "environment": settings.environment,
        "openrouter_configured": openrouter_client.is_configured(),
        "default_model": settings.openrouter_default_model,
    }
