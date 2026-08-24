"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { contributionService } from "@/domain/contribution-domain/contribution-service";
import { userService } from "@/domain/user-domain/user-service";
import { validateWithResult } from "@/lib/result-helpers";
import { ContributeSchema } from "@/domain/contribution-domain/contribution-schema";
import { czechibankClient } from "@/lib/czechibank-client";
import type { ActionResult } from "./types";

export async function contribute(
  campaignId: string,
  amount: number,
  fromBankAccountNumber: string,
): Promise<ActionResult<{ id: string; effectiveAmount: number; capped: boolean }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const validated = await validateWithResult(ContributeSchema, {
    campaignId,
    amount,
    fromBankAccountNumber,
  });
  if (validated.isErr()) return { success: false, error: validated.error.message };

  const result = await contributionService.contributeResult(session.user.id, validated.value);

  if (result.isErr()) return { success: false, error: result.error.message };
  return {
    success: true,
    data: {
      id: result.value.id,
      effectiveAmount: result.value.effectiveAmount,
      capped: result.value.capped,
    },
  };
}

export async function getMyBankAccounts(): Promise<
  ActionResult<{ accounts: { id: string; number: string; name: string; balance: number }[] }>
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const userResult = await userService.getUserResult(session.user.id);
  if (userResult.isErr()) return { success: false, error: userResult.error.message };

  const user = userResult.value;
  if (!user.czechibankLinked || !user.czechibankApiKey)
    return { success: false, error: "Link your Czechibank account first" };

  const result = await czechibankClient.getBankAccounts(user.czechibankApiKey, 1, 100);
  if (result.isErr()) return { success: false, error: result.error.message };

  return {
    success: true,
    data: {
      accounts: result.value.items.map((a) => ({
        id: a.id,
        number: a.number,
        name: a.name,
        balance: a.balance,
      })),
    },
  };
}
