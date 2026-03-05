import { authenticateSession } from "@/lib/auth";
import { toPaginatedApiResponse } from "@/lib/result-helpers";
import { contributionService } from "@/domain/contribution-domain/contribution-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const limit = Number(url.searchParams.get("limit") ?? 10);

  const result = authenticateSession(request).andThen((session) =>
    contributionService.listMyContributionsResult(session.user.id, {
      page,
      limit,
    }),
  );

  return toPaginatedApiResponse(result, "Contributions retrieved successfully", (data) => ({
    body: data.contributions,
    pagination: data.pagination,
  }));
}
