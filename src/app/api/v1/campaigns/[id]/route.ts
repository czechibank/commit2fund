import { authenticateSession } from "@/lib/auth";
import { validateWithResult, toApiResponse } from "@/lib/result-helpers";
import { campaignService } from "@/domain/campaign-domain/campaign-service";
import { UpdateCampaignSchema } from "@/domain/campaign-domain/campaign-schema";
import { badRequest } from "@/lib/errors";
import { ResultAsync } from "neverthrow";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return toApiResponse(campaignService.getCampaignResult(id), "Campaign retrieved successfully");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = authenticateSession(request).andThen((session) =>
    ResultAsync.fromPromise(request.json(), () => badRequest("Invalid JSON"))
      .andThen((body) => validateWithResult(UpdateCampaignSchema, body))
      .andThen((input) => campaignService.updateCampaignResult(session.user.id, id, input)),
  );

  return toApiResponse(result, "Campaign updated successfully");
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = authenticateSession(request).andThen((session) =>
    campaignService.cancelCampaignResult(session.user.id, id),
  );

  return toApiResponse(result, "Campaign cancelled successfully");
}
