import { describe, it, expect } from 'vitest';
import { ChatService } from '../src/chat/service';
import { hasPermission, requirePermission } from '../src/workspaces/rbac';

describe('Phase 6 & 7: Hybrid Search & Conversational Workspace Test Suite', () => {
  const testWorkspaceId = '00000000-0000-0000-0000-000000000001';
  const testUserId = '00000000-0000-0000-0000-000000000002';

  describe('Chat Session Lifecycle', () => {
    it('creates a new research session with specified mode and model', async () => {
      // Mock membership
      const session = await ChatService.createSession(testUserId, {
        workspaceId: testWorkspaceId,
        title: 'Quantum Algorithms Synthesis',
        mode: 'RESEARCH',
        model: 'meta-llama/llama-3.3-70b-instruct:free',
      });

      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
      expect(session.workspaceId).toBe(testWorkspaceId);
      expect(session.title).toBe('Quantum Algorithms Synthesis');
      expect(session.mode).toBe('RESEARCH');
      expect(session.messageCount).toBe(0);
    });

    it('retrieves session list for a workspace', async () => {
      const sessions = await ChatService.listSessions(testUserId, testWorkspaceId);
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThan(0);
    });

    it('sends user message and returns assistant response with citations array', async () => {
      const session = await ChatService.createSession(testUserId, {
        workspaceId: testWorkspaceId,
        title: 'Hybrid Retrieval Grounding Test',
        mode: 'ASK',
      });

      const response = await ChatService.sendMessage(testUserId, {
        sessionId: session.id,
        workspaceId: testWorkspaceId,
        content: 'Explain how Grover algorithm achieves quadratic acceleration',
        mode: 'ASK',
      });

      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
      expect(response.content).toBeTruthy();
      expect(Array.isArray(response.citations)).toBe(true);
    });

    it('loads session message history preserving user and assistant messages', async () => {
      const session = await ChatService.createSession(testUserId, {
        workspaceId: testWorkspaceId,
        title: 'Conversation History Verification',
      });

      await ChatService.sendMessage(testUserId, {
        sessionId: session.id,
        workspaceId: testWorkspaceId,
        content: 'What is Reciprocal Rank Fusion?',
      });

      const detail = await ChatService.getSession(testUserId, session.id);
      expect(detail).toBeDefined();
      expect(detail?.session.id).toBe(session.id);
      expect(detail?.messages.length).toBe(2);
      expect(detail?.messages[0]?.role).toBe('user');
      expect(detail?.messages[1]?.role).toBe('assistant');
    });

    it('deletes chat session and associated messages', async () => {
      const session = await ChatService.createSession(testUserId, {
        workspaceId: testWorkspaceId,
        title: 'Session To Delete',
      });

      const deleted = await ChatService.deleteSession(testUserId, session.id);
      expect(deleted).toBe(true);

      const afterDelete = await ChatService.getSession(testUserId, session.id);
      expect(afterDelete).toBeNull();
    });
  });

  describe('Conversational RBAC Authorization', () => {
    it('grants VIEWER chat:read but strictly denies chat:create', () => {
      expect(hasPermission('VIEWER', 'chat:read')).toBe(true);
      expect(hasPermission('VIEWER', 'chat:create')).toBe(false);

      expect(() => requirePermission('VIEWER', 'chat:create')).toThrowError(
        /Forbidden: Role 'VIEWER' lacks permission 'chat:create'/
      );
    });

    it('permits MEMBER, ADMIN, and OWNER to participate in conversations', () => {
      for (const role of ['MEMBER', 'ADMIN', 'OWNER'] as const) {
        expect(hasPermission(role, 'chat:read')).toBe(true);
        expect(hasPermission(role, 'chat:create')).toBe(true);
        expect(() => requirePermission(role, 'chat:create')).not.toThrow();
      }
    });
  });
});
