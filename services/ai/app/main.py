from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from .config import settings
from .providers.openrouter import OpenRouterClient
from .parser import DocumentParser
from .chunker import SemanticChunker
from .embeddings import EmbeddingEngine

app = FastAPI(
    title=settings.service_name,
    description="Internal Python AI, Document Intelligence & RAG Engine",
    version="0.1.0",
)

openrouter_client = OpenRouterClient()
chunker = SemanticChunker(target_tokens=500, min_tokens=30, overlap_tokens=50)

# Request / Response Schemas
class ParseRequest(BaseModel):
    content: str
    mime_type: str = "text/plain"

class ChunkRequest(BaseModel):
    pages: List[Dict[str, Any]]
    target_tokens: Optional[int] = 500

class EmbedRequest(BaseModel):
    texts: List[str]

class ProcessDocumentRequest(BaseModel):
    document_id: str
    title: str
    mime_type: str
    content: str

class ProcessDocumentResponse(BaseModel):
    document_id: str
    page_count: int
    chunk_count: int
    chunks: List[Dict[str, Any]]

@app.get("/health")
async def health_check():
    return {
        "status": "UP",
        "service": settings.service_name,
        "environment": settings.environment,
        "openrouter_configured": openrouter_client.is_configured(),
        "default_model": settings.openrouter_default_model,
        "embedding_dim": EmbeddingEngine.DIMENSION,
    }

@app.post("/api/ingest/parse")
async def parse_document(req: ParseRequest):
    """
    Parses document content into structural pages with extracted headings.
    """
    try:
        pages = DocumentParser.parse(req.content, req.mime_type)
        return {"pages": [p.to_dict() for p in pages]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parsing failed: {str(e)}")

@app.post("/api/ingest/chunk")
async def chunk_pages_endpoint(req: ChunkRequest):
    """
    Splits parsed pages into semantic chunks with token counts and overlap.
    """
    try:
        from .parser import ParsedPage
        pages = [
            ParsedPage(
                page_number=p.get("page_number", 1),
                text=p.get("text", ""),
                headings=p.get("headings", []),
            )
            for p in req.pages
        ]
        c = SemanticChunker(target_tokens=req.target_tokens or 500)
        chunks = c.chunk_pages(pages)
        return {"chunks": [chk.to_dict() for chk in chunks]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Chunking failed: {str(e)}")

@app.post("/api/ingest/embed")
async def embed_texts_endpoint(req: EmbedRequest):
    """
    Generates normalized dense embedding vectors for input texts.
    """
    try:
        embeddings = await EmbeddingEngine.embed_texts(req.texts)
        return {"embeddings": embeddings, "dimension": EmbeddingEngine.DIMENSION}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

@app.post("/api/ingest/process", response_model=ProcessDocumentResponse)
async def process_document_pipeline(req: ProcessDocumentRequest):
    """
    End-to-end ingestion pipeline:
    1. Parse layout, headings, and tables
    2. Segment into semantic boundary chunks
    3. Generate dense vector embeddings for every chunk
    """
    try:
        # Step 1: Parse
        pages = DocumentParser.parse(req.content, req.mime_type)

        # Step 2: Semantic Chunker
        chunks = chunker.chunk_pages(pages)

        # Step 3: Embeddings
        chunk_texts = [c.content for c in chunks]
        embeddings = await EmbeddingEngine.embed_texts(chunk_texts) if chunk_texts else []

        structured_chunks = []
        for i, c in enumerate(chunks):
            chunk_data = c.to_dict()
            chunk_data["embedding"] = embeddings[i] if i < len(embeddings) else []
            structured_chunks.append(chunk_data)

        return ProcessDocumentResponse(
            document_id=req.document_id,
            page_count=len(pages),
            chunk_count=len(chunks),
            chunks=structured_chunks,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion pipeline failed: {str(e)}")
