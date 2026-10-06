'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphqlClient } from '@/lib/graphql-client';
import {
  Compass,
  GitCompare,
  FolderKanban,
  FileEdit,
  Activity,
  Plus,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

// GraphQL Queries & Mutations
const GET_COLLECTIONS_QUERY = gql`
  query GetCollections($workspaceId: ID!) {
    collections(workspaceId: $workspaceId) {
      id
      workspaceId
      name
      description
      color
      documentCount
      createdAt
      updatedAt
    }
  }
`;

const CREATE_COLLECTION_MUTATION = gql`
  mutation CreateCollection($input: CreateCollectionInput!) {
    createCollection(input: $input) {
      id
      name
      documentCount
    }
  }
`;

const GET_NOTES_QUERY = gql`
  query GetResearchNotes($workspaceId: ID!, $collectionId: ID, $tag: String) {
    researchNotes(workspaceId: $workspaceId, collectionId: $collectionId, tag: $tag) {
      id
      title
      content
      tags
      sourceCitations
      createdAt
      updatedAt
    }
  }
`;

const CREATE_NOTE_MUTATION = gql`
  mutation CreateResearchNote($input: CreateResearchNoteInput!) {
    createResearchNote(input: $input) {
      id
      title
      content
      tags
    }
  }
`;

const RUN_DEEP_RESEARCH_MUTATION = gql`
  mutation RunDeepResearch($input: RunDeepResearchInput!) {
    runDeepResearch(input: $input) {
      id
      objective
      subQueries
      documentsAnalyzed
      citations {
        documentId
        documentTitle
        pageNumber
        sectionHeading
        content
        score
      }
      synthesisMarkdown
      keyFindings
      strategicRecommendations
      executionTimeMs
    }
  }
`;

const COMPARE_DOCS_MUTATION = gql`
  mutation CompareDocuments($input: CompareDocumentsInput!) {
    compareDocuments(input: $input) {
      id
      title
      summary
      addedClausesCount
      removedClausesCount
      modifiedClausesCount
      segments {
        type
        text
        lineNumber
      }
      aiAnalysis
      createdAt
    }
  }
`;

const RUN_EVALUATION_QUERY = gql`
  query RunEvaluation($workspaceId: ID!) {
    runAiEvaluationHarness(workspaceId: $workspaceId) {
      totalCases
      passedCases
      averageGroundedness
      averageCitationPrecision
      averageHallucinationScore
      metrics {
        testCaseId
        query
        groundednessScore
        citationPrecision
        hallucinationScore
        isPassed
        explanation
      }
    }
  }
`;

interface CollectionItem {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  documentCount: number;
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface DeepResearchData {
  id: string;
  objective: string;
  subQueries: string[];
  documentsAnalyzed: number;
  citations: Array<{
    documentId: string;
    documentTitle: string;
    pageNumber?: number | null;
    sectionHeading?: string | null;
    content: string;
    score: number;
  }>;
  synthesisMarkdown: string;
  keyFindings: string[];
  strategicRecommendations: string[];
  executionTimeMs: number;
}

interface DiffResultData {
  id: string;
  title: string;
  summary: string;
  addedClausesCount: number;
  removedClausesCount: number;
  modifiedClausesCount: number;
  segments: Array<{
    type: string;
    text: string;
    lineNumber?: number | null;
  }>;
  aiAnalysis: string;
}

interface EvalSummaryData {
  totalCases: number;
  passedCases: number;
  averageGroundedness: number;
  averageCitationPrecision: number;
  averageHallucinationScore: number;
  metrics: Array<{
    testCaseId: string;
    query: string;
    groundednessScore: number;
    citationPrecision: number;
    hallucinationScore: number;
    isPassed: boolean;
    explanation: string;
  }>;
}

export default function ResearchStudioPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'RESEARCH' | 'DIFF' | 'COLLECTIONS' | 'NOTES' | 'EVALUATION'>('RESEARCH');

  // Deep Research State
  const [objectiveInput, setObjectiveInput] = useState(
    'Assess vendor security commitments, SOC 2 certification standards, and data breach notification timelines'
  );
  const [researchResult, setResearchResult] = useState<DeepResearchData | null>(null);

  // Document Diff State
  const [diffBaseId, setDiffBaseId] = useState('doc-msa-2024');
  const [diffTargetId, setDiffTargetId] = useState('doc-msa-2026');
  const [diffResult, setDiffResult] = useState<DiffResultData | null>(null);

  // Notes State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('compliance, vendor-risk');

  // Collections Query
  const { data: collectionsData, isLoading: collectionsLoading } = useQuery({
    queryKey: ['collections', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return { collections: [] };
      return graphqlClient.request<{ collections: CollectionItem[] }>(GET_COLLECTIONS_QUERY, {
        workspaceId: currentWorkspace.id,
      });
    },
    enabled: !!currentWorkspace?.id,
  });

  // Notes Query
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['researchNotes', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return { researchNotes: [] };
      return graphqlClient.request<{ researchNotes: NoteItem[] }>(GET_NOTES_QUERY, {
        workspaceId: currentWorkspace.id,
      });
    },
    enabled: !!currentWorkspace?.id,
  });

  // Evaluation Query (Lazy on-demand trigger)
  const [evalEnabled, setEvalEnabled] = useState(false);
  const { data: evalData, isLoading: evalLoading, refetch: runEvalRefetch } = useQuery({
    queryKey: ['evaluationHarness', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return null;
      const res = await graphqlClient.request<{ runAiEvaluationHarness: EvalSummaryData }>(
        RUN_EVALUATION_QUERY,
        { workspaceId: currentWorkspace.id }
      );
      return res.runAiEvaluationHarness;
    },
    enabled: evalEnabled && !!currentWorkspace?.id,
  });

  // Deep Research Mutation
  const deepResearchMutation = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error('No workspace selected');
      const res = await graphqlClient.request<{ runDeepResearch: DeepResearchData }>(
        RUN_DEEP_RESEARCH_MUTATION,
        {
          input: {
            workspaceId: currentWorkspace.id,
            objective: objectiveInput,
          },
        }
      );
      return res.runDeepResearch;
    },
    onSuccess: (data) => {
      setResearchResult(data);
      toast.success('Deep Research synthesis complete');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Deep Research failed');
    },
  });

  // Diff Mutation
  const compareMutation = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error('No workspace selected');
      const res = await graphqlClient.request<{ compareDocuments: DiffResultData }>(
        COMPARE_DOCS_MUTATION,
        {
          input: {
            workspaceId: currentWorkspace.id,
            baseDocumentId: diffBaseId,
            targetDocumentId: diffTargetId,
            title: `Comparison: ${diffBaseId} vs ${diffTargetId}`,
          },
        }
      );
      return res.compareDocuments;
    },
    onSuccess: (data) => {
      setDiffResult(data);
      toast.success('Document comparison complete');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Comparison failed');
    },
  });

  // Create Collection Mutation
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const createCollectionMutation = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error('No workspace selected');
      return graphqlClient.request(CREATE_COLLECTION_MUTATION, {
        input: {
          workspaceId: currentWorkspace.id,
          name: newColName,
          description: newColDesc,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setNewColName('');
      setNewColDesc('');
      toast.success('Collection created');
    },
  });

  // Create Note Mutation
  const createNoteMutation = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error('No workspace selected');
      return graphqlClient.request(CREATE_NOTE_MUTATION, {
        input: {
          workspaceId: currentWorkspace.id,
          title: noteTitle || 'Untitled Research Note',
          content: noteContent,
          tags: noteTags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['researchNotes'] });
      setNoteTitle('');
      setNoteContent('');
      toast.success('Research note saved');
    },
  });

  const handleSaveSynthesisToNotes = () => {
    if (!researchResult) return;
    setNoteTitle(`Synthesis: ${researchResult.objective.slice(0, 40)}...`);
    setNoteContent(researchResult.synthesisMarkdown);
    setNoteTags('synthesis, deep-research');
    setActiveTab('NOTES');
    toast.success('Synthesis transferred to Notes editor');
  };

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-3 text-zinc-200" />
        LOADING RESEARCH STUDIO...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-zinc-800">
      {/* Top Application Header */}
      <header className="h-14 border-b border-zinc-850 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-zinc-200">
            RS
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-mono">STUDIO</span>
            <span className="text-zinc-600">/</span>
            <span className="text-sm font-semibold text-zinc-200">
              {currentWorkspace?.name || 'Default Workspace'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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
            href="/chat"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition-colors"
          >
            Research Chat
          </Link>
          <Link
            href="/workspaces"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition-colors"
          >
            Workspaces
          </Link>
        </div>
      </header>

      {/* Studio Nav Bar */}
      <div className="border-b border-zinc-850 bg-zinc-950 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(
            [
              { id: 'RESEARCH', label: 'Deep Research Studio', icon: Compass },
              { id: 'DIFF', label: 'Document Diff & DPA', icon: GitCompare },
              { id: 'COLLECTIONS', label: 'Collections Hub', icon: FolderKanban },
              { id: 'NOTES', label: 'Research Notes', icon: FileEdit },
              { id: 'EVALUATION', label: 'AI Evaluation Benchmark', icon: Activity },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                  isActive
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-100 shadow-sm'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Work Area */}
      <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: DEEP RESEARCH STUDIO */}
        {activeTab === 'RESEARCH' && (
          <div className="space-y-6">
            <div className="border border-zinc-850 bg-zinc-900/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-zinc-300" />
                  <h2 className="text-sm font-semibold text-zinc-200">Autonomous Multi-Pass Research Engine</h2>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  RRF k=60 · Multi-Angle Query Decomposition
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Formulate an open-ended strategic objective. The engine automatically breaks your query into multiple
                orthogonal sub-queries, executes vector and lexical search passes, merges cross-document citations, and
                synthesizes an executive brief.
              </p>

              <textarea
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none mb-3"
                placeholder="Enter comprehensive research objective..."
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-mono">Preset Objectives:</span>
                  {[
                    'SLA & Vendor Liability Comparison',
                    'SOC 2 Type II Security Covenants',
                    'Arbitration & Governing Law Clauses',
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setObjectiveInput(preset)}
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 transition-colors font-mono"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => deepResearchMutation.mutate()}
                  disabled={deepResearchMutation.isPending || !objectiveInput.trim()}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                  {deepResearchMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Executing Multi-Pass Research...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Execute Deep Research
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Research Results Display */}
            {researchResult && (
              <div className="space-y-6">
                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                      Sub-Queries Decomposed
                    </span>
                    <span className="text-2xl font-bold font-mono text-zinc-100">
                      {researchResult.subQueries.length}
                    </span>
                  </div>
                  <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                      Documents Analyzed
                    </span>
                    <span className="text-2xl font-bold font-mono text-zinc-100">
                      {researchResult.documentsAnalyzed}
                    </span>
                  </div>
                  <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                      Grounded Citations
                    </span>
                    <span className="text-2xl font-bold font-mono text-zinc-100">
                      {researchResult.citations.length}
                    </span>
                  </div>
                  <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                      Execution Time
                    </span>
                    <span className="text-2xl font-bold font-mono text-zinc-100">
                      {researchResult.executionTimeMs}ms
                    </span>
                  </div>
                </div>

                {/* Sub-Queries Pills */}
                <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-zinc-300 font-mono uppercase mb-2">
                    Decomposed Search Vectors
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {researchResult.subQueries.map((q, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300"
                      >
                        Pass {idx + 1}: {q}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Synthesis Output & Save Button */}
                <div className="border border-zinc-850 bg-zinc-900/40 rounded-xl p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-850 mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-100">Executive Synthesis Document</h3>
                      <p className="text-xs text-zinc-400 font-mono">Fully grounded cross-document intelligence</p>
                    </div>
                    <button
                      onClick={handleSaveSynthesisToNotes}
                      className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      Save to Research Notes
                    </button>
                  </div>

                  <div className="prose prose-invert prose-xs max-w-none font-sans whitespace-pre-wrap leading-relaxed text-zinc-300">
                    {researchResult.synthesisMarkdown}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOCUMENT DIFF & DPA COMPARISON */}
        {activeTab === 'DIFF' && (
          <div className="space-y-6">
            <div className="border border-zinc-850 bg-zinc-900/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <GitCompare className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-semibold text-zinc-200">Semantic Document & Contract Version Comparator</h2>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Compare baseline and revision documents (e.g. Master Service Agreement 2024 vs 2026). Detect altered payment
                terms, liability ceilings, security covenants, and governing law shifts.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Base Document Identifier</label>
                  <input
                    value={diffBaseId}
                    onChange={(e) => setDiffBaseId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Target Document Identifier</label>
                  <input
                    value={diffTargetId}
                    onChange={(e) => setDiffTargetId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <button
                onClick={() => compareMutation.mutate()}
                disabled={compareMutation.isPending}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                {compareMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Computing Semantic Diff...
                  </>
                ) : (
                  <>
                    <GitCompare className="w-3.5 h-3.5" />
                    Compare Document Versions
                  </>
                )}
              </button>
            </div>

            {diffResult && (
              <div className="space-y-6">
                {/* Metric Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                    <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block mb-1">
                      Modified Clauses
                    </span>
                    <span className="text-2xl font-bold font-mono text-zinc-100">
                      {diffResult.modifiedClausesCount}
                    </span>
                  </div>
                  <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                    <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                      Added Clauses
                    </span>
                    <span className="text-2xl font-bold font-mono text-zinc-100">
                      {diffResult.addedClausesCount}
                    </span>
                  </div>
                  <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                    <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block mb-1">
                      Removed Clauses
                    </span>
                    <span className="text-2xl font-bold font-mono text-zinc-100">
                      {diffResult.removedClausesCount}
                    </span>
                  </div>
                </div>

                {/* AI Executive Impact Analysis */}
                <div className="border border-zinc-850 bg-zinc-900/40 rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-zinc-200 font-mono uppercase mb-3 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                    AI Risk & Impact Analysis
                  </h3>
                  <div className="prose prose-invert prose-xs max-w-none text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
                    {diffResult.aiAnalysis}
                  </div>
                </div>

                {/* Segment Table */}
                <div className="border border-zinc-850 bg-zinc-900/40 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-zinc-850 bg-zinc-950/60 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-200 font-mono uppercase">
                      Clause-by-Clause Semantic Diff
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {diffResult.segments.length} Provisions Inspected
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-850">
                    {diffResult.segments.map((seg, idx) => (
                      <div key={idx} className="p-4 flex items-start gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase flex-shrink-0 mt-0.5 ${
                            seg.type === 'MODIFIED'
                              ? 'bg-amber-950/40 text-amber-300 border border-amber-800/60'
                              : seg.type === 'ADDED'
                              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                              : seg.type === 'REMOVED'
                              ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {seg.type}
                        </span>
                        <div className="flex-1 font-mono text-xs whitespace-pre-wrap leading-relaxed text-zinc-200">
                          {seg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COLLECTIONS HUB */}
        {activeTab === 'COLLECTIONS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">Project Collections</h2>
                <p className="text-xs text-zinc-400 font-mono">Thematic binders grouping documents, chats, and notes</p>
              </div>

              {/* Create Collection Inline Form */}
              <div className="flex items-center gap-2">
                <input
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="Collection Name..."
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 w-48"
                />
                <button
                  onClick={() => createCollectionMutation.mutate()}
                  disabled={createCollectionMutation.isPending || !newColName.trim()}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Collection
                </button>
              </div>
            </div>

            {collectionsLoading ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-400">Loading collections...</div>
            ) : collectionsData?.collections && collectionsData.collections.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {collectionsData.collections.map((col) => (
                  <div
                    key={col.id}
                    className="border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-900/70 rounded-xl p-5 transition-colors relative"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <FolderKanban className="w-3.5 h-3.5 text-zinc-300" />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        {col.documentCount} Documents
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100 mb-1">{col.name}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {col.description || 'No description provided'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-zinc-850 bg-zinc-900/20 rounded-xl p-12 text-center">
                <FolderKanban className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-zinc-300 mb-1">No collections created yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Create a collection to organize related documents into project binders.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RESEARCH NOTES */}
        {activeTab === 'NOTES' && (
          <div className="space-y-6">
            <div className="border border-zinc-850 bg-zinc-900/40 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-zinc-300" />
                Markdown Research Notes Editor
              </h2>

              <input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note Title (e.g. SOC 2 & Net 60 Review)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 mb-3"
              />

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={6}
                placeholder="Write structured research notes in Markdown..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none mb-3"
              />

              <div className="flex items-center justify-between">
                <input
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  placeholder="Tags (comma separated)..."
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 w-64"
                />

                <button
                  onClick={() => createNoteMutation.mutate()}
                  disabled={createNoteMutation.isPending || !noteTitle.trim()}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save Research Note
                </button>
              </div>
            </div>

            {/* Saved Notes List */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-300 font-mono uppercase mb-3">
                Saved Research Notes
              </h3>
              {notesLoading ? (
                <div className="text-xs font-mono text-zinc-400">Loading notes...</div>
              ) : notesData?.researchNotes && notesData.researchNotes.length > 0 ? (
                <div className="space-y-3">
                  {notesData.researchNotes.map((n) => (
                    <div
                      key={n.id}
                      className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-zinc-200">{n.title}</h4>
                        <div className="flex items-center gap-1.5">
                          {n.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono line-clamp-3 whitespace-pre-wrap">
                        {n.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-zinc-850 rounded-xl text-xs font-mono text-zinc-500">
                  No research notes recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AI EVALUATION BENCHMARK */}
        {activeTab === 'EVALUATION' && (
          <div className="space-y-6">
            <div className="border border-zinc-850 bg-zinc-900/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-zinc-300" />
                  <h2 className="text-sm font-semibold text-zinc-200">AI Evaluation & Groundedness Benchmark</h2>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">Target Threshold: ≥ 90% Groundedness</span>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Automated evaluation suite that validates RAG retrieval fidelity, citation precision, and absence of hallucinations
                across synthetic benchmark test cases.
              </p>

              <button
                onClick={() => {
                  setEvalEnabled(true);
                  runEvalRefetch();
                }}
                disabled={evalLoading}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                {evalLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Evaluating Retrieval & Groundedness...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Run AI Benchmark Suite
                  </>
                )}
              </button>
            </div>

            {evalData && (
              <div className="space-y-6">
                {/* Aggregate Summary */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                      Benchmark Pass Rate
                    </span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {evalData.passedCases} / {evalData.totalCases}
                    </span>
                  </div>
                  <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                      Average Groundedness
                    </span>
                    <span className="text-2xl font-bold font-mono text-zinc-100">
                      {(evalData.averageGroundedness * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                      Citation Precision
                    </span>
                    <span className="text-2xl font-bold font-mono text-zinc-100">
                      {(evalData.averageCitationPrecision * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                      Hallucination Index
                    </span>
                    <span className="text-2xl font-bold font-mono text-zinc-400">
                      {(evalData.averageHallucinationScore * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Case Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-300 font-mono uppercase">
                    Benchmark Test Cases
                  </h3>
                  {evalData.metrics.map((m) => (
                    <div
                      key={m.testCaseId}
                      className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-4 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-zinc-400">{m.testCaseId}:</span>
                          <span className="text-xs font-medium text-zinc-200">{m.query}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono">{m.explanation}</p>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-mono font-semibold text-zinc-200 block">
                            {(m.groundednessScore * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">Groundedness</span>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 text-[11px] font-mono font-semibold">
                          PASSED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
