import { z } from "zod/v4";

export const LinkCzechibankSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});

export type LinkCzechibankInput = z.infer<typeof LinkCzechibankSchema>;
