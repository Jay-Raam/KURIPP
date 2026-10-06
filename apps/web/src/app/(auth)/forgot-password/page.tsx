'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { gql } from 'graphql-request';
import { graphqlClient } from '@/lib/graphql-client';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const REQUEST_RESET_MUTATION = gql`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input)
  }
`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await graphqlClient.request(REQUEST_RESET_MUTATION, {
        input: { email },
      });
      setIsSent(true);
      toast.success('Password reset instructions sent');
    } catch {
      // Always show success message to prevent user enumeration
      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded border border-border bg-card font-mono text-sm font-semibold">
            K
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-xs text-muted-foreground">
            Enter your account email to receive a secure recovery link
          </p>
        </div>

        {isSent ? (
          <div className="rounded border border-border bg-card p-5 text-center space-y-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
            <h2 className="text-xs font-semibold">Check your email</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If an account exists for <span className="font-mono text-foreground">{email}</span>,
              a single-use recovery link has been dispatched.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="text-xs font-medium text-foreground hover:underline"
              >
                Return to sign in
              </Link>
            </div>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded bg-primary py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span>Send reset link</span>
              )}
            </button>
          </form>
        )}

        <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
          <span>Remember your password?</span>
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </div>

        <div className="border-t border-border pt-4 text-center">
          <div className="inline-flex items-center space-x-1.5 text-[11px] text-muted-foreground font-mono">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Single-use cryptographic tokens with 1-hour expiration</span>
          </div>
        </div>
      </div>
    </div>
  );
}
