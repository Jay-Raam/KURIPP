# KURIPP Security Model & Threat Assessment

Security is a primary design tenet in KURIPP. This document defines the threat model, cryptographic boundaries, and defensive countermeasures enforced across the architecture.

---

## 1. Zero Web Storage Security Guarantee

### Threat Vector
XSS attacks, compromised browser extensions, or malicious dependencies extracting credentials stored in client storage (`localStorage`, `sessionStorage`, or `IndexedDB`).

### Defensive Mitigation
- **Strict In-Memory JWT Access Tokens**: The 15-minute access token exists exclusively in React component closure memory. Refreshing the browser or opening a new tab resets memory.
- **Secure HttpOnly Refresh Cookies**: Refresh tokens reside strictly in HttpOnly, Secure, SameSite=Strict cookies inaccessible to any client JavaScript API.
- **Automated Regression Test**: Vitest automated suite (`tests/security-storage.test.ts`) asserts that zero authentication secrets, tokens, or credentials are written to browser storage.

---

## 2. Refresh Token Rotation (RTR) & Family Invalidation

### Threat Vector
Stolen refresh token replay or session hijacking.

### Defensive Mitigation
- Every refresh request invalidates the consumed refresh token and issues a newly rotated token.
- Refresh tokens are hashed using SHA-256 before persistence in PostgreSQL.
- Sessions belong to a cryptographic `familyId`. If a previously used token from the same family is replayed, KURIPP treats it as an active attack and revokes all sessions in the family immediately.

---

## 3. Multi-Tenant Isolation & Vector Cross-Talk Prevention

### Threat Vector
Tenant A accessing or searching embeddings, document chunks, or notes belonging to Tenant B.

### Defensive Mitigation
- Every vector similarity search, BM25 query, document retrieval, and chat turn query enforces an explicit `WHERE workspace_id = :workspaceId` filter in PostgreSQL.
- Role-based access control (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) verifies membership before any resolver executes.

---

## 4. Alert Payload Sanitization & Leakage Prevention

### Threat Vector
System crash or CI/CD failure dispatches error logs containing database passwords, bearer tokens, or API keys to admin WhatsApp or email channels.

### Defensive Mitigation
- Automated regex sanitizer (`WhatsAppProvider.sanitizeContent`) scrubs:
  - Bearer tokens and JWT signatures: `Bearer [REDACTED_JWT]`
  - PostgreSQL / MongoDB / Redis connection URIs: `postgres://[USER]:[REDACTED_SECRET]@...`
  - OpenRouter / OpenAI API keys: `[REDACTED_API_KEY]`
  - Passwords and secret parameters: `password: [REDACTED]`

---

## 5. Alert Storm Suppression (Redis Cooldown)

### Threat Vector
Worker crash loop generating thousands of WhatsApp alerts, draining API quotas or spamming admin phones.

### Defensive Mitigation
- Redis-backed fingerprint deduplication: hashes `alertType + normalizedErrorMessage`.
- Sets atomic key with a 15-minute expiration window (`EX 900`).
- Duplicate alerts within 15 minutes are suppressed and logged.
