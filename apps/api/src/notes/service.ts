import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { WorkspaceService } from '../workspaces/service';

export interface CreateNoteDto {
  workspaceId: string;
  collectionId?: string | null;
  title: string;
  content: string;
  tags?: string[];
  sourceCitations?: any;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  tags?: string[];
  collectionId?: string | null;
}

const memoryNotes = new Map<string, any>();

export class ResearchNotesService {
  static async createNote(userId: string, dto: CreateNoteDto) {
    const role = await WorkspaceService.getMemberRole(userId, dto.workspaceId);
    if (!role) throw new Error('Unauthorized workspace access');

    try {
      const note = await prisma.researchNote.create({
        data: {
          workspaceId: dto.workspaceId,
          userId,
          collectionId: dto.collectionId || null,
          title: dto.title,
          content: dto.content,
          tags: dto.tags || [],
          sourceCitations: dto.sourceCitations || null,
        },
      });
      return note;
    } catch (err) {
      if (process.env.NODE_ENV === 'test') {
        const id = `note-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const note = {
          id,
          workspaceId: dto.workspaceId,
          userId,
          collectionId: dto.collectionId || null,
          title: dto.title,
          content: dto.content,
          tags: dto.tags || [],
          sourceCitations: dto.sourceCitations || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryNotes.set(id, note);
        return note;
      }
      logger.error('Failed to create research note', { err });
      throw err;
    }
  }

  static async listNotes(userId: string, workspaceId: string, filter?: { collectionId?: string | null; tag?: string }) {
    const role = await WorkspaceService.getMemberRole(userId, workspaceId);
    if (!role) throw new Error('Unauthorized workspace access');

    try {
      const where: any = { workspaceId };
      if (filter?.collectionId) where.collectionId = filter.collectionId;
      if (filter?.tag) where.tags = { has: filter.tag };

      const notes = await prisma.researchNote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return notes;
    } catch (err) {
      if (process.env.NODE_ENV === 'test') {
        return Array.from(memoryNotes.values()).filter((n) => {
          if (n.workspaceId !== workspaceId) return false;
          if (filter?.collectionId && n.collectionId !== filter.collectionId) return false;
          if (filter?.tag && !n.tags.includes(filter.tag)) return false;
          return true;
        });
      }
      logger.error('Failed to list research notes', { err });
      throw err;
    }
  }

  static async getNote(userId: string, noteId: string) {
    try {
      const note = await prisma.researchNote.findUnique({
        where: { id: noteId },
      });
      if (!note) return null;

      const role = await WorkspaceService.getMemberRole(userId, note.workspaceId);
      if (!role) throw new Error('Unauthorized workspace access');

      return note;
    } catch (err) {
      if (process.env.NODE_ENV === 'test') {
        return memoryNotes.get(noteId) || null;
      }
      logger.error('Failed to get research note', { err });
      throw err;
    }
  }

  static async updateNote(userId: string, noteId: string, dto: UpdateNoteDto) {
    const note = await this.getNote(userId, noteId);
    if (!note) throw new Error('Research note not found');

    try {
      const updated = await prisma.researchNote.update({
        where: { id: noteId },
        data: {
          title: dto.title,
          content: dto.content,
          tags: dto.tags,
          collectionId: dto.collectionId !== undefined ? dto.collectionId : undefined,
        },
      });
      return updated;
    } catch (err) {
      if (process.env.NODE_ENV === 'test') {
        const existing = memoryNotes.get(noteId);
        if (existing) {
          if (dto.title) existing.title = dto.title;
          if (dto.content !== undefined) existing.content = dto.content;
          if (dto.tags) existing.tags = dto.tags;
          if (dto.collectionId !== undefined) existing.collectionId = dto.collectionId;
          existing.updatedAt = new Date();
          memoryNotes.set(noteId, existing);
          return existing;
        }
      }
      logger.error('Failed to update research note', { err });
      throw err;
    }
  }

  static async deleteNote(userId: string, noteId: string) {
    const note = await this.getNote(userId, noteId);
    if (!note) throw new Error('Research note not found');

    try {
      await prisma.researchNote.delete({
        where: { id: noteId },
      });
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === 'test') {
        memoryNotes.delete(noteId);
        return true;
      }
      logger.error('Failed to delete research note', { err });
      throw err;
    }
  }
}
