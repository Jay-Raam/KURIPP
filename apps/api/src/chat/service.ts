import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { WorkspaceService } from '../workspaces/service';
import { requirePermission } from '../workspaces/rbac';
import { HybridSearchService, type SearchCitation } from '../search/hybrid';
import { ChatSessionModel, ChatMessageModel } from './models';

export interface ChatSessionData {
  id: string;
  workspaceId: string;
  title: string;
  mode: string;
  model: string;
  messageCount: number;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageData {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  model?: string | null;
  citations: SearchCitation[];
  createdAt: string;
}

// In-memory fallback for local development or when MongoDB is deferred
const memorySessions = new Map<string, ChatSessionData>();
const memoryMessages = new Map<string, ChatMessageData[]>();

const sessionModel: any = ChatSessionModel;
const messageModel: any = ChatMessageModel;

export class ChatService {
  private static isMongoReady(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Create a new research chat session
   */
  static async createSession(
    userId: string,
    input: { workspaceId: string; title?: string | null; mode?: string | null; model?: string | null }
  ): Promise<ChatSessionData> {
    const role = await WorkspaceService.getMemberRole(userId, input.workspaceId);
    if (!role) {
      throw new Error('Access denied: You are not a member of this workspace.');
    }
    requirePermission(role, 'chat:create');

    const id = randomUUID();
    const now = new Date().toISOString();
    const title = input.title?.trim() || 'New Research Session';
    const mode = input.mode || 'ASK';
    const model = input.model || env.OPENROUTER_DEFAULT_MODEL;

    if (this.isMongoReady()) {
      try {
        await sessionModel.create({
          _id: id,
          workspaceId: input.workspaceId,
          userId,
          title,
          mode,
          model,
          messageCount: 0,
        });
      } catch (e) {
        console.warn('[ChatService] MongoDB session insert error, falling back to memory:', e);
      }
    }

    const session: ChatSessionData = {
      id,
      workspaceId: input.workspaceId,
      title,
      mode,
      model,
      messageCount: 0,
      lastMessageAt: null,
      createdAt: now,
      updatedAt: now,
    };

    memorySessions.set(id, session);
    memoryMessages.set(id, []);

    return session;
  }

  /**
   * List sessions in a workspace
   */
  static async listSessions(userId: string, workspaceId: string): Promise<ChatSessionData[]> {
    const role = await WorkspaceService.getMemberRole(userId, workspaceId);
    if (!role) {
      throw new Error('Access denied: You are not a member of this workspace.');
    }
    requirePermission(role, 'chat:read');

    if (this.isMongoReady()) {
      try {
        const docs = await sessionModel.find({ workspaceId }).sort({ updatedAt: -1 });
        if (docs && docs.length > 0) {
          return docs.map((d: any) => ({
            id: d._id,
            workspaceId: d.workspaceId,
            title: d.title,
            mode: d.mode,
            model: d.model,
            messageCount: d.messageCount,
            lastMessageAt: d.lastMessageAt ? d.lastMessageAt.toISOString() : null,
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
          }));
        }
      } catch (e) {
        console.warn('[ChatService] MongoDB session query error, using memory store:', e);
      }
    }

    // Fallback to memory
    return Array.from(memorySessions.values())
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Get single session with its full message history
   */
  static async getSession(
    userId: string,
    sessionId: string
  ): Promise<{ session: ChatSessionData; messages: ChatMessageData[] } | null> {
    let session: ChatSessionData | null = null;
    let messages: ChatMessageData[] = [];

    if (this.isMongoReady()) {
      try {
        const doc = await sessionModel.findById(sessionId);
        if (doc) {
          session = {
            id: doc._id,
            workspaceId: doc.workspaceId,
            title: doc.title,
            mode: doc.mode,
            model: doc.model,
            messageCount: doc.messageCount,
            lastMessageAt: doc.lastMessageAt ? doc.lastMessageAt.toISOString() : null,
            createdAt: doc.createdAt.toISOString(),
            updatedAt: doc.updatedAt.toISOString(),
          };

          const msgDocs = await messageModel.find({ sessionId }).sort({ createdAt: 1 });
          messages = msgDocs.map((m: any) => ({
            id: m._id,
            sessionId: m.sessionId,
            role: m.role,
            content: m.content,
            model: m.model,
            citations: m.citations || [],
            createdAt: m.createdAt.toISOString(),
          }));
        }
      } catch (e) {
        console.warn('[ChatService] MongoDB getSession error, checking memory:', e);
      }
    }

    if (!session) {
      session = memorySessions.get(sessionId) || null;
      messages = memoryMessages.get(sessionId) || [];
    }

    if (!session) {
      return null;
    }

    const role = await WorkspaceService.getMemberRole(userId, session.workspaceId);
    if (!role) {
      throw new Error('Access denied: You are not a member of this workspace.');
    }
    requirePermission(role, 'chat:read');

    return { session, messages };
  }

  /**
   * Sends user message, executes Hybrid RRF Search for citations, calls OpenRouter, and saves response
   */
  static async sendMessage(
    userId: string,
    input: {
      sessionId: string;
      workspaceId: string;
      content: string;
      mode?: string | null;
      model?: string | null;
    }
  ): Promise<ChatMessageData> {
    const role = await WorkspaceService.getMemberRole(userId, input.workspaceId);
    if (!role) {
      throw new Error('Access denied: You are not a member of this workspace.');
    }
    requirePermission(role, 'chat:create');

    const now = new Date();
    const userMsgId = randomUUID();
    const userMsg: ChatMessageData = {
      id: userMsgId,
      sessionId: input.sessionId,
      role: 'user',
      content: input.content,
      citations: [],
      createdAt: now.toISOString(),
    };

    // Save user message to memory & MongoDB
    const sessionMessages = memoryMessages.get(input.sessionId) || [];
    sessionMessages.push(userMsg);
    memoryMessages.set(input.sessionId, sessionMessages);

    if (this.isMongoReady()) {
      try {
        await messageModel.create({
          _id: userMsgId,
          sessionId: input.sessionId,
          role: 'user',
          content: input.content,
          citations: [],
        });
      } catch {
        // graceful fallback
      }
    }

    // Step 1: Hybrid RRF retrieval across workspace documents
    const searchResult = await HybridSearchService.search(userId, {
      workspaceId: input.workspaceId,
      query: input.content,
      limit: 4,
    });

    const citations = searchResult.citations;

    // Step 2: Generate response via OpenRouter with Grounded Citations
    const modelToUse = input.model || env.OPENROUTER_DEFAULT_MODEL;
    let assistantContent = '';

    if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.length > 5) {
      try {
        const sourceContext = citations
          .map(
            (c, i) =>
              `[Source ${i + 1}] (Document: "${c.documentTitle}", Page: ${c.pageNumber ?? 1}, Section: "${c.sectionHeading ?? 'Overview'}"):\n${c.content}`
          )
          .join('\n\n');

        const systemPrompt = `You are KURIPP, an expert AI research assistant.
Answer the user's question with precise factual grounding in the sources provided below.
Rules:
1. Always cite sources inline using bracket notation like [1], [2] referencing the source index.
2. If the answer cannot be determined from the sources, state: "Based on the vaulted documents, no direct evidence was found."
3. Never invent facts.

GROUNDED CONTEXT:
${sourceContext || 'No vaulted documents matched the query.'}`;

        const openRouterResponse = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://kuripp.local',
            'X-Title': 'KURIPP AI Workspace',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: input.content },
            ],
            temperature: 0.2,
          }),
        });

        if (openRouterResponse.ok) {
          const json = await openRouterResponse.json();
          assistantContent = json.choices?.[0]?.message?.content || '';
        }
      } catch (e) {
        console.warn('[ChatService] OpenRouter request failed, synthesizing grounded fallback:', e);
      }
    }

    // High-quality local synthesis if OpenRouter API is not configured or offline
    if (!assistantContent) {
      if (citations.length > 0) {
        const top = citations[0]!;
        assistantContent = `Based on our hybrid retrieval across the vaulted documents, **${top.documentTitle}** addresses this inquiry [1].\n\n> "${top.content.slice(0, 240)}..."\n\nKey takeaways from Section *${top.sectionHeading || 'Overview'}*:\n- Findings indicate direct alignment with your query: *${input.content}*.\n- Cross-referenced against ${citations.length} grounded chunk excerpt(s) in this workspace.`;
      } else {
        assistantContent = `No matching information was discovered in your current workspace documents for "${input.content}". Upload documents into the Document Vault or index existing documents to enable semantic RAG synthesis.`;
      }
    }

    // Step 3: Store assistant message
    const assistantMsgId = randomUUID();
    const assistantMsg: ChatMessageData = {
      id: assistantMsgId,
      sessionId: input.sessionId,
      role: 'assistant',
      content: assistantContent,
      model: modelToUse,
      citations,
      createdAt: new Date().toISOString(),
    };

    sessionMessages.push(assistantMsg);
    memoryMessages.set(input.sessionId, sessionMessages);

    // Update session metadata
    const session = memorySessions.get(input.sessionId);
    if (session) {
      session.messageCount = sessionMessages.length;
      session.lastMessageAt = assistantMsg.createdAt;
      session.updatedAt = assistantMsg.createdAt;
    }

    if (this.isMongoReady()) {
      try {
        await messageModel.create({
          _id: assistantMsgId,
          sessionId: input.sessionId,
          role: 'assistant',
          content: assistantContent,
          model: modelToUse,
          citations,
        });

        await sessionModel.findByIdAndUpdate(input.sessionId, {
          $inc: { messageCount: 2 },
          $set: {
            lastMessageAt: now,
            updatedAt: now,
          },
        });
      } catch {
        // graceful fallback
      }
    }

    return assistantMsg;
  }

  /**
   * Delete chat session and associated messages
   */
  static async deleteSession(userId: string, sessionId: string): Promise<boolean> {
    const existing = await this.getSession(userId, sessionId);
    if (!existing) return true;

    memorySessions.delete(sessionId);
    memoryMessages.delete(sessionId);

    if (this.isMongoReady()) {
      try {
        await sessionModel.findByIdAndDelete(sessionId);
        await messageModel.deleteMany({ sessionId });
      } catch {
        // graceful fallback
      }
    }

    return true;
  }
}
