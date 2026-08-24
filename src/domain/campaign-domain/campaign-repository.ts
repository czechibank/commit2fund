import { db } from "@/lib/db";
import { campaigns, contributions } from "@/lib/db/schema";
import { eq, and, gt, sql, count, desc } from "drizzle-orm";

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export const campaignRepository = {
  async findById(id: string) {
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return result[0] ?? null;
  },

  async findActive(page: number, limit: number) {
    const now = new Date();
    const where = and(eq(campaigns.status, "active"), gt(campaigns.deadline, now));
    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(campaigns)
        .where(where)
        .orderBy(desc(campaigns.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: count() }).from(campaigns).where(where),
    ]);
    const total = totalResult[0]?.count ?? 0;
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async findCompleted(page: number, limit: number) {
    const where = eq(campaigns.status, "completed");
    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(campaigns)
        .where(where)
        .orderBy(desc(campaigns.updatedAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: count() }).from(campaigns).where(where),
    ]);
    const total = totalResult[0]?.count ?? 0;
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async findByCreatorId(creatorId: string, page: number, limit: number) {
    const where = eq(campaigns.creatorId, creatorId);
    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(campaigns)
        .where(where)
        .orderBy(desc(campaigns.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: count() }).from(campaigns).where(where),
    ]);
    const total = totalResult[0]?.count ?? 0;
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async create(data: NewCampaign) {
    const result = await db.insert(campaigns).values(data).returning();
    return result[0]!;
  },

  async update(
    id: string,
    data: Partial<
      Pick<
        Campaign,
        "title" | "description" | "status" | "czechibankAccountNumber" | "czechibankAccountId"
      >
    >,
  ) {
    const result = await db
      .update(campaigns)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return result[0] ?? null;
  },

  async incrementCurrentAmount(id: string, amount: number) {
    const result = await db
      .update(campaigns)
      .set({
        currentAmount: sql`${campaigns.currentAmount} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id))
      .returning();
    return result[0] ?? null;
  },

  async countContributions(campaignId: string) {
    const result = await db
      .select({ count: count() })
      .from(contributions)
      .where(eq(contributions.campaignId, campaignId));
    return result[0]?.count ?? 0;
  },
};
