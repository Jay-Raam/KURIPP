'use client';

import React from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/landing/public-header';
import { PublicFooter } from '@/components/landing/public-footer';
import { ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="geological-theme relative min-h-screen bg-background text-foreground antialiased font-geological-display">
      <PublicHeader />

      {/* Hero Header */}
      <section className="pt-28 md:pt-36 px-4 md:px-12 border-b border-border/40 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="font-mono text-xs uppercase opacity-40 mb-3 tracking-widest">
            (ORGANIZATIONAL VISION // 03)
          </div>
          <h1 className="text-3xl md:text-5xl font-medium uppercase tracking-tight max-w-4xl leading-tight">
            The Geological Intelligence Philosophy & Architecture
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            Why we built KURIPP: To replace black-box, hallucination-prone chatbots with an imposing,
            architectural research studio grounded in mathematical provenance.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8 font-mono text-xs uppercase">
            <Link
              href="/features"
              className="border border-foreground bg-foreground text-background py-2.5 px-6 hover:bg-background hover:text-foreground transition-colors"
            >
              [Explore Capabilities →]
            </Link>
            <Link
              href="/contact"
              className="border border-border/80 py-2.5 px-6 hover:border-foreground transition-colors opacity-80 hover:opacity-100"
            >
              [Connect With Us]
            </Link>
          </div>
        </div>
      </section>

      {/* The Manifesto & Vision */}
      <section className="py-20 px-4 md:px-12 border-b border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-baseline">
            <div>
              <span className="font-mono text-xs uppercase opacity-40 block mb-3">
                (The Premise)
              </span>
              <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-tight leading-snug">
                “Modern enterprise knowledge is treated like ephemeral noise. We treat it like permanent mineral strata.”
              </h2>
            </div>
            <div className="text-sm md:text-base text-muted-foreground leading-relaxed space-y-4">
              <p>
                Organizations produce millions of pages of agreements, clinical studies, engineering specifications, and strategic whitepapers. Yet, contemporary enterprise search remains broken—fragmented across siloed drives, vulnerable to token theft, or reliant on chat assistants that fabricate plausible falsehoods.
              </p>
              <p>
                KURIPP was conceived as an antidote to ephemeral software. Drawing inspiration from brutalist architecture and geological rock strata, every document is treated as an immutable layer in a permanent knowledge deposit.
              </p>
              <p className="font-mono text-xs text-foreground/80 pt-2 border-t border-border/30">
                // ZERO COMPROMISE ON ATTRIBUTION · STRICT MULTI-TENANT ISOLATION · OPEN SOURCE HERITAGE
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 4-Tier Geological Architecture */}
      <section className="py-20 px-4 md:px-12 border-b border-border/40 bg-card/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="font-mono text-xs uppercase opacity-40">
              (Systems Anatomy)
            </span>
            <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-tight mt-1">
              The 4-Tier Infrastructure Stack
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-xl">
              Engineered as a clean monorepo architecture leveraging Turborepo, pnpm workspaces, and cloud serverless primitives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tier 1 */}
            <div className="border border-border/40 p-6 bg-background/50 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs opacity-40 uppercase">TIER 01 / INGESTION</div>
                <h3 className="text-base font-semibold uppercase mt-3">Raw S3 Object Vault</h3>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Direct client-to-storage presigned streaming. Large binaries (PDF, XLSX, DOCX) bypass the API gateway directly to S3-compatible object storage with SHA-256 integrity checksums.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/30 font-mono text-[11px] opacity-50">
                AWS S3 / MinIO / R2
              </div>
            </div>

            {/* Tier 2 */}
            <div className="border border-border/40 p-6 bg-background/50 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs opacity-40 uppercase">TIER 02 / GEOMETRY</div>
                <h3 className="text-base font-semibold uppercase mt-3">PostgreSQL 16 + pgvector</h3>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Prisma ORM schema governing relational entities paired with native pgvector HNSW indices. Executes 1536D cosine similarity queries in sub-20ms latency budgets.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/30 font-mono text-[11px] opacity-50">
                PostgreSQL 16 · Supabase
              </div>
            </div>

            {/* Tier 3 */}
            <div className="border border-border/40 p-6 bg-background/50 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs opacity-40 uppercase">TIER 03 / ORCHESTRATION</div>
                <h3 className="text-base font-semibold uppercase mt-3">Redis 7 + BullMQ Queue</h3>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Asynchronous task workers handle chunk parsing, vector embedding generation, and cross-encoder re-ranking without blocking interactive GraphQL user sessions.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/30 font-mono text-[11px] opacity-50">
                Upstash TLS · BullMQ
              </div>
            </div>

            {/* Tier 4 */}
            <div className="border border-border/40 p-6 bg-background/50 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs opacity-40 uppercase">TIER 04 / GATEWAY</div>
                <h3 className="text-base font-semibold uppercase mt-3">GraphQL Yoga v5 Gateway</h3>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Unified typed schema executing on Node Express, serving live Server-Sent Events (SSE) streaming, Socket.IO channels, and enforcing strict dual-token authentication.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/30 font-mono text-[11px] opacity-50">
                Render · Port 10000
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Zero Browser Storage */}
      <section className="py-20 px-4 md:px-12 border-b border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="border border-border/40 p-8 md:p-12 bg-card/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 font-mono text-xs uppercase opacity-50 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>[SECURITY ARCHITECTURE PROMISE]</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-tight">
                Zero Browser Storage · Strict HttpOnly Dual-Token Isolation
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-4 leading-relaxed">
                Most modern web applications store sensitive JWT tokens in `localStorage` or `sessionStorage`—leaving them exposed to any cross-site script (XSS) payload or rogue browser extension.
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-2 leading-relaxed">
                KURIPP guarantees zero browser storage security: 15-minute access tokens exist strictly in volatile client memory. 7-day refresh tokens reside inside cryptographically hashed, `SameSite=Lax`, `HttpOnly` secure cookies bound exclusively to `/graphql`.
              </p>
            </div>

            <div className="border border-border/40 p-6 bg-background font-mono text-xs uppercase space-y-2 text-foreground/80">
              <div className="flex items-center gap-2 text-emerald-500">
                <span>✓</span> <span>RFC 6750 Bearer Authorization</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-500">
                <span>✓</span> <span>HttpOnly Path=/graphql Cookie</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-500">
                <span>✓</span> <span>Argon2id Memory-Hard Password Hashing</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-500">
                <span>✓</span> <span>Multi-Tenant Row-Level Separation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Origin & Governance */}
      <section className="py-20 px-4 md:px-12 border-b border-border/40 bg-card/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <span className="font-mono text-xs uppercase opacity-40 block mb-2">
              (Lead Architect & Provenance)
            </span>
            <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-tight">
              Crafted by Jay-Raam
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-3 max-w-lg leading-relaxed">
              Designed and engineered with relentless standards for typographic beauty, database integrity, and verifiable artificial intelligence.
            </p>
            <div className="font-mono text-xs opacity-50 mt-4">
              COORDINATES: 13.0827° N, 80.2707° E · CHENNAI, TAMIL NADU
            </div>
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs uppercase">
            <a
              href="https://github.com/Jay-Raam/KURIPP"
              target="_blank"
              rel="noreferrer"
              className="border border-border/60 p-4 hover:border-foreground transition-colors flex items-center justify-between gap-8"
            >
              <span>GitHub Source Repository</span>
              <span>→</span>
            </a>
            <a
              href="https://github.com/Jay-Raam/KURIPP/releases"
              target="_blank"
              rel="noreferrer"
              className="border border-border/60 p-4 hover:border-foreground transition-colors flex items-center justify-between gap-8"
            >
              <span>Release Releases v1.0.0</span>
              <span>→</span>
            </a>
            <Link
              href="/contact"
              className="border border-foreground bg-foreground text-background p-4 hover:bg-background hover:text-foreground transition-colors flex items-center justify-between gap-8"
            >
              <span>Enterprise Contact</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
