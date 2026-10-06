'use client';

import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/providers';
import { useAuth } from '@/lib/auth-context';
import {
  Search,
  MessageSquare,
  Compass,
  FileText,
  Briefcase,
  GitCompare,
  FolderKanban,
  FileEdit,
  Activity,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  Home,
  X,
  CornerDownLeft,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Research Tools' | 'System';
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  perform: () => void;
  keywords?: string[];
}

interface CommandPaletteContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export const useCommandPalette = () => useContext(CommandPaletteContext);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const open = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };
  const toggle = () => setIsOpen((prev) => !prev);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = useMemo(() => [
    {
      id: 'nav-chat',
      title: 'Research Chat',
      category: 'Navigation',
      description: 'Conversational 3-column AI research with inline citations',
      icon: MessageSquare,
      perform: () => { router.push('/chat'); close(); },
      keywords: ['chat', 'conversation', 'rag', 'ask', 'query', 'assistant'],
    },
    {
      id: 'nav-research',
      title: 'Deep Research Studio',
      category: 'Navigation',
      description: 'Autonomous multi-pass synthesis and decomposition',
      icon: Compass,
      perform: () => { router.push('/research'); close(); },
      keywords: ['research', 'studio', 'deep', 'synthesis', 'multi-pass'],
    },
    {
      id: 'nav-vault',
      title: 'Document Vault',
      category: 'Navigation',
      description: 'Multi-format document ingest and layout chunking',
      icon: FileText,
      perform: () => { router.push('/documents'); close(); },
      keywords: ['documents', 'vault', 'pdf', 'docx', 'upload', 'files'],
    },
    {
      id: 'nav-workspaces',
      title: 'Workspaces',
      category: 'Navigation',
      description: 'Multi-tenant workspaces and member access controls',
      icon: Briefcase,
      perform: () => { router.push('/workspaces'); close(); },
      keywords: ['workspace', 'tenant', 'organization', 'team', 'members'],
    },
    {
      id: 'nav-home',
      title: 'System Architecture & Health',
      category: 'Navigation',
      description: 'Infrastructure status, OpenRouter models, and overview',
      icon: Home,
      perform: () => { router.push('/'); close(); },
      keywords: ['home', 'health', 'models', 'status', 'overview'],
    },
    {
      id: 'tool-diff',
      title: 'Semantic Document Diff',
      category: 'Research Tools',
      description: 'Clause-by-clause contract version comparison and impact analysis',
      icon: GitCompare,
      perform: () => { router.push('/research'); close(); },
      keywords: ['diff', 'compare', 'contract', 'clauses', 'dpa', 'msa'],
    },
    {
      id: 'tool-collections',
      title: 'Collections Hub',
      category: 'Research Tools',
      description: 'Curate thematic research collections and document binders',
      icon: FolderKanban,
      perform: () => { router.push('/research'); close(); },
      keywords: ['collections', 'binders', 'folders', 'groups'],
    },
    {
      id: 'tool-notes',
      title: 'Research Notes',
      category: 'Research Tools',
      description: 'Markdown notes with persistent citation anchors',
      icon: FileEdit,
      perform: () => { router.push('/research'); close(); },
      keywords: ['notes', 'markdown', 'citation', 'anchors', 'memos'],
    },
    {
      id: 'tool-eval',
      title: 'AI Groundedness Benchmark',
      category: 'Research Tools',
      description: 'Rigorous benchmark asserting >=90% groundedness and precision',
      icon: Activity,
      perform: () => { router.push('/research'); close(); },
      keywords: ['eval', 'benchmark', 'groundedness', 'hallucination', 'metrics', 'qa'],
    },
    {
      id: 'sys-theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'System',
      description: 'Toggle obsidian dark and editorial light theme',
      icon: theme === 'dark' ? Sun : Moon,
      perform: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); close(); },
      keywords: ['theme', 'dark', 'light', 'mode', 'color', 'obsidian'],
    },
    ...(isAuthenticated
      ? [
          {
            id: 'sys-logout',
            title: 'Sign Out',
            category: 'System' as const,
            description: 'Clear in-memory JWT session and revoke refresh token',
            icon: LogOut,
            perform: () => { logout(); close(); },
            keywords: ['logout', 'sign out', 'disconnect'],
          },
        ]
      : [
          {
            id: 'sys-login',
            title: 'Sign In (Recruiter Demo)',
            category: 'System' as const,
            description: 'Access pre-seeded evaluation workspace and benchmarks',
            icon: UserCheck,
            perform: () => { router.push('/login'); close(); },
            keywords: ['login', 'sign in', 'demo', 'recruiter', 'auth'],
          },
        ]),
  ], [router, theme, setTheme, isAuthenticated, logout]);

  // Filter commands
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase().trim();
    return commands.filter((cmd) => {
      const titleMatch = cmd.title.toLowerCase().includes(lower);
      const descMatch = cmd.description?.toLowerCase().includes(lower);
      const kwMatch = cmd.keywords?.some((kw) => kw.toLowerCase().includes(lower));
      return titleMatch || descMatch || kwMatch;
    });
  }, [commands, query]);

  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].perform();
      }
    }
  };

  // Keep selected index in bounds when filtering changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-zinc-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col text-zinc-100">
            {/* Input Header */}
            <div className="flex items-center px-4 border-b border-zinc-850 bg-zinc-900/60">
              <Search className="w-4 h-4 text-zinc-400 mr-3 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, tools, or workspaces... (or press Esc to exit)"
                className="w-full bg-transparent py-3.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 rounded">
                  ESC
                </kbd>
              )}
            </div>

            {/* Command List */}
            <div
              ref={listRef}
              className="max-h-96 overflow-y-auto p-2 divide-y divide-zinc-900"
            >
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-zinc-500">
                  No matching commands found for &ldquo;{query}&rdquo;
                </div>
              ) : (
                filtered.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => item.perform()}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-zinc-900 border border-zinc-800 text-zinc-100'
                          : 'text-zinc-300 hover:bg-zinc-900/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-md flex-shrink-0 ${
                            isSelected
                              ? 'bg-zinc-800 text-zinc-100'
                              : 'bg-zinc-900/60 text-zinc-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium truncate">{item.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-850 text-zinc-400">
                              {item.category}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 pl-2 flex-shrink-0">
                          <span>Select</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Shortcut Bar */}
            <div className="px-4 py-2 border-t border-zinc-850 bg-zinc-900/40 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">↑</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">↓</kbd>
                  <span className="text-zinc-500">Navigate</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">↵</kbd>
                  <span className="text-zinc-500">Open</span>
                </span>
              </div>
              <div className="text-zinc-500">
                KURIPP Quick Command Palette
              </div>
            </div>
          </div>
        </div>
      )}
    </CommandPaletteContext.Provider>
  );
}

export function CommandPaletteTrigger() {
  const { open } = useCommandPalette();

  return (
    <button
      onClick={open}
      aria-label="Open command palette"
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-zinc-700 transition-colors font-mono"
    >
      <Search className="w-3 h-3" />
      <span className="hidden sm:inline">Search commands</span>
      <kbd className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] bg-secondary border border-border rounded text-muted-foreground">
        ⌘K
      </kbd>
    </button>
  );
}
