'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, Loader2, Sparkles, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (autoSubmit: boolean) => {
    setEmail('recruiter@kuripp.demo');
    setPassword('KurippDemo2026!');
    setErrorMsg(null);

    if (autoSubmit) {
      setIsSubmitting(true);
      login({ email: 'recruiter@kuripp.demo', password: 'KurippDemo2026!' })
        .then(() => {
          router.push('/');
        })
        .catch((err: any) => {
          setErrorMsg(err.message || 'Demo account login failed. Please ensure DB is seeded.');
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded border border-border bg-card font-mono text-sm font-semibold">
            K
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Sign in to KURIPP</h1>
          <p className="text-xs text-muted-foreground">
            Access your research workspace and document collections
          </p>
        </div>

        {/* Recruiter Evaluation Quick-Fill Banner */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-300" />
            <span className="text-xs font-semibold text-zinc-200">
              Recruiter Demo Evaluation Mode
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
            Pre-seeded with Enterprise SaaS workspace, SOC 2/DPA documents, 1536-dim vector embeddings, and benchmark evaluations.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleFillDemo(true)}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs font-mono transition-colors disabled:opacity-60"
            >
              <UserCheck className="w-3.5 h-3.5" />
              1-Click Demo Sign In
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo(false)}
              className="py-1.5 px-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-mono transition-colors"
            >
              Auto-Fill
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.com"
              className="w-full rounded border border-input bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded border border-input bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded bg-primary py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
          <span>Don&apos;t have an account?</span>
          <Link href="/register" className="font-medium text-foreground hover:underline">
            Create account
          </Link>
        </div>

        <div className="border-t border-border pt-4 text-center">
          <div className="inline-flex items-center space-x-1.5 text-[11px] text-muted-foreground font-mono">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Zero browser storage: tokens held in-memory</span>
          </div>
        </div>
      </div>
    </div>
  );
}
