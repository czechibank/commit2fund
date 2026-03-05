import { z } from "zod/v4";

export const CreateCampaignSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  targetAmount: z.number().int().positive().min(1),
  deadline: z.coerce.date().refine((d) => d > new Date(), {
    message: "Deadline must be in the future",
  }),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const UpdateCampaignSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(2000).optional(),
});

export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;
