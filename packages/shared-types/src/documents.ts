export type DocumentProcessingStatus =
  | 'UPLOADING'
  | 'UPLOADED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'EXTRACTING'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'INDEXING'
  | 'READY'
  | 'FAILED';

export interface DocumentMetadata {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  title: string;
  mimeType: string;
  fileSize: number;
  r2ObjectKey: string;
  status: DocumentProcessingStatus;
  currentVersion: number;
  errorMessage?: string | null;
  pageCount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: number;
  documentId: string;
  versionId: string;
  workspaceId: string;
  pageNumber?: number | null;
  sectionHeading?: string | null;
  chunkIndex: number;
  content: string;
  tokenCount: number;
}
