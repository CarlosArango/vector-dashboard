import type { Comment } from '../entities/comment';
import type { CommentRepository } from '../repositories/comment-repository';
import type { TicketRepository } from '../repositories/ticket-repository';
import { NotFoundError, ValidationError } from '../shared/errors';

export interface AddCommentInput {
  ticketId: string;
  authorId: string;
  body: string;
}

export interface AddCommentDeps {
  comments: CommentRepository;
  tickets: TicketRepository;
}

export async function addComment(deps: AddCommentDeps, input: AddCommentInput): Promise<Comment> {
  const body = input.body.trim();
  if (!body) throw new ValidationError('Comment cannot be empty');

  const ticket = await deps.tickets.findById(input.ticketId);
  if (!ticket) throw new NotFoundError('Ticket', input.ticketId);

  return deps.comments.create({
    ticketId: input.ticketId,
    authorId: input.authorId,
    body,
  });
}
