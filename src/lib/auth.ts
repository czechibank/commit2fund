import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { unauthorized, type AppError } from "@/lib/errors";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

export function authenticateSession(request: Request): ResultAsync<Session, AppError> {
  return ResultAsync.fromPromise(auth.api.getSession({ headers: request.headers }), () =>
    unauthorized(),
  ).andThen((session) => (session ? okAsync(session) : errAsync(unauthorized())));
}
