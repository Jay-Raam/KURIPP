import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'KURIPP — AI Knowledge & Research Platform',
  description:
    'A production-grade full-stack workspace for document intelligence, semantic search, grounded AI research, and collaborative knowledge management.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-neutral-800 selection:text-neutral-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
