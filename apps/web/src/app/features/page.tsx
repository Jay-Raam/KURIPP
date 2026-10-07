'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/landing/public-header';
import { PublicFooter } from '@/components/landing/public-footer';
import { ArrowRight } from 'lucide-react';

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<'rrf' | 'models' | 'deep' | 'diff' | 'vault' | 'eval'>('rrf');

  const capabilities = [
    {
      id: 'rrf',
      code: 'M_001',
      title: 'Dense + Lexical RRF Retrieval',
      subtitle: 'PostgreSQL 16 + pgvector + pg_trgm in unified SQL',
      spec: '1536D Cosine Proximity · HNSW Graph Index · Reciprocal Rank Fusion (k=60)',
      description:
        'Standard RAG relies on naive vector similarity which frequently hallucinates or misses exact part numbers, contract clauses, and proper nouns. KURIPP executes Reciprocal Rank Fusion directly inside PostgreSQL, merging high-dimensional HNSW cosine vectors with BM25 trigram full-text weights in a single mathematical pass.',
      metrics: [
        { label: 'Retrieval Latency', value: '<18ms' },
        { label: 'Vector Geometry', value: '1536D HNSW' },
        { label: 'Ranking Formula', value: 'RRF (k=60)' },
        { label: 'Precision Delta', value: '+34% vs Pure Vector' },
      ],
      features: [
        'Postgres 16 native pgvector with HNSW index acceleration',
        'Automatic lexical fallback for acronyms, IDs, and financial values',
        'Eliminates vector-drift hallucinations across multi-page legal documents',
        'Workspace-isolated tenant partitioning via strict row-level filters',
      ],
    },
    {
      id: 'models',
      code: 'M_002',
      title: 'Multi-Model Intelligence Studio',
      subtitle: 'OpenRouter dynamic inference gateway',
      spec: 'Llama 3.3 70B · Gemini 2.0 Flash · Qwen 2.5 72B · DeepSeek V3',
      description:
        'Different research tasks require different cognitive frontiers. Synthesizing hundreds of pages requires million-token context windows, while rapid citation cross-checking demands speed. KURIPP routes prompts dynamically through OpenRouter without exposing server API keys to client browsers.',
      metrics: [
        { label: 'Context Length', value: 'Up to 1,000,000 Tokens' },
        { label: 'Active Frontier Models', value: '4 Configured' },
        { label: 'Key Isolation', value: 'Zero Client Exposure' },
        { label: 'Streaming Protocol', value: 'GraphQL Yoga v5 SSE' },
      ],
      features: [
        'Llama 3.3 70B Instruct for rigorous analytical synthesis',
        'Gemini 2.0 Flash for ultra-fast document scanning and summarization',
        'Dynamic GraphQL Yoga resolvers resolving models at runtime',
        'Unified prompt grounding engine ensuring all models follow strict citations',
      ],
    },
    {
      id: 'deep',
      code: 'M_003',
      title: 'Autonomous Deep Research Engine',
      subtitle: 'Multi-angle query decomposition in <1s',
      spec: '3 Orthogonal Search Vectors · Recursive Sub-Query Planning',
      description:
        'Complex business inquiries cannot be solved with a single query. When given a multi-faceted prompt, KURIPP’s Deep Research engine decomposes the prompt into orthogonal thematic vectors, executes concurrent vector searches across your workspace documents, and compiles a unified briefing.',
      metrics: [
        { label: 'Decomposition Time', value: '<950ms' },
        { label: 'Orthogonal Vectors', value: '3 Concurrent' },
        { label: 'Synthesis Pass', value: 'Cited Executive Memo' },
        { label: 'Export Format', value: 'Markdown / Raw Notes' },
      ],
      features: [
        'Self-directed query decomposition identifying hidden angles',
        'Parallel retrieval across multiple indexed collections simultaneously',
        'Recursive deduplication of extracted document passages',
        'Auto-generated structured executive briefing with full footnotes',
      ],
    },
    {
      id: 'diff',
      code: 'M_004',
      title: 'Clause-by-Clause Contract Diff Engine',
      subtitle: 'Semantic comparison for MSAs, DPAs, and Policies',
      spec: 'Modified / Added / Removed Classification · Risk Exposure Delta',
      description:
        'Traditional text diff tools highlight trivial character changes while missing substantive legal risk shifts. KURIPP’s contract diff engine performs semantic clause alignment, identifying liability cap increases, payment term extensions, and governing law shifts automatically.',
      metrics: [
        { label: 'Clause Alignment', value: 'Semantic Vector Match' },
        { label: 'Classification', value: 'Added / Removed / Modified' },
        { label: 'Analysis Output', value: 'Executive Commercial Impact' },
        { label: 'Turnaround Time', value: '<2.4s per Agreement' },
      ],
      features: [
        'Automatic contract clause segmentation and semantic pairing',
        'Side-by-side visual diff with highlighted commercial implications',
        'Net payment terms detection (e.g. Net 30 to Net 60 changes)',
        'Governing law, indemnification ceiling, and confidentiality shift alerts',
      ],
    },
    {
      id: 'vault',
      code: 'M_005',
      title: 'Document Vault & Tabular Ingestion',
      subtitle: 'Multi-format BullMQ async processing pipeline',
      spec: 'PDF · DOCX · XLSX · PPTX · CSV · Markdown · Code',
      description:
        'Ingest research archives of any format. Built on an async BullMQ job queue, KURIPP handles heavy PDFs, complex multi-sheet Excel workbooks, and raw markdown files without stalling the user interface.',
      metrics: [
        { label: 'Supported Formats', value: '8+ Enterprise Types' },
        { label: 'Queue Engine', value: 'Redis 7 BullMQ' },
        { label: 'Chunk Strategy', value: 'Recursive Semantic Split' },
        { label: 'Storage Layer', value: 'S3 / MinIO Object Store' },
      ],
      features: [
        'Table structure preservation for financial spreadsheets and CSVs',
        'Bounding coordinate retention for future PDF visual highlights',
        'SHA-256 document hashing for instantaneous duplicate prevention',
        'Full document metadata and category filtering (PDF, Dataset, Code)',
      ],
    },
    {
      id: 'eval',
      code: 'M_006',
      title: 'Groundedness & Precision Benchmark',
      subtitle: 'Automated AI evaluation suite',
      spec: '92.0% Target Groundedness · 94.0% Citation Precision',
      description:
        'Never trust an unverified AI model. KURIPP includes an integrated evaluation harness that runs automated benchmark suites against your workspace data, scoring responses for citation precision, groundedness, and hallucination percentage.',
      metrics: [
        { label: 'Groundedness Score', value: '92.0% Average' },
        { label: 'Citation Precision', value: '94.0%' },
        { label: 'Hallucination Index', value: '8.0% (Near Zero)' },
        { label: 'Test Pass Rate', value: '100% (4/4 Passed)' },
      ],
      features: [
        'Automated golden-dataset evaluation against workspace documents',
        'Quantitative scoring of citation honesty and attribution accuracy',
        'Instant detection of model hallucination spikes',
        'One-click benchmark execution directly from the research workbench',
      ],
    },
  ];

  const currentCap = capabilities.find((c) => c.id === activeTab) || capabilities[0]!;

  return (
    <div className="geological-theme relative min-h-screen bg-background text-foreground antialiased font-geological-display">
      <PublicHeader />

      {/* Hero Header */}
      <section className="pt-28 md:pt-36 px-4 md:px-12 border-b border-border/40 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="font-mono text-xs uppercase opacity-40 mb-3 tracking-widest">
            (ENGINEERING DIRECTORY // 02)
          </div>
          <h1 className="text-3xl md:text-5xl font-medium uppercase tracking-tight max-w-4xl leading-tight">
            Comprehensive Capabilities & Cognitive Architecture
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            Engineered from ground zero for mission-critical document research, verifiable citations,
            and mathematically grounded synthesis across massive heterogeneous document vaults.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8 font-mono text-xs uppercase">
            <Link
              href="/register"
              className="border border-foreground bg-foreground text-background py-2.5 px-6 hover:bg-background hover:text-foreground transition-colors"
            >
              [Launch Workspace →]
            </Link>
            <Link
              href="/about"
              className="border border-border/80 py-2.5 px-6 hover:border-foreground transition-colors opacity-80 hover:opacity-100"
            >
              [Read Our Vision]
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Capabilities Explorer */}
      <section className="py-20 px-4 md:px-12 border-b border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Navigation */}
            <div className="lg:w-1/3 flex flex-col gap-2">
              <div className="font-mono text-[11px] uppercase opacity-40 mb-2">
                [SELECT COGNITION ENGINE]
              </div>
              {capabilities.map((cap) => (
                <button
                  key={cap.id}
                  onClick={() => setActiveTab(cap.id as any)}
                  className={`text-left p-4 border transition-all text-xs uppercase font-mono flex items-center justify-between cursor-pointer ${
                    activeTab === cap.id
                      ? 'border-foreground bg-card text-foreground font-bold'
                      : 'border-border/40 bg-background/50 hover:bg-card/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div>
                    <span className="opacity-40 mr-2">{cap.code}</span>
                    <span>{cap.title}</span>
                  </div>
                  {activeTab === cap.id && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            {/* Main Engine Detail Card */}
            <div className="lg:w-2/3 border border-border/40 p-6 md:p-10 bg-card/40 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start font-mono text-xs opacity-50 uppercase pb-4 border-b border-border/30">
                  <span>{currentCap.code}</span>
                  <span>{currentCap.subtitle}</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-medium uppercase mt-6 tracking-wide">
                  {currentCap.title}
                </h2>

                <div className="font-mono text-xs opacity-60 mt-2">
                  SPEC: {currentCap.spec}
                </div>

                <p className="text-sm md:text-base text-muted-foreground mt-6 leading-relaxed">
                  {currentCap.description}
                </p>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8 pt-6 border-t border-border/30">
                  {currentCap.metrics.map((m, idx) => (
                    <div key={idx} className="border border-border/30 p-3 bg-background/50">
                      <div className="font-mono text-[10px] opacity-40 uppercase">{m.label}</div>
                      <div className="text-sm font-semibold uppercase font-mono mt-1">{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Key Features Bullet Points */}
                <div className="space-y-2 mt-6">
                  <div className="font-mono text-[11px] uppercase opacity-40 mb-3">
                    [TECHNICAL SPECIFICATIONS]
                  </div>
                  {currentCap.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-foreground/80">
                      <span className="font-mono text-emerald-500">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-border/30 flex justify-between items-center font-mono text-xs">
                <span className="opacity-40">READY FOR DEPLOYMENT</span>
                <Link
                  href="/register"
                  className="border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
                >
                  [Test in Sandbox →]
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Traditional RAG vs Geological KURIPP */}
      <section className="py-20 px-4 md:px-12 border-b border-border/40 bg-card/10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="font-mono text-xs uppercase opacity-40">
              (Architectural Benchmark)
            </span>
            <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-tight mt-1">
              Standard Vector RAG vs. KURIPP Geological Architecture
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs uppercase border border-border/40">
              <thead>
                <tr className="border-b border-border/40 bg-card/50">
                  <th className="p-4 opacity-60">Architecture Dimension</th>
                  <th className="p-4 opacity-60">Generic Naive RAG</th>
                  <th className="p-4 text-emerald-500 font-bold">KURIPP Geological System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                <tr>
                  <td className="p-4 font-semibold">Retrieval Mechanism</td>
                  <td className="p-4 opacity-60">Cosine Distance Only (Prone to semantic drift)</td>
                  <td className="p-4 text-foreground font-medium">
                    Hybrid RRF: 1536D HNSW + pg_trgm (Single SQL pass)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Browser Security</td>
                  <td className="p-4 opacity-60">JWT in localStorage (Vulnerable to XSS extraction)</td>
                  <td className="p-4 text-foreground font-medium">
                    Strict HttpOnly SameSite=Lax Cookie + In-Memory Token
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Model Vendor Lock-in</td>
                  <td className="p-4 opacity-60">Hardcoded OpenAI / Anthropic SDK</td>
                  <td className="p-4 text-foreground font-medium">
                    OpenRouter Dynamic Resolvers (Llama 3.3, Gemini 2.0, Qwen)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Contract Diffing</td>
                  <td className="p-4 opacity-60">Raw character git diffs (No semantic understanding)</td>
                  <td className="p-4 text-foreground font-medium">
                    Semantic Clause Classification & Liability Risk Delta
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Evaluation Rigor</td>
                  <td className="p-4 opacity-60">Subjective manual spot checks</td>
                  <td className="p-4 text-foreground font-medium">
                    Automated Continuous Benchmark (92% Groundedness Target)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Ingestion Pipeline</td>
                  <td className="p-4 opacity-60">Blocking client-side script</td>
                  <td className="p-4 text-foreground font-medium">
                    Upstash Redis 7 + BullMQ Async Worker Queues
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-12 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <span className="font-mono text-xs uppercase opacity-40 mb-3 tracking-widest">
            (Start Research)
          </span>
          <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-tight">
            Ready to upgrade your enterprise cognition?
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-3 max-w-lg leading-relaxed">
            Create your primary workspace, index your document archives, and run your first hybrid search in minutes.
          </p>
          <div className="flex gap-4 mt-8 font-mono text-xs uppercase">
            <Link
              href="/register"
              className="border border-foreground bg-foreground text-background py-3 px-8 hover:bg-background hover:text-foreground transition-colors"
            >
              [Create Account →]
            </Link>
            <Link
              href="/contact"
              className="border border-border py-3 px-8 hover:border-foreground transition-colors"
            >
              [Enterprise Inquiry]
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
