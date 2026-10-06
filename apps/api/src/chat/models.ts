import mongoose, { Schema } from 'mongoose';

export interface IChatMessageCitation {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  pageNumber?: number | null;
  sectionHeading?: string | null;
  content: string;
  score: number;
}

export interface IChatSession {
  _id: string;
  workspaceId: string;
  userId: string;
  title: string;
  mode: string;
  model: string;
  messageCount: number;
  lastMessageAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChatMessage {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  citations: IChatMessageCitation[];
  createdAt?: Date;
}

const CitationSchema = new Schema<IChatMessageCitation>(
  {
    documentId: { type: String, required: true },
    documentTitle: { type: String, required: true },
    chunkId: { type: String, required: true },
    pageNumber: { type: Number, default: null },
    sectionHeading: { type: String, default: null },
    content: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    _id: { type: String, required: true },
    workspaceId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    mode: { type: String, default: 'ASK' },
    model: { type: String, default: 'meta-llama/llama-3.3-70b-instruct:free' },
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    _id: false,
  }
);

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    _id: { type: String, required: true },
    sessionId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    model: { type: String },
    citations: [CitationSchema],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    _id: false,
  }
);

export const ChatSessionModel = (mongoose.models.ChatSession as mongoose.Model<IChatSession>) ||
  mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

export const ChatMessageModel = (mongoose.models.ChatMessage as mongoose.Model<IChatMessage>) ||
  mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
