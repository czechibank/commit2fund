import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { type AppError, notFound, forbidden, badRequest, fromUnknown } from "@/lib/errors";
import { contributionRepository } from "./contribution-repository";
import { campaignRepository } from "@/domain/campaign-domain/campaign-repository";
import { userRepository } from "@/domain/user-domain/user-repository";
import { czechibankClient } from "@/lib/czechibank-client";
import type { ContributeInput } from "./contribution-schema";

export const contributionService = {
  contributeResult(userId: string, input: ContributeInput) {
    return ResultAsync.fromPromise(
      Promise.all([userRepository.findById(userId), campaignRepository.findById(input.campaignId)]),
      (e) => fromUnknown(e),
    ).andThen(([contributor, campaign]) => {
      if (!contributor) return errAsync(notFound("User not found"));
      if (!contributor.czechibankLinked || !contributor.czechibankApiKey)
        return errAsync(forbidden("Link your Czechibank account first"));
      if (!campaign) return errAsync(notFound("Campaign not found"));
      if (campaign.creatorId === userId)
        return errAsync(badRequest("Cannot contribute to your own campaign"));
      if (campaign.status !== "active") return errAsync(badRequest("Campaign is not active"));
      if (campaign.deadline < new Date())
        return errAsync(badRequest("Campaign deadline has passed"));
      if (!campaign.czechibankAccountNumber)
        return errAsync(badRequest("Campaign has no bank account"));

      return czechibankClient
        .getBankAccounts(contributor.czechibankApiKey, 1, 1)
        .andThen((accounts) => {
          if (accounts.items.length === 0) return errAsync(badRequest("No bank account found"));
          const fromAccount = accounts.items[0]!;
          return czechibankClient.createTransaction(
            contributor.czechibankApiKey!,
            fromAccount.number,
            campaign.czechibankAccountNumber!,
            input.amount,
          );
        })
        .andThen((transaction) =>
          ResultAsync.fromPromise(
            contributionRepository.create({
              campaignId: input.campaignId,
              contributorId: userId,
              amount: input.amount,
              czechibankTransactionId: transaction.id,
            }),
            (e) => fromUnknown(e),
          ).andThen((contribution) =>
            ResultAsync.fromPromise(
              campaignRepository.incrementCurrentAmount(input.campaignId, input.amount),
              (e) => fromUnknown(e),
            ).andThen((updatedCampaign) => {
              if (
                updatedCampaign &&
                updatedCampaign.currentAmount >= updatedCampaign.targetAmount
              ) {
                return ResultAsync.fromPromise(
                  campaignRepository.update(input.campaignId, { status: "completed" }),
                  (e) => fromUnknown(e),
                ).map(() => contribution);
              }
              return okAsync(contribution);
            }),
          ),
        );
    });
  },

  listMyContributionsResult(userId: string, { page, limit }: { page: number; limit: number }) {
    return ResultAsync.fromPromise(
      contributionRepository.findByContributorId(userId, page, limit),
      (e) => fromUnknown(e),
    ).map((result) => ({
      contributions: result.items,
      pagination: result.pagination,
    }));
  },
};
