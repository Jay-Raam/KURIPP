import pytest
import math
from fastapi.testclient import TestClient
from app.main import app
from app.parser import DocumentParser
from app.chunker import SemanticChunker, Chunk
from app.embeddings import EmbeddingEngine

client = TestClient(app)

def test_document_parser_markdown():
    sample_md = """# Introduction to Quantum Algorithms
Quantum algorithms leverage superposition and entanglement.

## Grover's Search Algorithm
Grover's algorithm provides quadratic speedup for unstructured search problems.
Given an unsorted database of N items, Grover finds the target in O(sqrt(N)) time.

## Shor's Factoring Algorithm
Shor's algorithm factors integers in polynomial time on an ideal quantum computer.
"""
    pages = DocumentParser.parse(sample_md, "text/markdown")
    assert len(pages) >= 1
    page = pages[0]
    assert "Quantum algorithms" in page.text
    assert "Introduction to Quantum Algorithms" in page.headings or "Grover's Search Algorithm" in page.headings

def test_document_parser_csv_to_markdown_table():
    sample_csv = """Metric,Q1,Q2,Q3,Q4
Revenue ($M),12.4,14.8,16.2,19.5
Net Margin,22%,24%,25%,28%
Active Users,10500,12300,15400,21000
"""
    pages = DocumentParser.parse(sample_csv, "text/csv")
    assert len(pages) == 1
    table_text = pages[0].text
    assert "| Metric | Q1 | Q2 | Q3 | Q4 |" in table_text
    assert "| --- | --- | --- | --- | --- |" in table_text
    assert "| Revenue ($M) | 12.4 | 14.8 | 16.2 | 19.5 |" in table_text

def test_document_parser_html():
    sample_html = """<html><body>
    <h1>Executive Summary</h1>
    <p>This report reviews <b>fiscal year 2026</b> performance.</p>
    <script>alert('bad');</script>
    <h2>Key Initiatives</h2>
    <p>Distributed vector indexing achieved sub-10ms latency.</p>
    </body></html>"""
    pages = DocumentParser.parse(sample_html, "text/html")
    assert len(pages) >= 1
    assert "Executive Summary" in pages[0].headings
    assert "fiscal year 2026" in pages[0].text
    assert "bad" not in pages[0].text  # Script stripped

def test_semantic_chunker_boundaries_and_headings():
    pages = DocumentParser.parse("""# AI Architecture
Deep neural networks require substantial computing resources and low-latency interconnects.

# Vector Retrieval
Dense vector embeddings map unstructured documents into metric vector spaces.
Hybrid retrieval fuses dense semantic vectors with BM25 / tsvector sparse indices.
""", "text/markdown")

    chunker = SemanticChunker(target_tokens=50, overlap_tokens=10)
    chunks = chunker.chunk_pages(pages)

    assert len(chunks) >= 1
    for c in chunks:
        assert isinstance(c, Chunk)
        assert c.token_count > 0
        assert c.content != ""
        assert c.chunk_index >= 0

def test_embedding_engine_normalization():
    text = "Hybrid search Reciprocal Rank Fusion combines PostgreSQL HNSW cosine vectors with tsvector lexical search."
    vector = EmbeddingEngine.generate_local_embedding(text)

    assert len(vector) == EmbeddingEngine.DIMENSION
    assert len(vector) == 1536

    # Unit norm test: ||v|| == 1.0 (within float tolerance)
    l2_norm = math.sqrt(sum(x * x for x in vector))
    assert pytest.approx(l2_norm, rel=1e-4) == 1.0

def test_full_ingestion_api_endpoint():
    payload = {
        "document_id": "doc-test-1234",
        "title": "Quantum Hybrid Search Architecture",
        "mime_type": "text/markdown",
        "content": "# Executive Overview\nThis paper details the hybrid search engine of KURIPP.\n\n# System Mechanics\nBy combining dense vectors and full text search, retrieval recall reaches 98%.\n",
    }

    response = client.post("/api/ingest/process", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["document_id"] == "doc-test-1234"
    assert data["page_count"] >= 1
    assert data["chunk_count"] >= 1
    assert len(data["chunks"]) == data["chunk_count"]

    first_chunk = data["chunks"][0]
    assert "content" in first_chunk
    assert "token_count" in first_chunk
    assert "embedding" in first_chunk
    assert len(first_chunk["embedding"]) == 1536
