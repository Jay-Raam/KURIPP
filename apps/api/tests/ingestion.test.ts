import { describe, it, expect } from 'vitest';
import { AIClient } from '../src/ai/client';
import { hasPermission, requirePermission } from '../src/workspaces/rbac';

describe('Phase 5: Document Ingestion, Semantic Chunking & AI Client Test Suite', () => {
  describe('AI Client Processing & Fallback', () => {
    it('successfully processes structured text and generates semantic chunks', async () => {
      const sampleText = `
# Executive Overview
KURIPP is an AI-powered enterprise knowledge platform built for precision research.

## Hybrid Search Architecture
By combining PostgreSQL HNSW cosine distance vectors with tsvector lexical search via Reciprocal Rank Fusion,
retrieval recall is substantially superior to standalone dense or sparse search.

## Vector Indexing
PostgreSQL 17 stores 1536-dimensional dense embeddings directly in document_chunks with HNSW indexing.
      `.trim();

      const result = await AIClient.processDocument({
        documentId: 'doc-phase-5-test',
        title: 'KURIPP Whitepaper',
        mimeType: 'text/markdown',
        content: sampleText,
      });

      expect(result).toBeDefined();
      expect(result.document_id).toBe('doc-phase-5-test');
      expect(result.chunk_count).toBeGreaterThan(0);
      expect(result.chunks.length).toBe(result.chunk_count);

      const firstChunk = result.chunks[0];
      expect(firstChunk).toBeDefined();
      expect(firstChunk?.content).toBeTruthy();
      expect(firstChunk?.token_count).toBeGreaterThan(0);
      expect(firstChunk?.chunk_index).toBe(0);
    });

    it('generates normalized dense embedding vectors for generated chunks', async () => {
      const result = await AIClient.processDocument({
        documentId: 'doc-embed-test',
        title: 'Embedding Verification Test',
        mimeType: 'text/plain',
        content: 'Verification of high-dimensional vector representations for semantic similarity and cosine clustering.',
      });

      expect(result.chunks.length).toBeGreaterThan(0);
      const chunk = result.chunks[0];
      expect(chunk?.embedding).toBeDefined();
      expect(chunk?.embedding?.length).toBe(1536);
    });
  });

  describe('Document Ingestion RBAC Enforcement', () => {
    it('permits OWNER and ADMIN to trigger document ingestion and re-indexing', () => {
      expect(hasPermission('OWNER', 'document:create')).toBe(true);
      expect(hasPermission('ADMIN', 'document:create')).toBe(true);
      expect(() => requirePermission('OWNER', 'document:create')).not.toThrow();
      expect(() => requirePermission('ADMIN', 'document:create')).not.toThrow();
    });

    it('permits MEMBER to trigger document processing', () => {
      expect(hasPermission('MEMBER', 'document:create')).toBe(true);
      expect(() => requirePermission('MEMBER', 'document:create')).not.toThrow();
    });

    it('strictly denies VIEWER from triggering document processing', () => {
      expect(hasPermission('VIEWER', 'document:create')).toBe(false);
      expect(() => requirePermission('VIEWER', 'document:create')).toThrowError(
        /Forbidden: Role 'VIEWER' lacks permission 'document:create'/
      );
    });
  });
});
