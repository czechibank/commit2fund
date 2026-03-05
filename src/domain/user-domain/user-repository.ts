import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type User = typeof user.$inferSelect;

export const userRepository = {
  async findById(id: string) {
    const result = await db.select().from(user).where(eq(user.id, id)).limit(1);
    return result[0] ?? null;
  },

  async updateCzechibankLink(userId: string, data: { apiKey: string; czechibankUserId: string }) {
    const result = await db
      .update(user)
      .set({
        czechibankApiKey: data.apiKey,
        czechibankUserId: data.czechibankUserId,
        czechibankLinked: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning();
    return result[0] ?? null;
  },
};
