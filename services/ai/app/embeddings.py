import math
import hashlib
from typing import List, Dict, Any, Optional
import httpx
from .config import settings

class EmbeddingEngine:
    """
    Generates normalized dense vector embeddings for semantic similarity search.
    Supports OpenRouter / external provider if configured, with a high-speed,
    deterministic local dense vector projector (1536-dimensional unit vectors).
    """

    DIMENSION = 1536

    @classmethod
    def generate_local_embedding(cls, text: str) -> List[float]:
        """
        Fast deterministic dense vector projection.
        Maps character n-grams and token tokens into a 1536-dimensional unit sphere
        using hashing projection and L2 normalization.
        """
        if not text or not text.strip():
            return [0.0] * cls.DIMENSION

        vec = [0.0] * cls.DIMENSION
        tokens = text.lower().split()

        # Token and bigram frequency hashing
        for i, token in enumerate(tokens):
            # Unigram hash
            h1 = int(hashlib.sha256(token.encode('utf-8')).hexdigest(), 16)
            idx1 = h1 % cls.DIMENSION
            sign1 = 1.0 if (h1 >> 16) % 2 == 0 else -1.0
            vec[idx1] += sign1 * 1.5

            # Bigram hash
            if i < len(tokens) - 1:
                bigram = f"{token}_{tokens[i+1]}"
                h2 = int(hashlib.md5(bigram.encode('utf-8')).hexdigest(), 16)
                idx2 = h2 % cls.DIMENSION
                sign2 = 1.0 if (h2 >> 8) % 2 == 0 else -1.0
                vec[idx2] += sign2 * 2.0

            # Trigram character hashing for subword capture
            for j in range(len(token) - 2):
                tri = token[j : j + 3]
                h3 = int(hashlib.blake2b(tri.encode('utf-8'), digest_size=8).hexdigest(), 16)
                idx3 = h3 % cls.DIMENSION
                vec[idx3] += 0.5

        # L2 Normalization (unit norm)
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]

        return vec

    @classmethod
    async def embed_texts(cls, texts: List[str]) -> List[List[float]]:
        """
        Embeds a batch of texts.
        """
        # If OpenRouter / external provider has embeddings enabled:
        if settings.openrouter_api_key and "openai" in settings.openrouter_base_url:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        f"{settings.openrouter_base_url}/embeddings",
                        headers={
                            "Authorization": f"Bearer {settings.openrouter_api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "input": texts,
                            "model": "text-embedding-3-small",
                        },
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return [item["embedding"] for item in data.get("data", [])]
            except Exception:
                pass  # Fallback to local engine

        # Local deterministic dense projector
        return [cls.generate_local_embedding(t) for t in texts]
