import { authenticateSession } from "@/lib/auth";
import { toPaginatedApiResponse } from "@/lib/result-helpers";
import { campaignService } from "@/domain/campaign-domain/campaign-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const limit = Number(url.searchParams.get("limit") ?? 10);

  const result = authenticateSession(request).andThen((session) =>
    campaignService.listMyCampaignsResult(session.user.id, { page, limit }),
  );

  return toPaginatedApiResponse(result, "My campaigns retrieved successfully", (data) => ({
    body: data.campaigns,
    pagination: data.pagination,
  }));
}
