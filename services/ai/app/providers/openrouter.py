import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from ..config import settings

class OpenRouterClient:
    """
    OpenRouter API client supporting streaming and standard chat completions.
    Utilizes server-side OPENROUTER_API_KEY from environment.
    """
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.openrouter_api_key
        self.base_url = base_url or settings.openrouter_base_url

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 5)

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "error": "OpenRouter API key not configured in environment.",
                "content": "Mock response: Please set OPENROUTER_API_KEY in .env to enable live generation.",
            }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://kuripp.local",
            "X-Title": "KURIPP AI Workspace",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model or settings.openrouter_default_model,
            "messages": messages,
            "temperature": temperature,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            return response.json()
