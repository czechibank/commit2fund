import { authenticateSession } from "@/lib/auth";
import { validateWithResult, toApiResponse, toPaginatedApiResponse } from "@/lib/result-helpers";
import { campaignService } from "@/domain/campaign-domain/campaign-service";
import { CreateCampaignSchema } from "@/domain/campaign-domain/campaign-schema";
import { badRequest } from "@/lib/errors";
import { ResultAsync } from "neverthrow";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const limit = Number(url.searchParams.get("limit") ?? 10);

  return toPaginatedApiResponse(
    campaignService.listActiveCampaignsResult({ page, limit }),
    "Campaigns retrieved successfully",
    (data) => ({ body: data.campaigns, pagination: data.pagination }),
  );
}

export async function POST(request: Request) {
  const result = authenticateSession(request).andThen((session) =>
    ResultAsync.fromPromise(request.json(), () => badRequest("Invalid JSON"))
      .andThen((body) => validateWithResult(CreateCampaignSchema, body))
      .andThen((input) => campaignService.createCampaignResult(session.user.id, input)),
  );

  return toApiResponse(result, "Campaign created successfully", 201);
}
