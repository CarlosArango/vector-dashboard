import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type {
  CreateTicketData,
  Ticket,
  TicketRepository,
  TicketStatus,
  UpdateTicketData,
} from '@vector/domain';
import type { Database } from '../db/client';
import { tickets } from '../db/schema';
import { toTicket } from './mappers';

export class DrizzleTicketRepository implements TicketRepository {
  constructor(private readonly db: Database) {}

  async listByProject(projectId: string): Promise<Ticket[]> {
    const rows = await this.db
      .select()
      .from(tickets)
      .where(eq(tickets.projectId, projectId))
      .orderBy(tickets.position);
    return rows.map(toTicket);
  }

  async findById(id: string): Promise<Ticket | null> {
    const [row] = await this.db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
    return row ? toTicket(row) : null;
  }

  async statsByProjects(
    projectIds: string[],
  ): Promise<Map<string, { total: number; done: number }>> {
    if (projectIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        projectId: tickets.projectId,
        total: sql<number>`count(*)::int`,
        done: sql<number>`count(*) filter (where ${tickets.status} = 'done')::int`,
      })
      .from(tickets)
      .where(inArray(tickets.projectId, projectIds))
      .groupBy(tickets.projectId);
    return new Map(rows.map((r) => [r.projectId, { total: r.total, done: r.done }]));
  }

  async countByProject(projectId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(tickets)
      .where(eq(tickets.projectId, projectId));
    return row?.count ?? 0;
  }

  async highestPosition(projectId: string, status: TicketStatus): Promise<number | null> {
    const [row] = await this.db
      .select({ position: tickets.position })
      .from(tickets)
      .where(and(eq(tickets.projectId, projectId), eq(tickets.status, status)))
      .orderBy(desc(tickets.position))
      .limit(1);
    return row?.position ?? null;
  }

  async create(data: CreateTicketData): Promise<Ticket> {
    const [row] = await this.db.insert(tickets).values(data).returning();
    return toTicket(row!);
  }

  async update(id: string, patch: UpdateTicketData): Promise<Ticket> {
    const [row] = await this.db
      .update(tickets)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return toTicket(row!);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(tickets).where(eq(tickets.id, id));
  }
}
