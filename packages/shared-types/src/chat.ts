export type AIMode = 'ASK' | 'RESEARCH' | 'ANALYZE';

export interface Citation {
  citationIndex: number;
  documentId: string;
  documentTitle: string;
  pageNumber?: number | null;
  sectionHeading?: string | null;
  chunkId: number;
  exactExcerpt: string;
}

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'citation'; citation: Citation }
  | { type: 'tool_call'; toolName: string; callId: string; args: Record<string, unknown> }
  | { type: 'tool_result'; toolName: string; callId: string; result: Record<string, unknown> }
  | { type: 'thought'; thought: string };

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  parts: ContentPart[];
  tokenCount?: number;
  modelUsed?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  mode: AIMode;
  collectionId?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
