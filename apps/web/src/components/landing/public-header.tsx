'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/providers';
import { useAuth } from '@/lib/auth-context';
import { Menu, X } from 'lucide-react';

export function PublicHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const [scrollPercent, setScrollPercent] = useState('00%');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const progress = Math.min(100, Math.max(0, Math.round((window.scrollY / totalHeight) * 100)));
      setScrollPercent(`${String(progress).padStart(2, '0')}%`);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/', num: '1.' },
    { label: 'Features', href: '/features', num: '2.' },
    { label: 'Vision & About', href: '/about', num: '3.' },
    { label: 'Changelog', href: '/changelog', num: '4.' },
    { label: 'Contact', href: '/contact', num: '5.' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full p-4 md:p-6 z-[106] pointer-events-none text-white">
        <nav className="flex items-center justify-between w-full font-sans font-medium text-xs md:text-sm uppercase tracking-wider pointer-events-auto text-white mix-blend-difference">
          {/* Brand & Telemetry Coordinates */}
          <div className="flex items-center gap-6 md:gap-12">
            <Link
              href="/"
              className="font-bold text-base md:text-lg tracking-tighter hover:opacity-60 transition-opacity font-mono"
            >
              KURIPP
            </Link>
            <div className="hidden lg:block font-mono text-[11px] opacity-50 tracking-widest">
              LAT 13.0827° N, 80.2707° E · AP-SOUTH-1
            </div>
            <div className="font-mono tabular-nums opacity-80 text-xs">
              {scrollPercent}
            </div>
          </div>

          {/* Numbered Navigation (Desktop) */}
          <div className="hidden xl:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1 transition-opacity ${
                    isActive ? 'opacity-100 font-bold' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-50">{link.num}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Geological Status Bracket */}
            <span className="font-mono text-[10px] opacity-40">[RRF: K=60]</span>

            {/* Dark/Light Lithic Toggle Dot */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              title="Toggle theme"
              className="relative w-3 h-3 rounded-full bg-white border-none cursor-pointer p-0 hover:scale-125 transition-transform"
            >
              <span className="absolute inset-0 rounded-full bg-white animate-pulse opacity-20"></span>
            </button>

            {/* Authentication Pathway */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/workspaces"
                  className="border border-white/40 px-3 py-1 font-mono text-xs hover:bg-white hover:text-black transition-colors"
                >
                  [Workspaces →]
                </Link>
                <button
                  onClick={() => logout()}
                  className="font-mono text-xs opacity-60 hover:opacity-100 cursor-pointer"
                >
                  [Sign Out]
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="font-mono text-xs opacity-70 hover:opacity-100 transition-opacity"
                >
                  [Sign In]
                </Link>
                <Link
                  href="/register"
                  className="border border-white/40 px-3 py-1 font-mono text-xs hover:bg-white hover:text-black transition-colors"
                >
                  [Launch App →]
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex xl:hidden items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="w-3 h-3 rounded-full bg-white border-none cursor-pointer p-0"
            />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="p-1 text-white hover:opacity-70 transition-opacity"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[105] bg-background/95 backdrop-blur-md flex flex-col justify-between p-8 pt-24 font-sans text-sm uppercase tracking-wider">
          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 border-b border-border/40 pb-3 ${
                  pathname === link.href ? 'opacity-100 font-bold' : 'opacity-70'
                }`}
              >
                <span className="font-mono text-xs opacity-40">{link.num}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-border">
            {isAuthenticated ? (
              <>
                <Link
                  href="/workspaces"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-foreground text-background font-mono text-xs font-semibold"
                >
                  Enter Workspace →
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2 border border-border font-mono text-xs opacity-70"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 border border-border font-mono text-xs"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-foreground text-background font-mono text-xs font-semibold"
                >
                  Launch App →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
