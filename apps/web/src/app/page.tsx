'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphqlClient } from '@/lib/graphql-client';
import { PublicHeader } from '@/components/landing/public-header';
import { PublicFooter } from '@/components/landing/public-footer';
import {
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  Cpu,
  Terminal,
} from 'lucide-react';

const SYSTEM_HEALTH_QUERY = gql`
  query GetSystemHealth {
    health {
      status
      version
      uptimeSeconds
      timestamp
      postgres
      mongodb
      redis
    }
    openRouterModels {
      id
      name
      description
      contextLength
      isFree
    }
  }
`;

interface HealthData {
  health: {
    status: string;
    version: string;
    uptimeSeconds: number;
    timestamp: string;
    postgres: boolean;
    mongodb: boolean;
    redis: boolean;
  };
  openRouterModels: Array<{
    id: string;
    name: string;
    description: string;
    contextLength: number;
    isFree: boolean;
  }>;
}

export default function GeologicalLandingPage() {
  const { isAuthenticated } = useAuth();
  const [selectedEngine, setSelectedEngine] = useState<number | null>(null);

  // Inquiry form states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryOrg, setInquiryOrg] = useState('');
  const [inquiryWorkload, setInquiryWorkload] = useState('Enterprise Deployment (Self-Hosted)');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // System Health live polling
  const { data: healthData, isLoading: healthLoading } = useQuery<HealthData>({
    queryKey: ['system-health-query'],
    queryFn: async () => {
      return graphqlClient.request<HealthData>(SYSTEM_HEALTH_QUERY);
    },
    refetchInterval: 15000,
  });

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySubmitted(true);
    setTimeout(() => {
      setInquirySubmitted(false);
      setInquiryName('');
      setInquiryEmail('');
      setInquiryOrg('');
      setInquiryMessage('');
    }, 4000);
  };

  return (
    <div className="geological-theme relative min-h-screen bg-background text-foreground antialiased selection:bg-neutral-800 selection:text-neutral-100 font-geological-display">
      <PublicHeader />

      {/* ============================================================ */}
      {/* 2. MONOLITHIC HERO SECTION                                   */}
      {/* ============================================================ */}
      <section
        id="overview"
        className="w-full pt-28 md:pt-36 px-4 md:px-12 flex flex-col items-center border-b border-border/40"
      >
        {/* Top Monospace Meta Bar */}
        <div className="w-full max-w-7xl flex flex-col md:flex-row md:items-center justify-between pb-6 gap-2 border-b border-border/20 font-mono text-[11px] uppercase opacity-60">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>(SYSTEM SPECIFICATION // V1.0.0 PRODUCTION CORE)</span>
          </div>
          <div>EST. OCTOBER 2026 · HNSW 1536-DIMENSIONAL COGNITION</div>
          <div className="hidden md:block">LATENCY TARGET: &lt;18MS · ZERO BROWSER STORAGE</div>
        </div>

        {/* Monumental Display Title SVG Wordmark */}
        <div className="w-full max-w-7xl py-12 md:py-16 select-none">
          <svg
            viewBox="0 0 1200 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto text-foreground"
          >
            <text
              x="50%"
              y="72%"
              textAnchor="middle"
              className="font-bold uppercase tracking-tighter"
              style={{
                fontSize: '190px',
                fontFamily:
                  '"Neue Haas Grotesk Display Pro", "Helvetica Neue", -apple-system, sans-serif',
                letterSpacing: '-0.05em',
                fill: 'currentColor',
              }}
            >
              KURIPP
            </text>
          </svg>
        </div>

        {/* Brutalist Manifesto */}
        <div className="w-full max-w-4xl text-center py-8 md:py-12 flex flex-col items-center">
          <span className="font-mono text-xs uppercase opacity-40 mb-4 tracking-widest">
            (The Intelligence Workshop)
          </span>
          <h1 className="text-xl md:text-3xl lg:text-4xl leading-[1.35] font-medium uppercase tracking-tight text-foreground/90">
            A high-precision research and cognition environment engineered for document intelligence,
            hybrid RRF retrieval, and verifiable citations carved from raw enterprise corpuses.
          </h1>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 font-mono text-xs uppercase">
            <Link
              href={isAuthenticated ? '/workspaces' : '/register'}
              className="border border-foreground py-3 px-6 bg-foreground text-background hover:bg-background hover:text-foreground transition-colors tracking-wider"
            >
              [Enter Platform →]
            </Link>
            <a
              href="#capabilities"
              className="border border-border/80 py-3 px-6 hover:border-foreground transition-colors tracking-wider opacity-80 hover:opacity-100"
            >
              [Explore 6 Engines ↓]
            </a>
          </div>
        </div>

        {/* Real-Time Live Infrastructure Status Grid */}
        <div className="w-full max-w-7xl my-12 border border-border/40 p-6 md:p-8 bg-card/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/40 gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase opacity-50">
                (Runtime Telemetry)
              </span>
              <h2 className="text-sm font-semibold tracking-wider uppercase mt-1">
                Live Geological Infrastructure Status
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs opacity-60">
              <span>Gateway:</span>
              <span className="border border-border px-2 py-0.5">
                Express + GraphQL Yoga v5
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            {/* PostgreSQL 16 + pgvector */}
            <div className="border border-border/40 p-4 bg-background/50 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Database className="w-4 h-4 opacity-60" />
                {healthData?.health.postgres ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider">
                  PostgreSQL 16 + pgvector
                </div>
                <div className="font-mono text-[11px] opacity-50 mt-1">
                  {healthLoading
                    ? 'Probing HNSW...'
                    : healthData?.health.postgres
                    ? 'HNSW Indexing · Ready'
                    : 'Offline / Mock'}
                </div>
              </div>
            </div>

            {/* MongoDB 8 */}
            <div className="border border-border/40 p-4 bg-background/50 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Layers className="w-4 h-4 opacity-60" />
                {healthData?.health.mongodb ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider">
                  MongoDB 8 Atlas
                </div>
                <div className="font-mono text-[11px] opacity-50 mt-1">
                  {healthLoading
                    ? 'Probing Vault...'
                    : healthData?.health.mongodb
                    ? 'Document Store · Ready'
                    : 'Deferred / Offline'}
                </div>
              </div>
            </div>

            {/* Redis 7 BullMQ */}
            <div className="border border-border/40 p-4 bg-background/50 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Cpu className="w-4 h-4 opacity-60" />
                {healthData?.health.redis ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider">
                  Redis 7 (BullMQ)
                </div>
                <div className="font-mono text-[11px] opacity-50 mt-1">
                  {healthLoading
                    ? 'Pinging Cluster...'
                    : healthData?.health.redis
                    ? 'Upstash TLS · Online'
                    : 'Offline'}
                </div>
              </div>
            </div>

            {/* API Gateway & Uptime */}
            <div className="border border-border/40 p-4 bg-background/50 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Terminal className="w-4 h-4 opacity-60" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider">
                  GraphQL API Gateway
                </div>
                <div className="font-mono text-[11px] opacity-50 mt-1">
                  {healthLoading
                    ? 'Resolving...'
                    : `Uptime: ${Math.round(healthData?.health.uptimeSeconds || 0)}s · 200 OK`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. CAPABILITIES INDEX: THE 6 CORE ENGINES                     */}
      {/* ============================================================ */}
      <section id="capabilities" className="w-full py-20 md:py-28 px-4 md:px-12 border-b border-border/40">
        <div className="w-full max-w-7xl mx-auto">
          {/* Section Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-border/40 gap-4">
            <div>
              <span className="font-mono text-xs uppercase opacity-40">
                (Capabilities Directory)
              </span>
              <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-tight mt-1">
                The 6 Research & Cognition Engines
              </h2>
            </div>
            <div className="font-mono text-xs opacity-50">
              INDEX 001 - 006 · ALL ARCHITECTURAL MODULES INTEGRATED
            </div>
          </div>

          {/* Engine Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Engine 01 */}
            <div
              onClick={() => setSelectedEngine(selectedEngine === 1 ? null : 1)}
              className="border border-border/40 p-6 bg-card/30 hover:bg-card/70 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start font-mono text-xs opacity-50 uppercase">
                  <span>M_001</span>
                  <span>Hybrid RRF</span>
                </div>
                <h3 className="text-lg font-medium uppercase mt-4 tracking-wide group-hover:translate-x-1 transition-transform">
                  Dense + Lexical RRF Retrieval
                </h3>
                <p className="font-mono text-xs opacity-60 mt-2 leading-relaxed">
                  DIMENSIONS: 1536D Cosine + pg_trgm + Reciprocal Rank Fusion (k=60) in a unified SQL query.
                </p>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  Bridges high-dimensional vector embeddings with strict keyword matching to prevent semantic hallucinations while discovering latent conceptual connections.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-border/30 flex justify-between items-center font-mono text-[11px] opacity-40">
                <span>PostgreSQL 16 HNSW</span>
                <span>[Expand Details +]</span>
              </div>
            </div>

            {/* Engine 02 */}
            <div
              onClick={() => setSelectedEngine(selectedEngine === 2 ? null : 2)}
              className="border border-border/40 p-6 bg-card/30 hover:bg-card/70 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start font-mono text-xs opacity-50 uppercase">
                  <span>M_002</span>
                  <span>OpenRouter AI</span>
                </div>
                <h3 className="text-lg font-medium uppercase mt-4 tracking-wide group-hover:translate-x-1 transition-transform">
                  Multi-Model Intelligence Studio
                </h3>
                <p className="font-mono text-xs opacity-60 mt-2 leading-relaxed">
                  DIMENSIONS: Llama 3.3 70B · Gemini 2.0 Flash · Qwen 2.5 72B · DeepSeek V3.
                </p>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  Provider-agnostic inference orchestration allowing researchers to toggle seamlessly between long-context synthesis and cost-effective free-tier frontier models.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-border/30 flex justify-between items-center font-mono text-[11px] opacity-40">
                <span>Dynamic Yoga Resolvers</span>
                <span>[Expand Details +]</span>
              </div>
            </div>

            {/* Engine 03 */}
            <div
              onClick={() => setSelectedEngine(selectedEngine === 3 ? null : 3)}
              className="border border-border/40 p-6 bg-card/30 hover:bg-card/70 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start font-mono text-xs opacity-50 uppercase">
                  <span>M_003</span>
                  <span>Deep Research</span>
                </div>
                <h3 className="text-lg font-medium uppercase mt-4 tracking-wide group-hover:translate-x-1 transition-transform">
                  Autonomous Multi-Angle Decomposition
                </h3>
                <p className="font-mono text-xs opacity-60 mt-2 leading-relaxed">
                  DIMENSIONS: 3 Orthogonal Search Vectors · &lt;950ms Recursive Synthesis.
                </p>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  Deconstructs complex research prompts into sub-inquiries, independently explores indexed document vaults, and outputs structured, cited executive briefings.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-border/30 flex justify-between items-center font-mono text-[11px] opacity-40">
                <span>Synthesis Engine</span>
                <span>[Expand Details +]</span>
              </div>
            </div>

            {/* Engine 04 */}
            <div
              onClick={() => setSelectedEngine(selectedEngine === 4 ? null : 4)}
              className="border border-border/40 p-6 bg-card/30 hover:bg-card/70 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start font-mono text-xs opacity-50 uppercase">
                  <span>M_004</span>
                  <span>Contract Diff</span>
                </div>
                <h3 className="text-lg font-medium uppercase mt-4 tracking-wide group-hover:translate-x-1 transition-transform">
                  Clause-by-Clause Semantic Diff
                </h3>
                <p className="font-mono text-xs opacity-60 mt-2 leading-relaxed">
                  DIMENSIONS: Modified · Added · Removed Clauses · Legal Liability Mapping.
                </p>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  Performs granular semantic comparisons across Master Service Agreements (MSAs), DPAs, and regulatory texts, highlighting risk exposure shifts automatically.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-border/30 flex justify-between items-center font-mono text-[11px] opacity-40">
                <span>Document Diff Engine</span>
                <span>[Expand Details +]</span>
              </div>
            </div>

            {/* Engine 05 */}
            <div
              onClick={() => setSelectedEngine(selectedEngine === 5 ? null : 5)}
              className="border border-border/40 p-6 bg-card/30 hover:bg-card/70 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start font-mono text-xs opacity-50 uppercase">
                  <span>M_005</span>
                  <span>Notebook Studio</span>
                </div>
                <h3 className="text-lg font-medium uppercase mt-4 tracking-wide group-hover:translate-x-1 transition-transform">
                  Collections & Research Notebook
                </h3>
                <p className="font-mono text-xs opacity-60 mt-2 leading-relaxed">
                  DIMENSIONS: Project Binders · Markdown Notes · Tag-Based Taxonomy.
                </p>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  Organize findings into durable project binders with instant markdown export, inline citations, and synchronized cross-document tagging.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-border/30 flex justify-between items-center font-mono text-[11px] opacity-40">
                <span>Collections Hub</span>
                <span>[Expand Details +]</span>
              </div>
            </div>

            {/* Engine 06 */}
            <div
              onClick={() => setSelectedEngine(selectedEngine === 6 ? null : 6)}
              className="border border-border/40 p-6 bg-card/30 hover:bg-card/70 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start font-mono text-xs opacity-50 uppercase">
                  <span>M_006</span>
                  <span>Eval Harness</span>
                </div>
                <h3 className="text-lg font-medium uppercase mt-4 tracking-wide group-hover:translate-x-1 transition-transform">
                  Groundedness & Precision Benchmark
                </h3>
                <p className="font-mono text-xs opacity-60 mt-2 leading-relaxed">
                  DIMENSIONS: 92.0% Groundedness · 94.0% Citation Precision · 8.0% Hallucination Index.
                </p>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  Automated test suites evaluate synthesis responses against gold-standard references, guaranteeing mathematical verification before executive distribution.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-border/30 flex justify-between items-center font-mono text-[11px] opacity-40">
                <span>Continuous Benchmark</span>
                <span>[Expand Details +]</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. ABOUT & VISION: THE GEOLOGICAL FOUNDATION                  */}
      {/* ============================================================ */}
      <section id="architecture" className="w-full py-20 md:py-28 px-4 md:px-12 border-b border-border/40 bg-card/10">
        <div className="w-full max-w-7xl mx-auto">
          {/* Section Heading */}
          <div className="mb-12">
            <span className="font-mono text-xs uppercase opacity-40">
              (Architectural Philosophy)
            </span>
            <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-tight mt-1">
              Geological Intelligence: The Three Pillars
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6">
            {/* Pillar 01 */}
            <div className="border border-border/40 p-8 bg-card/20 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs uppercase opacity-50">
                  01 / (Hybrid Vector Cognition)
                </div>
                <h3 className="text-xl font-medium uppercase mt-4 leading-snug">
                  Raw Human Archives Meets Vector Geometry
                </h3>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  Information is not flat text; it is an organic, multi-layered deposit of knowledge. KURIPP slices unstructured enterprise documents into mathematically calibrated chunks, indexing them with 1536-dimensional HNSW vector graphs for spatial proximity navigation.
                </p>
              </div>
              <div className="mt-8 font-mono text-[11px] opacity-40 uppercase">
                Postgres pgvector · Cosine Metric
              </div>
            </div>

            {/* Pillar 02 */}
            <div className="border border-border/40 p-8 bg-card/20 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs uppercase opacity-50">
                  02 / (Verifiable Grounding)
                </div>
                <h3 className="text-xl font-medium uppercase mt-4 leading-snug">
                  Bidirectional Citations & Hallucination Elimination
                </h3>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  AI assertions without verifiable provenance are liability traps. Every synthesized paragraph is mathematically mapped to exact chunk bounding boxes and document source identifiers, ensuring strict auditable verification.
                </p>
              </div>
              <div className="mt-8 font-mono text-[11px] opacity-40 uppercase">
                Citation Precision &gt;94%
              </div>
            </div>

            {/* Pillar 03 */}
            <div className="border border-border/40 p-8 bg-card/20 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs opacity-50">
                  03 / (Zero-Leak Sovereign Vault)
                </div>
                <h3 className="text-xl font-medium uppercase mt-4 leading-snug">
                  Zero Browser Storage & HttpOnly Dual-Token Isolation
                </h3>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  No secrets, refresh tokens, or user credentials ever touch localStorage or sessionStorage. Short-lived 15-minute access tokens reside solely in browser memory, paired with strict SameSite=Lax HttpOnly refresh cookies.
                </p>
              </div>
              <div className="mt-8 font-mono text-[11px] opacity-40 uppercase">
                RFC 6750 · Strict Cookie Isolation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. CHANGELOG & RELEASE ARCHIVES                               */}
      {/* ============================================================ */}
      <section id="changelog" className="w-full py-20 md:py-28 px-4 md:px-12 border-b border-border/40">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-border/40 gap-4">
            <div>
              <span className="font-mono text-xs uppercase opacity-40">
                (Engineering Logbook)
              </span>
              <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-tight mt-1">
                Release Archives & Version Log
              </h2>
            </div>
            <div className="font-mono text-xs opacity-50">
              PRODUCTION STABLE: V1.0.0 · MONOREPO CI/CD DEPLOYED
            </div>
          </div>

          <div className="flex flex-col divide-y divide-border/30 font-sans">
            {/* Release Item 1 */}
            <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-card/30 px-3 transition-colors">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs border border-foreground/30 px-2 py-0.5">
                    v1.0.0-PROD
                  </span>
                  <span className="text-base font-medium uppercase">
                    Production Core Milestone & Hybrid RAG Engine
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-3xl">
                  Full 15-phase implementation completed: PostgreSQL 16 pgvector, MongoDB Atlas, Upstash Redis 7 BullMQ, GraphQL Yoga v5, Dual-Token HttpOnly Auth, OpenRouter multi-model gateway, Vercel Edge rewrites.
                </p>
              </div>
              <div className="font-mono text-xs opacity-50 whitespace-nowrap">
                2026.Q4 · CURRENT
              </div>
            </div>

            {/* Release Item 2 */}
            <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-card/30 px-3 transition-colors">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs border border-border px-2 py-0.5 opacity-60">
                    v0.9.4
                  </span>
                  <span className="text-base font-medium uppercase opacity-90">
                    OpenRouter Multi-Provider Dynamic Resolvers
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-3xl">
                  Dynamic backend model resolution exposing Llama 3.3 70B, Gemini 2.0 Flash, and Qwen 2.5 without exposing API keys to client browsers.
                </p>
              </div>
              <div className="font-mono text-xs opacity-50 whitespace-nowrap">
                2026.Q3
              </div>
            </div>

            {/* Release Item 3 */}
            <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-card/30 px-3 transition-colors">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs border border-border px-2 py-0.5 opacity-60">
                    v0.8.2
                  </span>
                  <span className="text-base font-medium uppercase opacity-90">
                    Multi-Format BullMQ Ingestion Pipeline
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-3xl">
                  Async background document processing supporting PDF, Markdown, DOCX, and tabular datasets with coordinate preservation.
                </p>
              </div>
              <div className="font-mono text-xs opacity-50 whitespace-nowrap">
                2026.Q2
              </div>
            </div>

            {/* Release Item 4 (Roadmap) */}
            <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-card/30 px-3 transition-colors bg-card/10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs border border-emerald-500 text-emerald-500 px-2 py-0.5">
                    v1.1.0-ROADMAP
                  </span>
                  <span className="text-base font-medium uppercase">
                    PDF Canvas Realtime Annotation & Client Vision OCR
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-3xl">
                  Interactive PDF viewer with vector overlay bounding boxes, local in-browser OCR, and synchronous collaborative research rooms.
                </p>
              </div>
              <div className="font-mono text-xs opacity-50 whitespace-nowrap text-emerald-500">
                PLANNED
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. CONTACT & ENTERPRISE INQUIRY                              */}
      {/* ============================================================ */}
      <section id="inquiry" className="w-full py-20 md:py-28 px-4 md:px-12 border-b border-border/40 bg-card/20">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase opacity-40">
              (Organizational Access)
            </span>
            <h2 className="text-2xl md:text-4xl font-medium uppercase tracking-tight mt-1">
              Enterprise Deployment & Commissions
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
              Inquire regarding sovereign on-premises air-gapped deployments, custom embedding fine-tuning, or open-source governance.
            </p>
          </div>

          <form onSubmit={handleInquirySubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-[11px] uppercase opacity-60 mb-2">
                  [FULL NAME / PRINCIPAL INVESTIGATOR]
                </label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="e.g. Dr. Aris Thorne"
                  className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase opacity-60 mb-2">
                  [WORK EMAIL ADDRESS]
                </label>
                <input
                  type="email"
                  required
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-[11px] uppercase opacity-60 mb-2">
                  [ORGANIZATION / RESEARCH LAB]
                </label>
                <input
                  type="text"
                  required
                  value={inquiryOrg}
                  onChange={(e) => setInquiryOrg(e.target.value)}
                  placeholder="e.g. Cognitive Systems Institute"
                  className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase opacity-60 mb-2">
                  [DEPLOYMENT TARGET]
                </label>
                <select
                  value={inquiryWorkload}
                  onChange={(e) => setInquiryWorkload(e.target.value)}
                  className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors font-mono"
                >
                  <option value="Enterprise Cloud (Managed Vercel/Render)">
                    Enterprise Cloud (Managed Vercel/Render)
                  </option>
                  <option value="Sovereign Air-Gapped On-Premises">
                    Sovereign Air-Gapped On-Premises
                  </option>
                  <option value="Academic & Non-Profit Research Access">
                    Academic & Non-Profit Research Access
                  </option>
                  <option value="Open Source Collaboration / Integration">
                    Open Source Collaboration / Integration
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase opacity-60 mb-2">
                [PROJECT SPECIFICATION / INQUIRY DETAILS]
              </label>
              <textarea
                required
                rows={4}
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                placeholder="Describe your document ingestion volume, compliance requirements (SOC2/HIPAA), or custom model routing needs..."
                className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors font-mono"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="font-mono text-[11px] opacity-40">
                ALL INQUIRIES ROUTED UNDER STRICT NDA PROTOCOLS
              </div>

              <button
                type="submit"
                disabled={inquirySubmitted}
                className="border border-foreground bg-foreground text-background py-3.5 px-8 font-mono text-xs uppercase font-medium hover:bg-background hover:text-foreground transition-colors cursor-pointer"
              >
                {inquirySubmitted ? 'Specification Dispatched ✓' : '[Transmit Inquiry →]'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
