'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { CommandPaletteTrigger } from '@/components/command-palette';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphqlClient } from '@/lib/graphql-client';
import {
  FileText,
  UploadCloud,
  Trash2,
  Download,
  Loader2,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  FileCode,
  FileSpreadsheet,
  FileImage,
  File,
  Layers,
  Cpu,
  Eye,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

const GET_DOCUMENTS_QUERY = gql`
  query GetDocuments($workspaceId: ID!) {
    documents(workspaceId: $workspaceId) {
      id
      workspaceId
      title
      mimeType
      fileSize
      status
      currentVersion
      errorMessage
      pageCount
      chunkCount
      createdAt
      updatedAt
    }
  }
`;

const CREATE_UPLOAD_MUTATION = gql`
  mutation CreateDocumentUpload($input: CreateDocumentUploadInput!) {
    createDocumentUpload(input: $input) {
      documentId
      uploadUrl
      objectKey
      expiresInSeconds
    }
  }
`;

const CONFIRM_UPLOAD_MUTATION = gql`
  mutation ConfirmDocumentUpload($input: ConfirmDocumentUploadInput!) {
    confirmDocumentUpload(input: $input) {
      id
      status
      title
    }
  }
`;

const PROCESS_DOCUMENT_MUTATION = gql`
  mutation ProcessDocument($id: ID!) {
    processDocument(id: $id) {
      id
      status
      pageCount
      chunkCount
      errorMessage
    }
  }
`;

const DELETE_DOCUMENT_MUTATION = gql`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`;

const GET_DOWNLOAD_URL_QUERY = gql`
  query GetDocumentDownloadUrl($id: ID!) {
    documentDownloadUrl(id: $id) {
      downloadUrl
      expiresInSeconds
    }
  }
`;

const GET_DOCUMENT_CHUNKS_QUERY = gql`
  query GetDocumentChunks($documentId: ID!) {
    documentChunks(documentId: $documentId) {
      id
      documentId
      workspaceId
      pageNumber
      sectionHeading
      chunkIndex
      content
      tokenCount
      createdAt
    }
  }
`;

interface VaultDocument {
  id: string;
  workspaceId: string;
  title: string;
  mimeType: string;
  fileSize: number;
  status: string;
  currentVersion: number;
  errorMessage?: string | null;
  pageCount?: number | null;
  chunkCount?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface DocumentChunkItem {
  id: string;
  documentId: string;
  workspaceId: string;
  pageNumber?: number | null;
  sectionHeading?: string | null;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  createdAt: string;
}

export default function DocumentVaultPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PDF' | 'DOCS' | 'DATA' | 'CODE' | 'IMAGES'>('ALL');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

  // Chunk Inspector Drawer state
  const [inspectingDoc, setInspectingDoc] = useState<VaultDocument | null>(null);
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load documents for current workspace with reactive polling if any doc is processing
  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return { documents: [] };
      return graphqlClient.request<{ documents: VaultDocument[] }>(
        GET_DOCUMENTS_QUERY,
        { workspaceId: currentWorkspace.id }
      );
    },
    enabled: !!currentWorkspace?.id,
    refetchInterval: (query) => {
      const docs = query.state.data?.documents || [];
      const hasActive = docs.some((d) =>
        ['UPLOADING', 'UPLOADED', 'QUEUED', 'PROCESSING', 'EXTRACTING', 'CHUNKING', 'EMBEDDING', 'INDEXING'].includes(d.status)
      );
      return hasActive ? 2500 : false;
    },
  });

  const documents = documentsData?.documents || [];

  // Load chunks for selected inspection document
  const { data: chunksData, isLoading: chunksLoading } = useQuery({
    queryKey: ['document-chunks', inspectingDoc?.id],
    queryFn: async () => {
      if (!inspectingDoc?.id) return { documentChunks: [] };
      return graphqlClient.request<{ documentChunks: DocumentChunkItem[] }>(
        GET_DOCUMENT_CHUNKS_QUERY,
        { documentId: inspectingDoc.id }
      );
    },
    enabled: !!inspectingDoc?.id,
  });

  const chunks = chunksData?.documentChunks || [];

  // Process Document mutation
  const processMutation = useMutation({
    mutationFn: async (id: string) => {
      return graphqlClient.request<{ processDocument: VaultDocument }>(
        PROCESS_DOCUMENT_MUTATION,
        { id }
      );
    },
    onSuccess: (data) => {
      toast.success(
        `Document processed! Extracted ${data.processDocument.chunkCount ?? 0} semantic chunks.`
      );
      queryClient.invalidateQueries({ queryKey: ['documents', currentWorkspace?.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to process document');
      queryClient.invalidateQueries({ queryKey: ['documents', currentWorkspace?.id] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return graphqlClient.request<{ deleteDocument: boolean }>(
        DELETE_DOCUMENT_MUTATION,
        { id }
      );
    },
    onSuccess: () => {
      toast.success('Document deleted from vault');
      queryClient.invalidateQueries({ queryKey: ['documents', currentWorkspace?.id] });
      if (inspectingDoc) setInspectingDoc(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete document');
    },
  });

  const handleDownload = async (doc: VaultDocument) => {
    try {
      toast.info(`Preparing secure download for ${doc.title}...`);
      const response = await graphqlClient.request<{
        documentDownloadUrl: { downloadUrl: string };
      }>(GET_DOWNLOAD_URL_QUERY, { id: doc.id });

      const url = response.documentDownloadUrl.downloadUrl;
      window.open(url, '_blank');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      toast.error(msg);
    }
  };

  const uploadFile = async (file: File) => {
    if (!currentWorkspace?.id) {
      toast.error('Select a workspace before uploading documents');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error(`File exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
      return;
    }

    setUploadingFileName(file.name);
    setUploadProgress(5);

    try {
      // Step 1: Request presigned upload URL via GraphQL
      const createRes = await graphqlClient.request<{
        createDocumentUpload: {
          documentId: string;
          uploadUrl: string;
          objectKey: string;
        };
      }>(CREATE_UPLOAD_MUTATION, {
        input: {
          workspaceId: currentWorkspace.id,
          title: file.name,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
        },
      });

      const { documentId, uploadUrl } = createRes.createDocumentUpload;
      setUploadProgress(25);

      // Step 2: Stream binary directly to S3 / Cloudflare R2
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round(25 + (evt.loaded / evt.total) * 60);
            setUploadProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage error: HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network failure uploading binary to storage'));
        xhr.send(file);
      });

      setUploadProgress(90);

      // Step 3: Confirm upload completion in GraphQL API
      await graphqlClient.request(CONFIRM_UPLOAD_MUTATION, {
        input: {
          documentId,
        },
      });

      setUploadProgress(100);
      toast.success(`Vaulted ${file.name}`);
      queryClient.invalidateQueries({ queryKey: ['documents', currentWorkspace.id] });

      // Automatically trigger AI processing
      processMutation.mutate(documentId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setTimeout(() => {
        setUploadProgress(null);
        setUploadingFileName(null);
      }, 800);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadFile(files[0]);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      uploadFile(files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChunkId(id);
    toast.success('Chunk text copied');
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  const getMimeBadge = (mime: string) => {
    const lower = mime.toLowerCase();
    if (lower.includes('pdf')) return { label: 'PDF', icon: FileText, color: 'text-zinc-200 bg-zinc-800' };
    if (lower.includes('word') || lower.includes('docx')) return { label: 'DOCX', icon: FileText, color: 'text-zinc-300 bg-zinc-800/80' };
    if (lower.includes('presentation') || lower.includes('powerpoint')) return { label: 'PPTX', icon: Layers, color: 'text-amber-300 bg-amber-950/40' };
    if (lower.includes('sheet') || lower.includes('excel') || lower.includes('csv')) return { label: 'SPREADSHEET', icon: FileSpreadsheet, color: 'text-emerald-300 bg-emerald-950/40' };
    if (lower.includes('markdown') || lower.includes('plain')) return { label: 'MARKDOWN', icon: FileCode, color: 'text-zinc-300 bg-zinc-800' };
    if (lower.includes('image')) return { label: 'IMAGE', icon: FileImage, color: 'text-zinc-300 bg-zinc-800' };
    return { label: 'DOC', icon: File, color: 'text-zinc-400 bg-zinc-900' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3" />
            READY
          </span>
        );
      case 'UPLOADING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-zinc-900 text-zinc-300 border border-zinc-700 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            UPLOADING
          </span>
        );
      case 'UPLOADED':
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-950/50 text-amber-300 border border-amber-850/50">
            <Layers className="w-3 h-3" />
            {status}
          </span>
        );
      case 'PROCESSING':
      case 'EXTRACTING':
      case 'CHUNKING':
      case 'EMBEDDING':
      case 'INDEXING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-zinc-900 text-zinc-200 border border-zinc-700">
            <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
            {status}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-rose-950/60 text-rose-400 border border-rose-800/60">
            <AlertTriangle className="w-3 h-3" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-400">
            {status}
          </span>
        );
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedFilter === 'ALL') return true;
    const lowerMime = doc.mimeType.toLowerCase();
    if (selectedFilter === 'PDF') return lowerMime.includes('pdf');
    if (selectedFilter === 'DOCS') return lowerMime.includes('word') || lowerMime.includes('docx') || lowerMime.includes('presentation');
    if (selectedFilter === 'DATA') return lowerMime.includes('csv') || lowerMime.includes('sheet') || lowerMime.includes('excel');
    if (selectedFilter === 'CODE') return lowerMime.includes('markdown') || lowerMime.includes('plain');
    if (selectedFilter === 'IMAGES') return lowerMime.includes('image');
    return true;
  });

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin mr-3 text-zinc-300" />
        <span className="font-mono text-sm tracking-wide">INITIALIZING VAULT CONTEXT...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-zinc-100 relative">
      {/* Top Header / Breadcrumbs */}
      <header className="border-b border-zinc-850 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-zinc-200">
              KV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-zinc-400 font-mono">WORKSPACE</span>
                <span className="text-zinc-600">/</span>
                <span className="text-sm font-semibold text-zinc-200">{currentWorkspace?.name || 'Default Workspace'}</span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">Enterprise Research & Document Vault</p>
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
              href="/chat"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition-colors"
            >
              Research Chat
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload Document
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
              accept=".pdf,.docx,.doc,.pptx,.xlsx,.xls,.csv,.txt,.md,.png,.jpg,.jpeg,.webp,.html"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Upload Dropzone Banner */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer text-center relative overflow-hidden ${
            isDragging
              ? 'border-zinc-400 bg-zinc-900/60'
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/40'
          }`}
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <UploadCloud className="w-6 h-6 text-zinc-300" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-200">
                Drop research documents or <span className="underline text-zinc-100">browse files</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Supports PDF, DOCX, PPTX, XLSX, CSV, Markdown, Plain Text & High-Res Images up to 50MB
              </p>
            </div>
          </div>

          {uploadProgress !== null && (
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center px-6">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 truncate max-w-[200px]">{uploadingFileName}</span>
                  <span className="text-zinc-400">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-200 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400 font-mono text-center">
                  DIRECT ENCRYPTED STREAMING TO STORAGE
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Search & Category Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, extension, or topic..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'ALL', label: 'All Artifacts' },
                { id: 'PDF', label: 'PDFs' },
                { id: 'DOCS', label: 'Documents' },
                { id: 'DATA', label: 'Datasets/Tables' },
                { id: 'CODE', label: 'Markdown/Code' },
                { id: 'IMAGES', label: 'Images' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedFilter === filter.id
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Table / Grid */}
        <div className="border border-zinc-850 rounded-xl bg-zinc-900/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Vaulted Documents</h2>
              <span className="text-xs font-mono text-zinc-400 ml-2">
                ({filteredDocuments.length} {filteredDocuments.length === 1 ? 'item' : 'items'})
              </span>
            </div>
            <div className="text-xs font-mono text-zinc-400">
              ROLE: {currentWorkspace?.role || 'VIEWER'}
            </div>
          </div>

          {documentsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              <span className="text-xs font-mono">LOADING VAULT REGISTRY...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm text-zinc-400 font-medium">No documents found</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No matching artifacts found for "${searchQuery}" in this workspace.`
                  : 'Drop your first research paper, dataset, or notes above to begin.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 text-[11px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-950/40">
                    <th className="py-3 px-6">Document Title</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Intelligence Status</th>
                    <th className="py-3 px-4">Chunks / Pages</th>
                    <th className="py-3 px-4">Vaulted Date</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60 text-xs">
                  {filteredDocuments.map((doc) => {
                    const mimeInfo = getMimeBadge(doc.mimeType);
                    const MimeIcon = mimeInfo.icon;
                    const isProcessing = ['PROCESSING', 'EXTRACTING', 'CHUNKING', 'EMBEDDING', 'INDEXING'].includes(doc.status);

                    return (
                      <tr key={doc.id} className="hover:bg-zinc-900/40 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
                              <MimeIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-zinc-200 truncate max-w-md group-hover:text-zinc-100">
                                {doc.title}
                              </p>
                              {doc.errorMessage && (
                                <p className="text-[11px] text-rose-400 truncate max-w-sm mt-0.5">
                                  {doc.errorMessage}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono uppercase ${mimeInfo.color}`}
                          >
                            {mimeInfo.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-zinc-400">
                          {formatFileSize(doc.fileSize)}
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(doc.status)}</td>
                        <td className="py-4 px-4 font-mono text-zinc-400">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px]">
                              {doc.chunkCount ?? 0} chunks
                            </span>
                            {doc.pageCount && doc.pageCount > 1 && (
                              <span className="text-[11px] text-zinc-500">
                                {doc.pageCount} pgs
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-zinc-400">
                          {new Date(doc.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Inspect Chunks Button */}
                            <button
                              onClick={() => setInspectingDoc(doc)}
                              title="Inspect semantic chunks and token distribution"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Trigger AI Processing Button */}
                            <button
                              onClick={() => processMutation.mutate(doc.id)}
                              disabled={isProcessing}
                              title="Run AI layout parser, chunker & embeddings"
                              className={`p-1.5 rounded-lg transition-colors ${
                                isProcessing
                                  ? 'text-zinc-600 cursor-not-allowed'
                                  : 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/30'
                              }`}
                            >
                              <Cpu className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                            </button>

                            {/* Download Button */}
                            <button
                              onClick={() => handleDownload(doc)}
                              title="Download original file"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                if (
                                  confirm(`Are you sure you want to permanently delete "${doc.title}"?`)
                                ) {
                                  deleteMutation.mutate(doc.id);
                                }
                              }}
                              title="Delete document"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Slide-Over Semantic Chunks Inspector Drawer */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-800 flex items-start justify-between bg-zinc-900/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    SEMANTIC CHUNK INSPECTOR
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300">
                    {chunks.length} chunks
                  </span>
                </div>
                <h3 className="text-base font-semibold text-zinc-100 truncate max-w-lg">
                  {inspectingDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chunks List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chunksLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                  <span className="text-xs font-mono">LOADING EMBEDDED CHUNKS...</span>
                </div>
              ) : chunks.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <Cpu className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-sm font-medium text-zinc-300">No chunks generated yet</p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Click the CPU icon on the document to run the layout parser and semantic boundary chunker.
                  </p>
                  <button
                    onClick={() => processMutation.mutate(inspectingDoc.id)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Cpu className="w-4 h-4" />
                    Process Document Now
                  </button>
                </div>
              ) : (
                chunks.map((chk) => (
                  <div
                    key={chk.id}
                    className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700 transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-400 text-[11px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                          #{chk.chunkIndex}
                        </span>
                        {chk.sectionHeading && (
                          <span className="font-mono text-zinc-300 text-[11px] bg-zinc-800/60 px-2 py-0.5 rounded truncate max-w-xs">
                            {chk.sectionHeading}
                          </span>
                        )}
                        {chk.pageNumber && (
                          <span className="text-[11px] text-zinc-500 font-mono">
                            Page {chk.pageNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-zinc-500">
                          {chk.tokenCount} tokens
                        </span>
                        <button
                          onClick={() => copyToClipboard(chk.content, chk.id)}
                          className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                          title="Copy chunk content"
                        >
                          {copiedChunkId === chk.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-300 leading-relaxed font-sans bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {chk.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
