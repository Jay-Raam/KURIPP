'use client';

import React from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/landing/public-header';
import { PublicFooter } from '@/components/landing/public-footer';
import {
  GitCommit,
  ArrowUpRight,
  Sparkles,
  Calendar,
} from 'lucide-react';

export default function ChangelogPage() {
  const releases = [
    {
      version: 'v1.0.0',
      tag: 'CURRENT PRODUCTION',
      date: 'October 2026',
      title: 'Production Core Milestone & Hybrid RAG Engine',
      summary:
        'Official general availability production release of KURIPP. Complete 15-phase architecture deployed to Vercel and Render with zero-storage authentication and pgvector HNSW indexing.',
      highlights: [
        'PostgreSQL 16 + pgvector HNSW high-dimensional index with Reciprocal Rank Fusion (k=60)',
        'Dual-token HttpOnly authentication: 15-minute in-memory JWT + 7-day cryptographically hashed refresh cookie',
        'OpenRouter Multi-Model Inference Gateway integrating Llama 3.3 70B, Gemini 2.0 Flash, and Qwen 2.5',
        'Autonomous Deep Research Studio with multi-angle query decomposition in sub-second latency',
        'Clause-by-Clause Contract & Document Diff Engine with commercial liability risk mapping',
        'Continuous AI Evaluation Harness with automated 92% groundedness validation',
        'Vercel Edge Rewrites proxying /graphql directly to Render production cluster',
        'Geological Design System with HSL lithic color tokens and smooth dark/light mode persistence',
      ],
      commit: '3ea3678',
    },
    {
      version: 'v0.9.4',
      tag: 'STABLE PREVIEW',
      date: 'September 2026',
      title: 'OpenRouter Dynamic Resolvers & Model Routing',
      summary:
        'Introduced dynamic GraphQL Yoga resolvers exposing frontier AI models without exposing server API keys to client browsers.',
      highlights: [
        'OpenRouter API integration with dynamic model fallback',
        'Support for free-tier and reasoning frontier models',
        'Streaming Server-Sent Events (SSE) across long-context research queries',
        'Prompt-level citation grounding enforcement to mitigate hallucination rates',
      ],
      commit: '9e41b20',
    },
    {
      version: 'v0.8.2',
      tag: 'BETA',
      date: 'August 2026',
      title: 'Multi-Format BullMQ Asynchronous Ingestion',
      summary:
        'Engineered an async background worker queue powered by Upstash Redis 7 and BullMQ for processing heavy document archives.',
      highlights: [
        'Async ingestion pipeline for PDF, Markdown, DOCX, and CSV spreadsheets',
        'Semantic chunking with overlapping sliding windows and boundary preservation',
        'SHA-256 deduplication preventing redundant vector embeddings',
        'Document library filtering by category (PDF, Dataset, Document, Code)',
      ],
      commit: '48f12c8',
    },
    {
      version: 'v0.5.0',
      tag: 'ALPHA',
      date: 'July 2026',
      title: 'Multi-Tenant Workspace Core & HttpOnly Auth',
      summary:
        'Foundation of multi-tenant workspace architecture with strict row-level isolation and dual-token session security.',
      highlights: [
        'Multi-tenant workspace schema with OWNER, ADMIN, and MEMBER roles',
        'Zero browser storage security preventing token extraction attacks',
        'Argon2id password hashing with memory-hard parameters',
        'GraphQL DataLoaders eliminating N+1 database query bottlenecks',
      ],
      commit: '1a02d4f',
    },
  ];

  return (
    <div className="geological-theme relative min-h-screen bg-background text-foreground antialiased font-geological-display">
      <PublicHeader />

      {/* Hero Header */}
      <section className="pt-28 md:pt-36 px-4 md:px-12 border-b border-border/40 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="font-mono text-xs uppercase opacity-40 mb-3 tracking-widest">
            (VERSION LOGBOOK // 04)
          </div>
          <h1 className="text-3xl md:text-5xl font-medium uppercase tracking-tight max-w-4xl leading-tight">
            Release Archives & Engineering Changelog
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            Every architectural milestone, security refinement, and database optimization shipped to the KURIPP platform.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8 font-mono text-xs uppercase">
            <a
              href="https://github.com/Jay-Raam/KURIPP/releases"
              target="_blank"
              rel="noreferrer"
              className="border border-foreground bg-foreground text-background py-2.5 px-6 hover:bg-background hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <span>[GitHub Releases v1.0.0]</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/features"
              className="border border-border/80 py-2.5 px-6 hover:border-foreground transition-colors opacity-80 hover:opacity-100"
            >
              [Explore Features]
            </Link>
          </div>
        </div>
      </section>

      {/* Roadmap Banner */}
      <section className="py-12 px-4 md:px-12 border-b border-border/40 bg-card/20">
        <div className="max-w-7xl mx-auto border border-emerald-500/40 p-6 md:p-8 bg-emerald-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase text-emerald-500 font-semibold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>[NEXT IN PIPELINE // ROADMAP V1.1.0]</span>
            </div>
            <h2 className="text-lg md:text-xl font-medium uppercase tracking-wide">
              PDF Canvas Real-Time Annotation & In-Browser Vision OCR
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl">
              Currently in active development: Visual bounding-box highlighting on original PDF canvases, client-side WebAssembly OCR for scanned contracts, and collaborative synchronous research rooms.
            </p>
          </div>

          <div className="font-mono text-xs uppercase border border-emerald-500/60 px-4 py-2 text-emerald-500 whitespace-nowrap">
            EST. 2026.Q4 TARGET
          </div>
        </div>
      </section>

      {/* Releases Timeline */}
      <section className="py-20 px-4 md:px-12 border-b border-border/40">
        <div className="max-w-7xl mx-auto space-y-16">
          {releases.map((rel) => (
            <div
              key={rel.version}
              className="border border-border/40 p-6 md:p-10 bg-card/30 flex flex-col justify-between"
            >
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border/30 gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-base font-bold border border-foreground px-2.5 py-0.5">
                    {rel.version}
                  </span>
                  <span className="font-mono text-xs uppercase px-2 py-0.5 bg-secondary text-secondary-foreground font-semibold">
                    {rel.tag}
                  </span>
                  <span className="text-lg font-medium uppercase tracking-wide">
                    {rel.title}
                  </span>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs opacity-50">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{rel.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <GitCommit className="w-3.5 h-3.5" />
                    <span>commit {rel.commit}</span>
                  </span>
                </div>
              </div>

              {/* Summary */}
              <p className="text-sm md:text-base text-muted-foreground mt-6 leading-relaxed">
                {rel.summary}
              </p>

              {/* Highlights List */}
              <div className="mt-8 pt-6 border-t border-border/20">
                <div className="font-mono text-[11px] uppercase opacity-40 mb-4">
                  [ENGINEERING HIGHLIGHTS & CHANGELOG]
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rel.highlights.map((item, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-2 text-xs text-foreground/80">
                      <span className="font-mono text-emerald-500 shrink-0">✓</span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
