import { z } from "zod/v4";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  CZECHIBANK_API_URL: z.url(),
  HOST: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
});

export const env = envSchema.parse(process.env);
