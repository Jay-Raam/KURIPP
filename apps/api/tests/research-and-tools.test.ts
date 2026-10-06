import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionsService } from '../src/collections/service';
import { ResearchNotesService } from '../src/notes/service';
import { DeepResearchEngine } from '../src/research/engine';
import { DocumentComparisonEngine } from '../src/tools/diff';
import { AiToolRunner } from '../src/tools/runner';
import { ReportsService } from '../src/reports/service';
import { AiEvaluationHarness } from '../src/evaluation/harness';
import { WorkspaceService } from '../src/workspaces/service';

describe('Phase 8 & 9: Deep Research Studio, Collections, Notes, Tools & Evaluation Test Suite', () => {
  const mockUserId = 'usr-test-analyst';
  const mockWorkspaceId = 'ws-test-research-lab';

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(WorkspaceService, 'getMemberRole').mockResolvedValue('ADMIN' as any);
  });

  describe('Phase 8: Collections Management', () => {
    it('creates, lists, and manages collections within workspace boundaries', async () => {
      const col = await CollectionsService.createCollection(mockUserId, {
        workspaceId: mockWorkspaceId,
        name: 'Enterprise Vendor Contracts',
        description: 'Vendor MSAs, DPAs, and compliance certifications',
        color: 'zinc',
      });

      expect(col).toBeDefined();
      expect(col.name).toBe('Enterprise Vendor Contracts');
      expect(col.workspaceId).toBe(mockWorkspaceId);

      const list = await CollectionsService.listCollections(mockUserId, mockWorkspaceId);
      expect(list.length).toBeGreaterThanOrEqual(1);

      // Add document to collection
      const addOk = await CollectionsService.addDocument(mockUserId, col.id, 'doc-123');
      expect(addOk).toBe(true);

      // Remove document
      const removeOk = await CollectionsService.removeDocument(mockUserId, col.id, 'doc-123');
      expect(removeOk).toBe(true);

      // Delete collection
      const deleted = await CollectionsService.deleteCollection(mockUserId, col.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Phase 8: Research Notes with Citations', () => {
    it('creates note with persistent citations, filters by tags, and updates content', async () => {
      const note = await ResearchNotesService.createNote(mockUserId, {
        workspaceId: mockWorkspaceId,
        title: 'SOC 2 & Net 60 Risk Assessment',
        content: '# Risk Assessment\n\nPayment terms extended to Net 60 with SOC 2 compliance requirement.',
        tags: ['compliance', 'contracts', 'soc2'],
        sourceCitations: [
          { documentId: 'doc-1', documentTitle: 'Master Services Agreement', pageNumber: 4, section: 'Terms' },
        ],
      });

      expect(note).toBeDefined();
      expect(note.title).toBe('SOC 2 & Net 60 Risk Assessment');
      expect(note.tags).toContain('compliance');
      expect(note.sourceCitations).toHaveLength(1);

      // List by tag
      const notes = await ResearchNotesService.listNotes(mockUserId, mockWorkspaceId, { tag: 'compliance' });
      expect(notes.some((n: any) => n.id === note.id)).toBe(true);

      // Update
      const updated = await ResearchNotesService.updateNote(mockUserId, note.id, {
        title: 'Updated SOC 2 & Net 60 Assessment',
      });
      expect(updated.title).toBe('Updated SOC 2 & Net 60 Assessment');

      // Cleanup
      const del = await ResearchNotesService.deleteNote(mockUserId, note.id);
      expect(del).toBe(true);
    });
  });

  describe('Phase 8: Deep Research Engine Multi-Pass Synthesis', () => {
    it('decomposes complex research objective into 3+ strategic sub-queries', () => {
      const objective = 'Analyze enterprise data privacy compliance and vendor liability caps across contracts';
      const subQueries = DeepResearchEngine.decomposeObjective(objective);

      expect(subQueries.length).toBeGreaterThanOrEqual(3);
      expect(subQueries[0]).toBe(objective);
      expect(subQueries.some((q) => q.includes('compliance') || q.includes('liability'))).toBe(true);
    });

    it('executes multi-pass deep research synthesis and generates grounded findings', async () => {
      const res = await DeepResearchEngine.runDeepResearch(mockUserId, {
        workspaceId: mockWorkspaceId,
        objective: 'Assess vendor SLA guarantees and limitation of liability clauses',
      });

      expect(res).toBeDefined();
      expect(res.subQueries.length).toBeGreaterThanOrEqual(3);
      expect(res.documentsAnalyzed).toBeGreaterThanOrEqual(1);
      expect(res.synthesisMarkdown).toContain('Deep Research Synthesis');
      expect(res.synthesisMarkdown).toContain('Executive Summary');
      expect(res.keyFindings.length).toBeGreaterThanOrEqual(1);
      expect(res.strategicRecommendations.length).toBeGreaterThanOrEqual(1);
      expect(res.executionTimeMs).toBeGreaterThan(0);
    });
  });

  describe('Phase 9: Document Comparison Engine', () => {
    it('detects altered provisions, additions, and deletions between two document versions', async () => {
      const baseClauses = [
        'Payment Terms: Invoices shall be paid within Net 30 days of receipt.',
        'Limitation of Liability: Total liability shall not exceed twelve (12) months fees.',
        'Governing Law: This Agreement is governed by California law.',
        'Obsolete Clause: Terminated provision no longer applicable.',
      ];

      const targetClauses = [
        'Payment Terms: Invoices shall be paid within Net 60 days of receipt.',
        'Limitation of Liability: Total liability shall not exceed twenty-four (24) months fees.',
        'Governing Law: This Agreement is governed by California law.',
        'Data Security: Vendor must maintain SOC 2 Type II certification.',
      ];

      const diff = DocumentComparisonEngine.computeClauseDiff(baseClauses, targetClauses);

      expect(diff.modifiedCount).toBeGreaterThanOrEqual(2); // Net 30 -> Net 60, 12 months -> 24 months
      expect(diff.addedCount).toBeGreaterThanOrEqual(1); // Data Security
      expect(diff.removedCount).toBeGreaterThanOrEqual(1); // Obsolete Clause
      expect(diff.segments.some((s) => s.type === 'UNCHANGED' && s.text.includes('California'))).toBe(true);
    });

    it('generates executive comparison diff and AI analysis', async () => {
      const diffResult = await DocumentComparisonEngine.compareDocuments(mockUserId, {
        workspaceId: mockWorkspaceId,
        baseDocumentId: 'doc-v1',
        targetDocumentId: 'doc-v2',
        title: 'Master Service Agreement: 2024 vs 2026 Revision',
      });

      expect(diffResult).toBeDefined();
      expect(diffResult.title).toBe('Master Service Agreement: 2024 vs 2026 Revision');
      expect(diffResult.summary).toContain('Identified');
      expect(diffResult.aiAnalysis).toContain('Executive Comparison Analysis');
      expect(diffResult.segments.length).toBeGreaterThan(0);
    });
  });

  describe('Phase 9: AI Tool Runner', () => {
    it('executes searchDocuments, getDocument, and compareDocuments tools safely', async () => {
      const searchRun = await AiToolRunner.execute(mockUserId, {
        workspaceId: mockWorkspaceId,
        toolName: 'searchDocuments',
        parameters: { query: 'liability limit', limit: 3 },
      });

      expect(searchRun.status).toBe('SUCCESS');
      expect(searchRun.toolName).toBe('searchDocuments');

      const compareRun = await AiToolRunner.execute(mockUserId, {
        workspaceId: mockWorkspaceId,
        toolName: 'compareDocuments',
        parameters: { baseDocumentId: 'doc-1', targetDocumentId: 'doc-2' },
      });

      expect(compareRun.status).toBe('SUCCESS');
      expect(compareRun.outputPayload.comparison).toBeDefined();
    });
  });

  describe('Phase 9: Report Generator Service', () => {
    it('generates and persists structured executive intelligence briefs', async () => {
      const report = await ReportsService.generateReport(mockUserId, {
        workspaceId: mockWorkspaceId,
        title: 'Executive Intelligence Brief: Q4 Risk Matrix',
        format: 'MARKDOWN',
        prompt: 'Synthesize vendor risk and technical compliance across agreements',
      });

      expect(report).toBeDefined();
      expect(report.title).toBe('Executive Intelligence Brief: Q4 Risk Matrix');
      expect(report.content).toContain('Executive Summary');
      expect(report.content).toContain('Evidence Matrix');

      const list = await ReportsService.listReports(mockUserId, mockWorkspaceId);
      expect(list.some((r) => r.id === report.id)).toBe(true);

      const del = await ReportsService.deleteReport(mockUserId, report.id);
      expect(del).toBe(true);
    });
  });

  describe('Phase 9: AI Evaluation Benchmark Harness', () => {
    it('measures groundedness, citation precision, and hallucination index meeting >= 90% threshold', async () => {
      const evalSummary = await AiEvaluationHarness.evaluateWorkspace(mockWorkspaceId, mockUserId);

      expect(evalSummary.totalCases).toBe(4);
      expect(evalSummary.passedCases).toBe(4);
      expect(evalSummary.averageGroundedness).toBeGreaterThanOrEqual(0.90);
      expect(evalSummary.averageCitationPrecision).toBeGreaterThanOrEqual(0.85);
      expect(evalSummary.averageHallucinationScore).toBeLessThanOrEqual(0.10);

      for (const metric of evalSummary.metrics) {
        expect(metric.isPassed).toBe(true);
        expect(metric.groundednessScore).toBeGreaterThanOrEqual(0.90);
      }
    });
  });
});
