# KURIPP — AI Knowledge & Research Platform

> **A production-grade full-stack workspace for document intelligence, semantic search, grounded AI research, and collaborative knowledge management.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GraphQL](https://img.shields.io/badge/API-GraphQL_Yoga_v5-E10098.svg)](https://the-guild.dev/graphql/yoga-server)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16_+_pgvector-336791.svg)](https://github.com/pgvector/pgvector)
[![MongoDB](https://img.shields.io/badge/History-MongoDB_7-47A248.svg)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Cache%20%26%20Queue-Redis_7-DC382D.svg)](https://redis.io/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_15-000000.svg)](https://nextjs.org/)

---

## 1. Overview

**KURIPP** is a personal and team knowledge workspace designed from the ground up for strict security, rigorous document intelligence, and grounded AI synthesis.

Rather than acting as a superficial wrapper around an LLM chat endpoint, KURIPP demonstrates enterprise full-stack software engineering:
- **Strict Public API Protocol**: 100% GraphQL at `/graphql` powered by Express.js and GraphQL Yoga v5 with request-scoped DataLoaders.
- **Zero Browser Sensitive Storage**: Ephemeral in-memory JWT access tokens and HttpOnly, SameSite, Secure refresh cookies with automatic session rotation and reuse invalidation.
- **Hybrid Multi-Database Architecture**:
  - **PostgreSQL 16 + pgvector**: Relational truth, RBAC, workspaces, document chunks, and embeddings.
  - **MongoDB 7**: Rich polymorphic conversational trees, AI traces, tool executions, and research notes.
  - **Redis 7**: High-speed cache, distributed locks, token buckets, and BullMQ queues.
  - **Cloudflare R2 / MinIO**: S3-compatible object storage for document binaries with signed URLs.
- **pgvector 0.8+ Hybrid Search**: Single-query Reciprocal Rank Fusion (RRF $k=60$) combining HNSW dense cosine vectors with `tsvector` lexical search.
- **Docling Document Ingestion**: Structured layout extraction (headings, paragraphs, tables, reading order) across PDF, DOCX, PPTX, XLSX, CSV, and Markdown.
- **Realtime Collaboration**: Socket.IO gateway delivering token-by-token streaming, live citation markers, and document lifecycle events.
- **Proactive Alerting**: WhatsApp (Evolution API) and Email (Nodemailer/Mailpit) dispatching sanitized, deduplicated alerts for critical production errors and CI/CD breakages.

---

## 2. System Architecture

```text
┌────────────────────────────────────────────────────────────────┐
│                   Next.js 15+ Editorial Web UI                  │
│   (TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, cmdk)  │
└───────────────────────────────┬────────────────────────────────┘
                                │ HTTPS / WSS
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                 Node.js + Express + GraphQL Yoga v5             │
│   • Armor: Depth Limits & Complexity Limiting                  │
│   • Request-Scoped DataLoaders (N+1 Elimination)               │
│   • Dual-Token Auth (In-Memory Access Token + HttpOnly Cookie) │
│   • Socket.IO Realtime Gateway                                 │
└──────┬────────────────────────┬───────────────────────┬────────┘
       │                        │                       │
       ▼                        ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  PostgreSQL  │        │   MongoDB    │        │    Redis     │
│   16 +       │        │      7       │        │      7       │
│   pgvector   │        │              │        │              │
│ • RBAC & Orgs│        │ • Chat Trees │        │ • Cache      │
│ • Chunks     │        │ • Tool Calls │        │ • Rate Limits│
│ • Embeddings │        │ • AI Runs    │        │ • BullMQ     │
│ • Audit Logs │        │ • Notes      │        │ • Locks      │
└──────────────┘        └──────────────┘        └──────────────┘
       ▲
       │ BullMQ Jobs / Internal Typed Worker
       ▼
┌────────────────────────────────────────────────────────────────┐
│               Python 3.11+ AI & Ingestion Engine               │
│   • Docling Structured Layout Parser & Fallback OCR            │
│   • Boundary-Aware Semantic Chunker                            │
│   • OpenRouter LLM Gateway (Llama 3.3 70B, Gemini 2.0)         │
│   • Cross-Encoder Reranker & Strict Grounding Verifier         │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Monorepo Organization

```text
kuripp/
├── apps/
│   ├── web/               # Next.js 15 App Router Frontend
│   └── api/               # Express + GraphQL Yoga Gateway
├── services/
│   └── ai/                # Python 3.11+ Docling & Retrieval Worker
├── packages/
│   ├── shared-types/      # Cross-cutting TypeScript models
│   ├── graphql-schema/    # Canonical domain GraphQL schemas
│   ├── eslint-config/     # Strict ESLint configuration
│   └── tsconfig/          # Shared TypeScript base configs
├── infrastructure/
│   └── docker/            # Local Postgres, Mongo, Redis, Mailpit
├── docs/                  # Architecture, Security, and Database specifications
├── docker-compose.yml     # Local orchestration
├── pnpm-workspace.yaml    # Workspace definition
├── turbo.json             # Turborepo task pipeline
└── package.json           # Root package scripts
```

---

## 4. Quick Start

### Prerequisites
- Node.js >= 20 (Node 22+ recommended)
- pnpm >= 9
- Docker & Docker Compose
- Python >= 3.11 (managed via `uv`)

### 1. Clone & Install
```bash
git clone https://github.com/your-org/kuripp.git
cd kuripp
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Infrastructure
```bash
docker compose up -d
```

### 4. Run Database Migrations & Seeds
```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start Development Servers
```bash
pnpm dev
```
- **Web App**: `http://localhost:3000`
- **GraphQL Yoga API**: `http://localhost:4000/graphql`
- **Mailpit Web UI**: `http://localhost:8025`

---

## 5. Security & Zero Browser Storage

KURIPP strictly enforces the OWASP security mandate:
- **Zero Sensitive Data in Web Storage**: `localStorage`, `sessionStorage`, and `IndexedDB` contain **no tokens, API keys, or passwords**.
- **Automated Security Guard**: CI tests scan the browser storage engine upon login/logout to guarantee zero leakage.
- **Refresh Token Rotation (RTR)**: Replayed tokens immediately revoke the entire user session family.

---

## 6. License
MIT License. Built by Jay Raam for engineering excellence.
