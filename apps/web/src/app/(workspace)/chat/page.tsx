'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { CommandPaletteTrigger } from '@/components/command-palette';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphqlClient } from '@/lib/graphql-client';
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Loader2,
  Sparkles,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  FileText,
  ExternalLink,
  Bot,
  User,
  Quote,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';

const CHAT_SESSIONS_QUERY = gql`
  query GetChatSessions($workspaceId: ID!) {
    chatSessions(workspaceId: $workspaceId) {
      id
      workspaceId
      title
      mode
      model
      messageCount
      lastMessageAt
      createdAt
      updatedAt
    }
  }
`;

const CHAT_SESSION_DETAIL_QUERY = gql`
  query GetChatSessionDetail($id: ID!) {
    chatSession(id: $id) {
      session {
        id
        workspaceId
        title
        mode
        model
        messageCount
        createdAt
        updatedAt
      }
      messages {
        id
        sessionId
        role
        content
        model
        citations {
          documentId
          documentTitle
          chunkId
          pageNumber
          sectionHeading
          content
          score
        }
        createdAt
      }
    }
  }
`;

const CREATE_SESSION_MUTATION = gql`
  mutation CreateChatSession($input: CreateChatSessionInput!) {
    createChatSession(input: $input) {
      id
      title
      mode
      model
    }
  }
`;

const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      sessionId
      role
      content
      model
      citations {
        documentId
        documentTitle
        chunkId
        pageNumber
        sectionHeading
        content
        score
      }
      createdAt
    }
  }
`;

const DELETE_SESSION_MUTATION = gql`
  mutation DeleteChatSession($id: ID!) {
    deleteChatSession(id: $id)
  }
`;

const OPENROUTER_MODELS_QUERY = gql`
  query GetOpenRouterModels {
    openRouterModels {
      id
      name
      description
      contextLength
      isFree
    }
  }
`;

interface ChatSession {
  id: string;
  workspaceId: string;
  title: string;
  mode: 'ASK' | 'RESEARCH' | 'ANALYZE';
  model: string;
  messageCount: number;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Citation {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  pageNumber?: number | null;
  sectionHeading?: string | null;
  content: string;
  score: number;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string | null;
  citations: Citation[];
  createdAt: string;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  isFree: boolean;
}

export default function ConversationalWorkspacePage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const queryClient = useQueryClient();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'ASK' | 'RESEARCH' | 'ANALYZE'>('RESEARCH');
  const [selectedModel, setSelectedModel] = useState<string>('meta-llama/llama-3.3-70b-instruct:free');
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch OpenRouter Models
  const { data: modelsData } = useQuery({
    queryKey: ['openrouter-models'],
    queryFn: async () => {
      return graphqlClient.request<{ openRouterModels: OpenRouterModel[] }>(OPENROUTER_MODELS_QUERY);
    },
    staleTime: 600000,
  });

  const availableModels = modelsData?.openRouterModels || [];

  // Fetch Chat Sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return { chatSessions: [] };
      return graphqlClient.request<{ chatSessions: ChatSession[] }>(
        CHAT_SESSIONS_QUERY,
        { workspaceId: currentWorkspace.id }
      );
    },
    enabled: !!currentWorkspace?.id,
  });

  const sessions = sessionsData?.chatSessions || [];

  // Select first session automatically if none active
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0]?.id || null);
    }
  }, [sessions, activeSessionId]);

  // Fetch Active Session Detail (Messages)
  const { data: sessionDetailData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-session-detail', activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return null;
      return graphqlClient.request<{
        chatSession: { session: ChatSession; messages: ChatMessage[] };
      }>(CHAT_SESSION_DETAIL_QUERY, { id: activeSessionId });
    },
    enabled: !!activeSessionId,
  });

  const messages = sessionDetailData?.chatSession?.messages || [];
  const activeSession = sessionDetailData?.chatSession?.session;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create Session Mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error('No workspace selected');
      return graphqlClient.request<{ createChatSession: ChatSession }>(
        CREATE_SESSION_MUTATION,
        {
          input: {
            workspaceId: currentWorkspace.id,
            title: 'New Research Synthesis',
            mode: selectedMode,
            model: selectedModel,
          },
        }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', currentWorkspace?.id] });
      setActiveSessionId(data.createChatSession.id);
      setSelectedCitation(null);
      toast.success('Started new research session');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create session');
    },
  });

  // Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!activeSessionId || !currentWorkspace?.id) throw new Error('Missing active session or workspace');
      return graphqlClient.request<{ sendMessage: ChatMessage }>(
        SEND_MESSAGE_MUTATION,
        {
          input: {
            sessionId: activeSessionId,
            workspaceId: currentWorkspace.id,
            content,
            mode: selectedMode,
            model: selectedModel,
          },
        }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-session-detail', activeSessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', currentWorkspace?.id] });
      // If response has citations, focus the first citation in the right drawer
      if (data.sendMessage.citations && data.sendMessage.citations.length > 0) {
        setSelectedCitation(data.sendMessage.citations[0] || null);
        setIsDrawerOpen(true);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to generate response');
    },
  });

  // Delete Session Mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      return graphqlClient.request<{ deleteChatSession: boolean }>(
        DELETE_SESSION_MUTATION,
        { id }
      );
    },
    onSuccess: () => {
      toast.success('Session deleted');
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', currentWorkspace?.id] });
      setActiveSessionId(null);
      setSelectedCitation(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete session');
    },
  });

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || sendMessageMutation.isPending) return;

    const content = inputPrompt.trim();
    setInputPrompt('');

    if (!activeSessionId) {
      // Create session first then send
      createSessionMutation.mutate(undefined, {
        onSuccess: () => {
          sendMessageMutation.mutate({ content });
        },
      });
    } else {
      sendMessageMutation.mutate({ content });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin mr-3 text-zinc-300" />
        <span className="font-mono text-sm tracking-wide">CONNECTING CONVERSATIONAL ENGINE...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Top Application Header */}
      <header className="h-14 border-b border-zinc-850 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-zinc-200">
            KC
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-mono">RESEARCH</span>
            <span className="text-zinc-600">/</span>
            <span className="text-sm font-semibold text-zinc-200">
              {currentWorkspace?.name || 'Default Workspace'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <CommandPaletteTrigger />
          <WorkspaceSwitcher />
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/documents"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition-colors"
          >
            Document Vault
          </Link>
          <Link
            href="/research"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition-colors"
          >
            Research Studio
          </Link>
          <Link
            href="/workspaces"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition-colors"
          >
            Workspaces
          </Link>
        </div>
      </header>

      {/* 3-Column Conversational Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLUMN 1: Session History Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'w-72' : 'w-0'
          } border-r border-zinc-850 bg-zinc-900/40 flex flex-col transition-all duration-200 overflow-hidden flex-shrink-0`}
        >
          {/* New Session Action */}
          <div className="p-3 border-b border-zinc-850 flex items-center justify-between">
            <button
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isPending}
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Research Chat
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessionsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                <span className="text-[11px] font-mono">LOADING SESSIONS...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs px-4">
                No conversations yet. Start a new research chat above.
              </div>
            ) : (
              sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      setActiveSessionId(sess.id);
                      setSelectedCitation(null);
                    }}
                    className={`group relative p-2.5 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-sm'
                        : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{sess.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-zinc-500">
                          <span>{sess.mode}</span>
                          <span>·</span>
                          <span>{sess.messageCount} msgs</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete session "${sess.title}"?`)) {
                          deleteSessionMutation.mutate(sess.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-700/60 text-zinc-500 hover:text-rose-400 transition-all"
                      title="Delete chat session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* COLUMN 2: Main Conversational Center Stream */}
        <main className="flex-1 flex flex-col bg-zinc-950 overflow-hidden relative">
          {/* Controls Bar: Mode pills & Model selector */}
          <div className="h-12 border-b border-zinc-850 px-6 flex items-center justify-between bg-zinc-950/60 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                title={isSidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
              >
                {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {/* Research Mode Selector */}
              <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                {(['ASK', 'RESEARCH', 'ANALYZE'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-colors ${
                      selectedMode === mode
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {activeSession?.title && (
                <span className="text-xs text-zinc-400 font-mono max-w-[200px] truncate hidden md:inline ml-1" title={activeSession.title}>
                  / {activeSession.title}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* OpenRouter Model Selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg text-xs py-1 px-2.5 focus:outline-none focus:border-zinc-700 font-mono"
                >
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.isFree ? '(Free)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  isDrawerOpen
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                }`}
                title="Toggle Source Citations Drawer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sources</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {messagesLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-zinc-500 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                <span className="text-xs font-mono">LOADING RESEARCH CONTEXT...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-24 max-w-lg mx-auto text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                  <Sparkles className="w-6 h-6 text-zinc-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    KURIPP Conversational Engine
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Ask questions grounded directly in your vaulted documents. Every answer incorporates Reciprocal Rank Fusion hybrid search and exact verified citations.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {[
                    'Synthesize key findings across all documents',
                    'Compare methodology and quantitative results',
                    'Extract executive action items and deliverables',
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setInputPrompt(preset);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 text-xs text-zinc-300 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 max-w-3xl ${
                      isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'
                    }`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`rounded-xl p-4 text-xs leading-relaxed space-y-3 ${
                        isUser
                          ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 max-w-xl'
                          : 'bg-zinc-900/40 border border-zinc-850 text-zinc-200 max-w-2xl'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed select-text font-sans">
                        {msg.content}
                      </div>

                      {/* Inline Citations Badges */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                            Citations:
                          </span>
                          {msg.citations.map((c, i) => (
                            <button
                              key={c.chunkId + i}
                              onClick={() => {
                                setSelectedCitation(c);
                                setIsDrawerOpen(true);
                              }}
                              className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors inline-flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-zinc-400" />
                              <span>[{i + 1}]</span>
                              <span className="truncate max-w-[120px]">{c.documentTitle}</span>
                              {c.pageNumber && <span className="text-zinc-500">p.{c.pageNumber}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {sendMessageMutation.isPending && (
              <div className="flex gap-3.5 max-w-2xl mr-auto">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-xl p-4 bg-zinc-900/40 border border-zinc-850 flex items-center gap-2.5 text-xs text-zinc-400 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                  <span>SYNTHESIZING WITH RRF CITATIONS...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Prompt Input Dock */}
          <div className="p-4 border-t border-zinc-850 bg-zinc-950/80 backdrop-blur-md">
            <form
              onSubmit={handleSendMessage}
              className="max-w-3xl mx-auto relative rounded-xl border border-zinc-800 bg-zinc-900/60 focus-within:border-zinc-700 transition-colors shadow-sm overflow-hidden"
            >
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder={`Ask about ${currentWorkspace?.name || 'documents'} (Enter to send, Shift+Enter for newline)...`}
                className="w-full bg-transparent px-4 pt-3 pb-10 text-xs text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none"
              />

              <div className="absolute left-3 bottom-2.5 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Zero Token Leakage Guarantee</span>
              </div>

              <button
                type="submit"
                disabled={!inputPrompt.trim() || sendMessageMutation.isPending}
                className="absolute right-2.5 bottom-2.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send</span>
              </button>
            </form>
          </div>
        </main>

        {/* COLUMN 3: Document Source Drawer / Citation Inspector */}
        <aside
          className={`${
            isDrawerOpen ? 'w-80 md:w-96' : 'w-0'
          } border-l border-zinc-850 bg-zinc-900/30 flex flex-col transition-all duration-200 overflow-hidden flex-shrink-0`}
        >
          <div className="p-4 border-b border-zinc-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                Source Attribution
              </h3>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-zinc-500 hover:text-zinc-200 p-1 rounded"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedCitation ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-emerald-400 text-[11px] font-medium">
                      RRF Score: {selectedCitation.score}
                    </span>
                    {selectedCitation.pageNumber && (
                      <span className="text-[11px] font-mono text-zinc-400">
                        Page {selectedCitation.pageNumber}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-zinc-100">
                    {selectedCitation.documentTitle}
                  </h4>

                  {selectedCitation.sectionHeading && (
                    <p className="text-xs font-mono text-zinc-400">
                      § {selectedCitation.sectionHeading}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                    <Quote className="w-3.5 h-3.5" />
                    <span>Exact Document Excerpt:</span>
                  </div>
                  <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950 text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap select-text max-h-72 overflow-y-auto">
                    {selectedCitation.content}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/documents"
                    className="w-full py-2 px-3 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-xs text-zinc-300 flex items-center justify-center gap-1.5 transition-colors font-mono"
                  >
                    <span>Inspect in Document Vault</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-3 px-4">
                <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-medium text-zinc-300">No source selected</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Click on any citation pill like [1] or [2] in the chat response to preview the underlying excerpt and page attribution.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
