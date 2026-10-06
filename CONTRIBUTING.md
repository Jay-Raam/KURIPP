# Contributing to KURIPP

Thank you for your interest in contributing to **KURIPP — AI Knowledge & Research Platform**!

To ensure high engineering quality, maintainable architecture, and production readiness, all contributions must adhere to the following standards and non-negotiables.

---

## 1. Architectural Non-Negotiables

Every PR must respect the core invariants of KURIPP:

1. **Strict Public API Protocol**:
   - The public application interface is **100% GraphQL Yoga v5 at `/graphql`**.
   - Do NOT introduce client-facing REST endpoints. (The only Express routes permitted are internal webhooks at `/api/webhooks` for Evolution API and CI callbacks).
   - Use DataLoaders for batching to eliminate N+1 queries.

2. **Zero Browser Sensitive Storage**:
   - Access tokens are held exclusively **in memory** via React state / closures.
   - Refresh tokens are delivered via **HttpOnly, SameSite=Strict, Secure cookies**.
   - NEVER persist JWTs, session tokens, or API keys in `localStorage`, `sessionStorage`, or `IndexedDB`.

3. **Obsidian Dark Editorial Design Language**:
   - Monochromatic high-contrast dark theme (`bg-zinc-950`, `border-zinc-800`, `text-zinc-100`).
   - **STRICTLY NO BLUE or blue shades** (except standard hyperlinks where required).
   - **STRICTLY NO PURPLE button gradients**.
   - **NO generic AI card hover-scale effects** or unnecessary bouncy animations.

4. **Multi-Tenant Workspace Isolation**:
   - Every document, chunk, session, collection, and search query MUST be scoped to `workspaceId` and verified against user membership roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).

5. **Sanitized Alerting**:
   - Proactive alert dispatches (WhatsApp / Evolution API) must pass through the regex sanitizer to strip JWTs, database connection URIs, and API keys before transmission.

---

## 2. Local Development Workflow

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Python 3.11+ and `uv`
- Docker (optional for local mock mode; required for full local container stack)

### Quick Setup

```bash
# 1. Run the system doctor to audit local dependencies
pnpm doctor

# 2. Start container infrastructure (Postgres 17 pgvector, Mongo 8, Redis 7)
pnpm docker:up

# 3. Seed database with recruiter demo and sample documents
pnpm db:seed

# 4. Start all services in parallel (Turborepo)
pnpm dev

# 5. Run end-to-end integration smoke tests
pnpm smoke
```

---

## 3. Testing & Verification Checklist

Before submitting a pull request, ensure all verification suites pass with zero errors:

```bash
# 1. Environment Doctor
pnpm doctor

# 2. Architectural Smoke Test
pnpm smoke

# 3. Turborepo Typecheck
pnpm typecheck

# 4. Monorepo Unit & Security Tests
pnpm test

# 5. Python Fast Layout Chunking Tests
cd services/ai && uv run pytest

# 6. Production Next.js Build
pnpm --filter @kuripp/web build
```

---

## 4. Conventional Commits

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(scope): new user-facing functionality`
- `fix(scope): bug fix or regression repair`
- `perf(scope): query optimization, indexing, or latency reduction`
- `security(scope): auth guard, sanitization, or storage hardening`
- `docs(scope): documentation updates`
- `chore(deps): dependency version upgrades`

---

## 5. Security Vulnerability Disclosure

If you discover a security vulnerability or token leak vector, please do not file a public issue. Review our [Threat Model](docs/security/threat-model.md) and report directly via private security advisory.
