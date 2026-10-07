'use client';

import React, { useState } from 'react';
import { PublicHeader } from '@/components/landing/public-header';
import { PublicFooter } from '@/components/landing/public-footer';
import { ArrowUpRight } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [deploymentTarget, setDeploymentTarget] = useState('Enterprise Cloud (Managed)');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setOrganization('');
      setMessage('');
    }, 4000);
  };

  return (
    <div className="geological-theme relative min-h-screen bg-background text-foreground antialiased font-geological-display">
      <PublicHeader />

      {/* Hero Header */}
      <section className="pt-28 md:pt-36 px-4 md:px-12 border-b border-border/40 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="font-geological-mono text-xs uppercase opacity-40 mb-3 tracking-widest">
            (ORGANIZATIONAL CHANNELS // 05)
          </div>
          <h1 className="text-3xl md:text-5xl font-medium uppercase tracking-tight max-w-4xl leading-tight">
            Enterprise Inquiries & Research Access
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            Connect directly with the engineering team for sovereign on-premises deployments, custom embedding fine-tuning, or academic research access.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-20 px-4 md:px-12 border-b border-border/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-12">
          {/* Left Column: Coordinates & Channels */}
          <div className="space-y-10">
            <div>
              <span className="font-geological-mono text-xs uppercase opacity-40 block mb-2">
                (Engineering Telemetry)
              </span>
              <h2 className="text-xl md:text-2xl font-medium uppercase tracking-tight">
                Global Provenance
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-2 leading-relaxed">
                KURIPP is architected with a decentralized open-source heritage, anchored in southern India and running across globally distributed edge nodes.
              </p>
            </div>

            {/* Location Cards */}
            <div className="space-y-4">
              <div className="border border-border/40 p-5 bg-card/30">
                <div className="font-geological-mono text-[10px] opacity-40 uppercase">
                  [LOCATION 01 · PRIMARY ARCHITECTURE LAB]
                </div>
                <div className="text-base font-semibold uppercase mt-1">Chennai, Tamil Nadu, IN</div>
                <div className="font-geological-mono text-xs opacity-50 mt-1">
                  LAT 13.0827° N, 80.2707° E · TIMEZONE IST (UTC+5:30)
                </div>
              </div>

              <div className="border border-border/40 p-5 bg-card/30">
                <div className="font-geological-mono text-[10px] opacity-40 uppercase">
                  [LOCATION 02 · EDGE INFERENCE CLUSTER]
                </div>
                <div className="text-base font-semibold uppercase mt-1">AWS ap-northeast-2 (Seoul)</div>
                <div className="font-geological-mono text-xs opacity-50 mt-1">
                  SUPABASE POSTGRESQL 16 · PGVECTOR HNSW POOLER
                </div>
              </div>

              <div className="border border-border/40 p-5 bg-card/30">
                <div className="font-geological-mono text-[10px] opacity-40 uppercase">
                  [LOCATION 03 · PRODUCTION APP GATEWAY]
                </div>
                <div className="text-base font-semibold uppercase mt-1">Render US-West (Oregon)</div>
                <div className="font-geological-mono text-xs opacity-50 mt-1">
                  EXPRESS + GRAPHQL YOGA V5 · HTTP 200 OK
                </div>
              </div>
            </div>

            {/* Direct Digital Channels */}
            <div className="pt-6 border-t border-border/30">
              <div className="font-geological-mono text-[11px] uppercase opacity-40 mb-3">
                [DIRECT DIGITAL CHANNELS]
              </div>
              <div className="flex flex-col gap-2 font-geological-mono text-xs">
                <a
                  href="https://github.com/Jay-Raam/KURIPP"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 border border-border/40 hover:border-foreground transition-colors"
                >
                  <span>GitHub Repository & Discussions</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </a>
                <a
                  href="https://github.com/Jay-Raam/KURIPP/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 border border-border/40 hover:border-foreground transition-colors"
                >
                  <span>Public Issue Tracker</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </a>
                <a
                  href="https://kuripp.onrender.com/graphql"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 border border-border/40 hover:border-foreground transition-colors"
                >
                  <span>GraphQL Yoga Endpoint (/graphql)</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="border border-border/40 p-6 md:p-10 bg-card/30">
            <div className="pb-6 border-b border-border/30 mb-8">
              <span className="font-geological-mono text-xs uppercase opacity-40">
                (Commission Specification)
              </span>
              <h2 className="text-xl md:text-2xl font-medium uppercase tracking-tight mt-1">
                Direct Inquiry Form
              </h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Submissions are received directly by the core engineering maintainers under strict confidentiality protocols.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-geological-mono text-[11px] uppercase opacity-60 mb-2">
                    [FULL NAME]
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. K. Raman"
                    className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors font-geological-mono"
                  />
                </div>

                <div>
                  <label className="block font-geological-mono text-[11px] uppercase opacity-60 mb-2">
                    [WORK EMAIL ADDRESS]
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="raman@institution.org"
                    className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors font-geological-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-geological-mono text-[11px] uppercase opacity-60 mb-2">
                    [ORGANIZATION / AFFILIATION]
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. IIT Madras / AI Research Lab"
                    className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors font-geological-mono"
                  />
                </div>

                <div>
                  <label className="block font-geological-mono text-[11px] uppercase opacity-60 mb-2">
                    [DEPLOYMENT ARCHITECTURE]
                  </label>
                  <select
                    value={deploymentTarget}
                    onChange={(e) => setDeploymentTarget(e.target.value)}
                    className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors font-geological-mono"
                  >
                    <option value="Enterprise Cloud (Managed)">Enterprise Cloud (Managed Vercel/Render)</option>
                    <option value="Sovereign Air-Gapped Cluster">Sovereign Air-Gapped On-Premises</option>
                    <option value="Academic Research Grant">Academic Research Grant Access</option>
                    <option value="Open Source Integration">Open Source Integration / Security</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-geological-mono text-[11px] uppercase opacity-60 mb-2">
                  [RESEARCH SPECIFICATION & REQUIREMENTS]
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your estimated document ingestion volume, compliance needs (SOC 2 / HIPAA), or custom embedding requirements..."
                  className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors font-geological-mono"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/30">
                <div className="font-geological-mono text-[11px] opacity-40">
                  CONFIDENTIALITY PROTOCOL ENFORCED
                </div>

                <button
                  type="submit"
                  disabled={submitted}
                  className="border border-foreground bg-foreground text-background py-3.5 px-8 font-geological-mono text-xs uppercase font-medium hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                >
                  {submitted ? 'Inquiry Transmitted ✓' : '[Transmit Inquiry →]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
