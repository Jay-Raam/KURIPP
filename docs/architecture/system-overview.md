# KURIPP — Architecture & System Overview

KURIPP is a production-grade AI Knowledge, Document Intelligence, and Research Workspace built for rigorous enterprise knowledge cognition.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client (Next.js 15)"]
        UI["Editorial Dark Obsidian UI"]
        Apollo["GraphQL Client (In-Memory JWT)"]
        SocketClient["Socket.IO Client"]
    end

    subgraph GatewayLayer["Backend API (Node.js + Yoga v5)"]
        Yoga["GraphQL Yoga v5 Gateway (/graphql)"]
        AuthMiddleware["Dual-Token Auth & Session Guard"]
        DataLoaders["Batching DataLoaders (N+1 Prevention)"]
        Resolvers["Domain Resolvers"]
    end

    subgraph ServiceLayer["Core Domain Services"]
        SearchSvc["Hybrid Search Engine (RRF k=60)"]
        ChatSvc["Conversational Intelligence"]
        ResearchEngine["Deep Research Studio"]
        DiffEngine["Contract & Document Diff"]
        AlertsSvc["Sanitized WhatsApp & Email Alerts"]
    end

    subgraph DataStorage["Enterprise Polyglot Storage"]
        Postgres[("PostgreSQL 17 + pgvector (Relational Source of Truth)")]
        Mongo[("MongoDB 8 (Conversations & Runs)")]
        RedisCache[("Redis 7 (Rate Limit, Dedup & BullMQ)")]
        S3Storage[("Cloudflare R2 / S3 Storage")]
    end

    subgraph AIService["Python AI Ingestion (uv + FastAPI)"]
        Parser["Layout Parser (Markdown / CSV / Docs)"]
        Chunker["Semantic Boundary Chunker (~500 tokens)"]
        EmbeddingEngine["1536-dim Projector & Dense Embeddings"]
    end

    UI --> Apollo
    Apollo -->|Strict /graphql| Yoga
    Yoga --> AuthMiddleware
    AuthMiddleware --> Resolvers
    Resolvers --> DataLoaders
    Resolvers --> SearchSvc & ChatSvc & ResearchEngine & DiffEngine & AlertsSvc
    Resolvers --> Postgres & Mongo & RedisCache
    SearchSvc --> Postgres
    AIService --> Postgres
    AlertsSvc -->|Evolution API Webhook| WhatsApp[(WhatsApp Admin)]
```

---

## 2. Polyglot Storage Strategy

| Database | Role & Responsibilities | Key Entities Stored |
| :--- | :--- | :--- |
| **PostgreSQL 17** | **Relational Source of Truth & Vector Space** | Users, Organizations, Workspaces, Members, Documents, Document Chunks, 1536-dim pgvector Embeddings, Collections, Research Notes, Document Comparisons, Generated Reports, Audit Logs, WhatsApp Message Logs |
| **MongoDB 8** | **Document History & Run Telemetry** | Chat Sessions, Chat Message turns, Token Usage, Tool Execution Logs, Research Runs |
| **Redis 7** | **Ephemeral High-Speed Workloads** | Rate Limiting, Session Family Revocation Cache, Alert Deduplication (15m Cooldown Fingerprints), Distributed Locks |
| **Cloudflare R2 / S3** | **Binary Object Storage** | Presigned streaming uploads for raw PDFs, DOCX, XLSX, PPTX, CSV, and Images |

---

## 3. Hybrid Search & Reciprocal Rank Fusion (RRF)

KURIPP fuses dense vector similarity with BM25 lexical token scoring using single-pass Reciprocal Rank Fusion:

$$RRF(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$

Where:
- $k = 60$ (smoothing constant damping outlier ranks)
- $M = \{\text{Cosine Vector Similarity Rank}, \text{BM25 Lexical Score Rank}\}$
- Strictly filtered by `WHERE workspace_id = :workspaceId` to prevent cross-tenant vector leakage.

---

## 4. Multi-Pass Deep Research Workflow

```mermaid
sequenceDiagram
    participant User as Researcher UI
    participant Gateway as GraphQL Yoga
    participant Engine as Deep Research Engine
    participant Hybrid as Hybrid Search (RRF)
    participant OpenRouter as OpenRouter LLM
    participant Notes as Research Notes

    User->>Gateway: mutation runDeepResearch(objective)
    Gateway->>Engine: runDeepResearch(userId, input)
    Engine->>Engine: Decompose Objective into 3-5 Sub-Queries
    loop For Each Sub-Query
        Engine->>Hybrid: search(workspaceId, subQuery)
        Hybrid-->>Engine: Top 5 Ranked Citations
    end
    Engine->>Engine: Deduplicate & Rank Multi-Source Citations
    Engine->>OpenRouter: Synthesize Cross-Document Brief
    OpenRouter-->>Engine: Formatted Findings & Recommendations
    Engine-->>Gateway: DeepResearchSynthesis Payload
    Gateway-->>User: Visualized Synthesis & Evidence Matrix
    User->>Notes: 1-Click "Save to Notes"
```
