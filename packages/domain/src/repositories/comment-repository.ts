import type { Comment } from '../entities/comment';

export interface CreateCommentData {
  ticketId: string;
  authorId: string;
  body: string;
}

export interface CommentRepository {
  listByTicket(ticketId: string): Promise<Comment[]>;
  create(data: CreateCommentData): Promise<Comment>;
}
