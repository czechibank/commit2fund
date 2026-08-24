import { db } from "@/lib/db";
import { contributions, campaigns, user } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";

export type Contribution = typeof contributions.$inferSelect;
export type NewContribution = typeof contributions.$inferInsert;

export const contributionRepository = {
  async create(data: NewContribution) {
    const result = await db.insert(contributions).values(data).returning();
    return result[0]!;
  },

  async findByContributorId(contributorId: string, page: number, limit: number) {
    const where = eq(contributions.contributorId, contributorId);
    const [items, totalResult] = await Promise.all([
      db
        .select({
          id: contributions.id,
          campaignId: contributions.campaignId,
          contributorId: contributions.contributorId,
          amount: contributions.amount,
          czechibankTransactionId: contributions.czechibankTransactionId,
          createdAt: contributions.createdAt,
          campaignTitle: campaigns.title,
        })
        .from(contributions)
        .innerJoin(campaigns, eq(contributions.campaignId, campaigns.id))
        .where(where)
        .orderBy(desc(contributions.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: count() }).from(contributions).where(where),
    ]);
    const total = totalResult[0]?.count ?? 0;
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async findByCampaignId(campaignId: string) {
    return db
      .select({
        id: contributions.id,
        amount: contributions.amount,
        createdAt: contributions.createdAt,
        contributorName: user.name,
      })
      .from(contributions)
      .innerJoin(user, eq(contributions.contributorId, user.id))
      .where(eq(contributions.campaignId, campaignId))
      .orderBy(desc(contributions.createdAt));
  },

  async countByCampaignId(campaignId: string) {
    const result = await db
      .select({ count: count() })
      .from(contributions)
      .where(eq(contributions.campaignId, campaignId));
    return result[0]?.count ?? 0;
  },
};
