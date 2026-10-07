'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function PublicFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full pt-16 pb-12 px-4 md:px-12 flex flex-col items-center border-t border-border/40 select-none bg-background">
      {/* Giant Outlined Footer Wordmark */}
      <div
        className="w-full max-w-7xl opacity-20 hover:opacity-40 transition-opacity duration-700 cursor-pointer"
        onClick={scrollToTop}
      >
        <svg
          viewBox="0 0 1200 220"
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
              fontSize: '180px',
              fontFamily:
                '"Neue Haas Grotesk Display Pro", "Helvetica Neue", -apple-system, sans-serif',
              letterSpacing: '-0.05em',
              stroke: 'currentColor',
              strokeWidth: '1.5px',
              fill: 'transparent',
            }}
          >
            KURIPP
          </text>
        </svg>
      </div>

      {/* Navigation Directory Bar */}
      <div className="w-full max-w-7xl pt-10 mt-6 border-t border-border/20 grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono text-xs uppercase opacity-70">
        <div className="flex flex-col gap-2">
          <span className="opacity-40 text-[10px]">[PAGES]</span>
          <Link href="/" className="hover:opacity-100">01. Home</Link>
          <Link href="/features" className="hover:opacity-100">02. Features</Link>
          <Link href="/about" className="hover:opacity-100">03. Vision & About</Link>
          <Link href="/changelog" className="hover:opacity-100">04. Changelog</Link>
          <Link href="/contact" className="hover:opacity-100">05. Contact</Link>
        </div>

        <div className="flex flex-col gap-2">
          <span className="opacity-40 text-[10px]">[ENGINES]</span>
          <Link href="/features#engine-rrf" className="hover:opacity-100">Hybrid RRF</Link>
          <Link href="/features#engine-models" className="hover:opacity-100">Multi-Model AI</Link>
          <Link href="/features#engine-deep" className="hover:opacity-100">Deep Research</Link>
          <Link href="/features#engine-diff" className="hover:opacity-100">Contract Diff</Link>
          <Link href="/features#engine-eval" className="hover:opacity-100">Eval Benchmark</Link>
        </div>

        <div className="flex flex-col gap-2">
          <span className="opacity-40 text-[10px]">[PLATFORM]</span>
          <Link href="/login" className="hover:opacity-100">Sign In</Link>
          <Link href="/register" className="hover:opacity-100">Register Account</Link>
          <Link href="/workspaces" className="hover:opacity-100">Workspaces</Link>
          <Link href="/chat" className="hover:opacity-100">Research Studio</Link>
          <Link href="/documents" className="hover:opacity-100">Document Vault</Link>
        </div>

        <div className="flex flex-col gap-2">
          <span className="opacity-40 text-[10px]">[CHANNELS]</span>
          <a
            href="https://github.com/Jay-Raam/KURIPP"
            target="_blank"
            rel="noreferrer"
            className="hover:opacity-100 flex items-center gap-1"
          >
            <span>GitHub</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
          <a
            href="https://kuripp.onrender.com/graphql"
            target="_blank"
            rel="noreferrer"
            className="hover:opacity-100 flex items-center gap-1"
          >
            <span>GraphQL API</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
          <Link href="/contact" className="hover:opacity-100">
            Enterprise Inquiries
          </Link>
        </div>
      </div>

      {/* Footer Colophon Meta Row */}
      <div className="w-full max-w-7xl pt-8 mt-6 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] uppercase opacity-50">
        <div>KURIPP AI KNOWLEDGE & RESEARCH PLATFORM · V1.0.0 PRODUCTION CORE</div>
        <div className="flex items-center gap-6">
          <span>LAT 13.0827° N, 80.2707° E</span>
          <button
            onClick={scrollToTop}
            className="hover:opacity-100 transition-opacity cursor-pointer"
          >
            [Back to Top ↑]
          </button>
        </div>
      </div>

      <div className="font-mono text-[10px] uppercase opacity-30 mt-6 tracking-widest text-center">
        Engineered with Precision & Lithic Aesthetics by JAY · All Rights Reserved
      </div>
    </footer>
  );
}
