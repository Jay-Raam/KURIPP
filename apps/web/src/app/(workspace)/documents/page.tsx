'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
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
  createdAt: string;
  updatedAt: string;
}

export default function DocumentVaultPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PDF' | 'DOCS' | 'DATA' | 'CODE' | 'IMAGES'>('ALL');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load documents for current workspace
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
  });

  const documents = documentsData?.documents || [];

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-zinc-100">
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
            <WorkspaceSwitcher />
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition-colors"
            >
              Home
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
                    <th className="py-3 px-4">Vaulted Date</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60 text-xs">
                  {filteredDocuments.map((doc) => {
                    const mimeInfo = getMimeBadge(doc.mimeType);
                    const MimeIcon = mimeInfo.icon;
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
                          {new Date(doc.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownload(doc)}
                              title="Download original file"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
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
    </div>
  );
}
