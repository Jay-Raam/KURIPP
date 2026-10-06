# KURIPP — AI Knowledge & Research Platform

> **A production-quality, portfolio-grade AI full-stack workspace engineered for document intelligence, hybrid vector search (RRF $k=60$), deep research synthesis, grounded citation attribution, and proactive alerting.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GraphQL](https://img.shields.io/badge/API-GraphQL_Yoga_v5-E10098.svg)](https://the-guild.dev/graphql/yoga-server)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_17_+_pgvector-336791.svg)](https://github.com/pgvector/pgvector)
[![MongoDB](https://img.shields.io/badge/History-MongoDB_8-47A248.svg)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Cache%20%26%20Queue-Redis_7-DC382D.svg)](https://redis.io/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_15_App_Router-000000.svg)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/AI_Engine-Python_3.11_+_uv-3776AB.svg)](https://astral.sh/uv)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions_Matrix-2088FF.svg)](https://github.com/Jay-Raam/KURIPP/actions)

---

## 1. Overview & Vision

**KURIPP** is a personal and team knowledge workspace designed from the ground up for strict security, rigorous document intelligence, and grounded AI synthesis.

Rather than acting as a superficial wrapper around an LLM chat endpoint, KURIPP demonstrates enterprise full-stack software engineering:
- **Strict Public API Protocol**: 100% GraphQL at `/graphql` powered by Express.js and GraphQL Yoga v5 with request-scoped DataLoaders preventing N+1 queries.
- **Zero Browser Sensitive Storage**: In-memory JWT access tokens and HttpOnly, SameSite, Secure refresh cookies with automatic session rotation (RTR) and token family reuse detection. Zero tokens in `localStorage`, `sessionStorage`, or `IndexedDB`.
- **Hybrid Multi-Database Architecture**:
  - **PostgreSQL 17 + pgvector**: Relational truth, organizations, workspaces, RBAC, documents, document chunks, 1536-dim embeddings, collections, research notes, diffs, reports, and audit logs.
  - **MongoDB 8**: Chat sessions, conversational message turns, tool execution history, and run telemetry.
  - **Redis 7**: Cache, rate limiting, distributed locks, and 15-minute alert deduplication fingerprints.
  - **Cloudflare R2 / S3**: Presigned direct-to-storage upload and streaming downloads with 50MB limits and format verification.
- **Single-Query Hybrid Search (RRF $k=60$)**: Reciprocal Rank Fusion fusing dense 1536-dimensional cosine vector distance with BM25 lexical token scoring, strictly isolated by tenant/workspace.
- **Deep Research Studio**: Autonomous multi-angle query decomposition, multi-pass hybrid retrieval passes, cross-document evidence synthesis, and 1-click export to Markdown Research Notes.
- **Semantic Document & Contract Diff**: Clause-level segmentation identifying `ADDED`, `REMOVED`, `MODIFIED` (e.g. Net 30 to Net 60, liability caps 12x to 24x), and `UNCHANGED` provisions with AI commercial and risk impact analysis.
- **AI Evaluation Benchmark**: Automated harness evaluating retrieval quality against benchmark cases, asserting **Groundedness ($\ge 90\%$)**, Citation Precision, and Hallucination Index.
- **Proactive WhatsApp & Email Alerting**: Evolution API integration with automatic payload sanitization (purging JWTs, passwords, and API keys), Redis deduplication (15m cooldown window), and webhook callbacks for delivery/read receipts (`whatsapp_messages` audit table).

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client (Next.js 15)"]
        UI["Dark Obsidian Editorial UI"]
        GraphQLClient["GraphQL Client (In-Memory JWT)"]
        SocketClient["Socket.IO Client"]
    end

    subgraph GatewayLayer["Backend API (Node.js + Yoga v5)"]
        Yoga["GraphQL Yoga Gateway (/graphql)"]
        AuthMiddleware["Dual-Token Auth & Session Guard"]
        DataLoaders["Batching DataLoaders (N+1 Elimination)"]
        Resolvers["Domain Resolvers"]
        Webhooks["Internal Webhooks (/api/webhooks)"]
    end

    subgraph ServiceLayer["Core Domain Services"]
        SearchSvc["Hybrid Search Engine (RRF k=60)"]
        ChatSvc["Conversational Intelligence"]
        ResearchEngine["Deep Research Studio"]
        DiffEngine["Contract & Document Diff"]
        AlertsSvc["WhatsApp & Email Alerts"]
        EvalHarness["AI Evaluation Benchmark"]
    end

    subgraph DataStorage["Polyglot Storage Layer"]
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

    UI --> GraphQLClient
    GraphQLClient -->|Strict /graphql| Yoga
    Yoga --> AuthMiddleware
    AuthMiddleware --> Resolvers
    Resolvers --> DataLoaders
    Resolvers --> SearchSvc & ChatSvc & ResearchEngine & DiffEngine & AlertsSvc & EvalHarness
    Resolvers --> Postgres & Mongo & RedisCache
    SearchSvc --> Postgres
    AIService --> Postgres
    Webhooks --> AlertsSvc
    AlertsSvc -->|Evolution API Webhook| WhatsApp[(WhatsApp Admin)]
```

---

## 3. Monorepo Organization

```text
kuripp/
├── apps/
│   ├── web/               # Next.js 15 App Router Frontend (11 Static Routes)
│   │   ├── src/app/(workspace)/
│   │   │   ├── chat/      # 3-Column Conversational Workspace with Citation Drawer
│   │   │   ├── documents/ # Enterprise Document Vault with Live Upload Streaming
│   │   │   ├── research/  # 5-Tab Deep Research Studio, Diff, Collections & Benchmark
│   │   │   └── workspaces/# Workspace Management & RBAC Role Assignment
│   └── api/               # Express + GraphQL Yoga Gateway & Services
│       ├── src/alerts/    # WhatsApp Provider, Deduplication & Webhooks
│       ├── src/collections/# Collections Organization Service
│       ├── src/notes/     # Research Notes Service
│       ├── src/research/  # Deep Research Engine (Query Decomposition & Synthesis)
│       ├── src/tools/     # Document Diff Engine & AI Tool Runner
│       ├── src/evaluation/# AI Groundedness Benchmark Harness
│       └── src/scripts/   # Enterprise Database Seeder
├── services/
│   └── ai/                # Python 3.11+ uv FastAPI Service (Parsing, Chunking, Embeddings)
├── packages/
│   ├── shared-types/      # Canonical TypeScript Models & Interfaces
│   ├── graphql-schema/    # Canonical GraphQL SDL Schema & Definitions
│   ├── eslint-config/     # Strict ESLint Configuration
│   └── tsconfig/          # Shared TypeScript Base Configurations
├── .github/
│   ├── workflows/ci.yml   # Multi-Job Matrix CI Workflow with WhatsApp Failure Alerts
│   └── pull_request_template.md # PR Security & Verification Checklist
├── docs/
│   ├── architecture/      # System Overview & Mermaid Diagrams
│   └── security/          # Threat Model & Cryptographic Boundaries
├── docker-compose.yml     # Local Infrastructure Orchestration
├── pnpm-workspace.yaml    # Monorepo Workspace Definition
└── package.json           # Root Scripts & Turborepo Task Pipeline
```

---

## 4. Quick Start

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose
- Python >= 3.11 (managed via `uv`)

### 1. Clone & Install
```bash
git clone https://github.com/Jay-Raam/KURIPP.git
cd KURIPP
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Ensure backend `.env` contains:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
ALERT_WHATSAPP_NUMBER=+1234567890
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_KEY=your_evolution_api_key
```

### 3. Start Infrastructure & Run Seeds
```bash
# Start PostgreSQL, MongoDB, Redis, Mailpit
docker compose up -d

# Generate Prisma Client & Run Seeder
pnpm --filter @kuripp/api db:generate
pnpm --filter @kuripp/api db:seed
```

Demo Credentials seeded:
- **Email**: `recruiter@kuripp.demo`
- **Password**: `KurippDemo2026!`

### 4. Run Development Services
```bash
pnpm dev
```
- **Web App**: `http://localhost:3000`
- **GraphQL Yoga API**: `http://localhost:4000/graphql`
- **Mailpit Web UI**: `http://localhost:8025`

---

## 5. Test Suite & Verification Results

| Suite | Runner | Test Count | Status |
| :--- | :--- | :--- | :--- |
| **API Test Suite** | Vitest | **44 / 44 Passing** | ✅ Green |
| **Web Security Storage** | Vitest | **2 / 2 Passing** | ✅ Green |
| **Python Ingestion & Embeddings** | Pytest | **7 / 7 Passing** | ✅ Green |
| **Next.js Production Build** | Next.js 15 | **11 / 11 Routes Static** | ✅ Compiled |

---

## 6. License
MIT License. Built by Jay Raam as a flagship AI Full Stack portfolio application.
