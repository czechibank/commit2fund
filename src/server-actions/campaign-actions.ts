"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { campaignService } from "@/domain/campaign-domain/campaign-service";
import { validateWithResult } from "@/lib/result-helpers";
import {
  CreateCampaignSchema,
  UpdateCampaignSchema,
} from "@/domain/campaign-domain/campaign-schema";
import type { ActionResult } from "./types";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function createCampaign(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    targetAmount: Number(formData.get("targetAmount")),
    deadline: formData.get("deadline"),
  };

  const validated = await validateWithResult(CreateCampaignSchema, raw);
  if (validated.isErr()) return { success: false, error: validated.error.message };

  const result = await campaignService.createCampaignResult(session.user.id, validated.value);

  if (result.isErr()) return { success: false, error: result.error.message };
  return { success: true, data: { id: result.value.id } };
}

export async function updateCampaign(
  campaignId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const raw: Record<string, string> = {};
  const title = formData.get("title");
  const description = formData.get("description");
  if (title) raw.title = title as string;
  if (description) raw.description = description as string;

  const validated = await validateWithResult(UpdateCampaignSchema, raw);
  if (validated.isErr()) return { success: false, error: validated.error.message };

  const result = await campaignService.updateCampaignResult(
    session.user.id,
    campaignId,
    validated.value,
  );

  if (result.isErr()) return { success: false, error: result.error.message };
  return { success: true, data: { id: result.value.id } };
}

export async function createBankAccountForCampaign(
  campaignId: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const result = await campaignService.createBankAccountForCampaignResult(
    session.user.id,
    campaignId,
  );

  if (result.isErr()) return { success: false, error: result.error.message };
  return { success: true, data: { id: result.value.id } };
}

export async function cancelCampaign(campaignId: string): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const result = await campaignService.cancelCampaignResult(session.user.id, campaignId);

  if (result.isErr()) return { success: false, error: result.error.message };
  return { success: true, data: { id: result.value.id } };
}
