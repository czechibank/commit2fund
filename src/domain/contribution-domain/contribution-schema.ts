import { z } from "zod/v4";

export const ContributeSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z.number().int().positive().min(1),
});

export type ContributeInput = z.infer<typeof ContributeSchema>;
