'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphqlClient } from '@/lib/graphql-client';
import { useTheme } from '@/components/providers';
import {
  FileText,
  Search,
  Cpu,
  Layers,
  Terminal,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';

const HEALTH_AND_MODELS_QUERY = gql`
  query GetSystemHealthAndModels {
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

export default function HomePage() {
  const { theme, setTheme } = useTheme();

  const { data, isLoading } = useQuery<HealthData>({
    queryKey: ['system-health-and-models'],
    queryFn: async () => {
      return graphqlClient.request<HealthData>(HEALTH_AND_MODELS_QUERY);
    },
    refetchInterval: 15000,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Editorial Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <span className="flex h-7 w-7 items-center justify-center rounded border border-border bg-card font-mono text-xs font-semibold tracking-wider">
              K
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-sm font-bold tracking-tight">KURIPP</span>
              <span className="text-xs text-muted-foreground font-mono">v0.1.0</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 border border-border rounded px-2.5 py-1 text-xs text-muted-foreground font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>GraphQL Only: /graphql</span>
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-foreground transition-colors hover:bg-secondary"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            <a
              href="#workspace-preview"
              className="inline-flex h-8 items-center justify-center rounded border border-border bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-neutral-800 dark:hover:bg-neutral-200"
            >
              Enter Workspace
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto flex max-w-7xl flex-1 flex-col px-6 py-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 rounded border border-border bg-secondary/50 px-2.5 py-1 text-xs font-mono text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Zero Browser Storage Security · Strict HttpOnly Dual-Token</span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            AI Knowledge & Research Platform.
          </h1>

          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            A production-grade full-stack workspace engineered for document intelligence,
            hybrid semantic search, verifiable citations, and multi-document synthesis.
          </p>
        </div>

        {/* Live System Architecture Status Bar */}
        <section className="my-10 border border-border rounded-lg bg-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
            <div>
              <h2 className="text-sm font-semibold tracking-wide">Live Infrastructure Status</h2>
              <p className="text-xs text-muted-foreground">
                Verified via GraphQL Yoga resolver query at runtime
              </p>
            </div>
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="text-muted-foreground">Gateway:</span>
              <span className="rounded bg-secondary px-2 py-0.5">Express + GraphQL Yoga v5</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4">
            <div className="flex items-center space-x-3 p-3 rounded border border-border bg-secondary/30">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs font-medium">PostgreSQL 16 + pgvector</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {isLoading ? 'Checking...' : data?.health.postgres ? 'Online (Ready)' : 'Offline / Mock'}
                </div>
              </div>
              {data?.health.postgres ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </div>

            <div className="flex items-center space-x-3 p-3 rounded border border-border bg-secondary/30">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs font-medium">MongoDB 7</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {isLoading ? 'Checking...' : data?.health.mongodb ? 'Online (Ready)' : 'Deferred'}
                </div>
              </div>
              {data?.health.mongodb ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </div>

            <div className="flex items-center space-x-3 p-3 rounded border border-border bg-secondary/30">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs font-medium">Redis 7 (BullMQ)</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {isLoading ? 'Checking...' : data?.health.redis ? 'Online (Ready)' : 'Offline'}
                </div>
              </div>
              {data?.health.redis ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </div>

            <div className="flex items-center space-x-3 p-3 rounded border border-border bg-secondary/30">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs font-medium">API Gateway</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {isLoading ? 'Checking...' : data?.health ? `Uptime: ${Math.round(data.health.uptimeSeconds)}s` : 'Offline'}
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
        </section>

        {/* AI Model Architecture: OpenRouter Integration */}
        <section className="mb-10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-wide">
                Configured OpenRouter AI Models
              </h2>
              <p className="text-xs text-muted-foreground">
                Dynamically resolved from backend configuration without exposing API keys
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Provider: OpenRouter API
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.openRouterModels || []).map((model) => (
              <div
                key={model.id}
                className="border border-border rounded-lg bg-card p-4 transition-colors hover:border-neutral-700"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="font-mono text-xs font-semibold">{model.name}</span>
                  {model.isFree && (
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      FREE TIER
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {model.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-mono border-t border-border/60 pt-2">
                  <span>Context: {model.contextLength.toLocaleString()} tokens</span>
                  <span className="text-foreground/80">{model.id}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3-Column Workspace Preview Anchor */}
        <section id="workspace-preview" className="space-y-4">
          <div className="border border-border rounded-lg bg-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Editorial Workspace Core</h3>
                <p className="text-xs text-muted-foreground">
                  Three-column research workbench designed for deep document cognition
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="border border-border rounded px-2 py-0.5">Ask</span>
                <span className="border border-border rounded px-2 py-0.5 bg-secondary">Research</span>
                <span className="border border-border rounded px-2 py-0.5">Analyze</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs font-medium">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Document Vault</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Async pipeline supporting PDF, DOCX, XLSX, PPTX, CSV, and Markdown. Preserves
                  page bounds, headings, and tables.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs font-medium">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span>Hybrid RRF Retrieval</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  PostgreSQL 17 HNSW dense cosine vectors fused with tsvector lexical search via
                  single-query Reciprocal Rank Fusion (k=60).
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs font-medium">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Verified Citations</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Source attribution down to exact document, page, and chunk excerpt. In-memory
                  security prevents token leakage.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground font-mono">
        KURIPP — AI Knowledge & Research Platform · MIT License · Clean Monorepo Architecture
      </footer>
    </div>
  );
}
