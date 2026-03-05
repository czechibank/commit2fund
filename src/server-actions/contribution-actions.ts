"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { contributionService } from "@/domain/contribution-domain/contribution-service";
import { validateWithResult } from "@/lib/result-helpers";
import { ContributeSchema } from "@/domain/contribution-domain/contribution-schema";
import type { ActionResult } from "./types";

export async function contribute(
  campaignId: string,
  amount: number,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const validated = await validateWithResult(ContributeSchema, {
    campaignId,
    amount,
  });
  if (validated.isErr()) return { success: false, error: validated.error.message };

  const result = await contributionService.contributeResult(session.user.id, validated.value);

  if (result.isErr()) return { success: false, error: result.error.message };
  return { success: true, data: { id: result.value.id } };
}
