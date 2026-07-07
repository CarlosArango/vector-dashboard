import { eq } from 'drizzle-orm';
import type { Comment, CommentRepository, CreateCommentData } from '@vector/domain';
import type { Database } from '../db/client';
import { comments } from '../db/schema';
import { toComment } from './mappers';

export class DrizzleCommentRepository implements CommentRepository {
  constructor(private readonly db: Database) {}

  async listByTicket(ticketId: string): Promise<Comment[]> {
    const rows = await this.db
      .select()
      .from(comments)
      .where(eq(comments.ticketId, ticketId))
      .orderBy(comments.createdAt);
    return rows.map(toComment);
  }

  async create(data: CreateCommentData): Promise<Comment> {
    const [row] = await this.db.insert(comments).values(data).returning();
    return toComment(row!);
  }
}
