"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { userService } from "@/domain/user-domain/user-service";
import { validateWithResult } from "@/lib/result-helpers";
import { LinkCzechibankSchema } from "@/domain/user-domain/user-schema";
import type { ActionResult } from "./types";

export async function linkCzechibankAccount(
  apiKey: string,
): Promise<ActionResult<{ linked: boolean }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const validated = await validateWithResult(LinkCzechibankSchema, { apiKey });
  if (validated.isErr()) return { success: false, error: validated.error.message };

  const result = await userService.linkCzechibankResult(session.user.id, validated.value);

  if (result.isErr()) return { success: false, error: result.error.message };
  return { success: true, data: { linked: true } };
}
