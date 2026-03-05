import { authenticateSession } from "@/lib/auth";
import { validateWithResult, toApiResponse } from "@/lib/result-helpers";
import { contributionService } from "@/domain/contribution-domain/contribution-service";
import { ContributeSchema } from "@/domain/contribution-domain/contribution-schema";
import { badRequest } from "@/lib/errors";
import { ResultAsync } from "neverthrow";

export async function POST(request: Request) {
  const result = authenticateSession(request).andThen((session) =>
    ResultAsync.fromPromise(request.json(), () => badRequest("Invalid JSON"))
      .andThen((body) => validateWithResult(ContributeSchema, body))
      .andThen((input) => contributionService.contributeResult(session.user.id, input)),
  );

  return toApiResponse(result, "Contribution successful", 201);
}
