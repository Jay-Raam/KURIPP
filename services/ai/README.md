# KURIPP AI & Ingestion Service

Internal Python service for:
- Document extraction via Docling & Tesseract OCR
- Boundary-aware semantic chunking
- Embeddings & Hybrid Search (pgvector + tsvector RRF)
- OpenRouter LLM orchestration (Llama 3.3 70B, Gemini 2.0 Flash)
- Cross-encoder reranking & Grounded RAG citation verification

Managed using `uv`.
