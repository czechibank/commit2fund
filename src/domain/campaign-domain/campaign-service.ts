import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { type AppError, notFound, forbidden, badRequest, fromUnknown } from "@/lib/errors";
import { campaignRepository } from "./campaign-repository";
import { userRepository } from "@/domain/user-domain/user-repository";
import { czechibankClient } from "@/lib/czechibank-client";
import type { CreateCampaignInput, UpdateCampaignInput } from "./campaign-schema";

export const campaignService = {
  createCampaignResult(
    userId: string,
    input: CreateCampaignInput,
  ): ResultAsync<
    typeof campaignRepository.create extends (...args: never[]) => Promise<infer R> ? R : never,
    AppError
  > {
    return ResultAsync.fromPromise(userRepository.findById(userId), (e) => fromUnknown(e)).andThen(
      (u) => {
        if (!u) return errAsync(notFound("User not found"));
        if (!u.czechibankLinked || !u.czechibankApiKey)
          return errAsync(forbidden("Link your Czechibank account first"));
        return czechibankClient
          .createBankAccount(u.czechibankApiKey, `Campaign: ${input.title}`)
          .andThen((bankAccount) =>
            ResultAsync.fromPromise(
              campaignRepository.create({
                title: input.title,
                description: input.description,
                targetAmount: input.targetAmount,
                deadline: input.deadline,
                creatorId: userId,
                czechibankAccountNumber: bankAccount.number,
                czechibankAccountId: bankAccount.id,
              }),
              (e) => fromUnknown(e),
            ),
          );
      },
    );
  },

  getCampaignResult(id: string) {
    return ResultAsync.fromPromise(campaignRepository.findById(id), (e) => fromUnknown(e)).andThen(
      (campaign) => {
        if (!campaign) return errAsync(notFound("Campaign not found"));
        return ResultAsync.fromPromise(campaignRepository.countContributions(id), (e) =>
          fromUnknown(e),
        ).map((contributionCount) => ({ ...campaign, contributionCount }));
      },
    );
  },

  listActiveCampaignsResult({ page, limit }: { page: number; limit: number }) {
    return ResultAsync.fromPromise(campaignRepository.findActive(page, limit), (e) =>
      fromUnknown(e),
    ).map((result) => ({
      campaigns: result.items,
      pagination: result.pagination,
    }));
  },

  listMyCampaignsResult(userId: string, { page, limit }: { page: number; limit: number }) {
    return ResultAsync.fromPromise(campaignRepository.findByCreatorId(userId, page, limit), (e) =>
      fromUnknown(e),
    ).map((result) => ({
      campaigns: result.items,
      pagination: result.pagination,
    }));
  },

  updateCampaignResult(userId: string, campaignId: string, input: UpdateCampaignInput) {
    return ResultAsync.fromPromise(campaignRepository.findById(campaignId), (e) =>
      fromUnknown(e),
    ).andThen((campaign) => {
      if (!campaign) return errAsync(notFound("Campaign not found"));
      if (campaign.creatorId !== userId) return errAsync(forbidden("Not the campaign owner"));
      if (campaign.status !== "active") return errAsync(badRequest("Campaign is not active"));
      return ResultAsync.fromPromise(campaignRepository.update(campaignId, input), (e) =>
        fromUnknown(e),
      ).andThen((updated) =>
        updated ? okAsync(updated) : errAsync(notFound("Campaign not found")),
      );
    });
  },

  cancelCampaignResult(userId: string, campaignId: string) {
    return ResultAsync.fromPromise(campaignRepository.findById(campaignId), (e) =>
      fromUnknown(e),
    ).andThen((campaign) => {
      if (!campaign) return errAsync(notFound("Campaign not found"));
      if (campaign.creatorId !== userId) return errAsync(forbidden("Not the campaign owner"));
      if (campaign.status !== "active") return errAsync(badRequest("Campaign is not active"));
      return ResultAsync.fromPromise(
        campaignRepository.update(campaignId, { status: "cancelled" }),
        (e) => fromUnknown(e),
      ).andThen((updated) =>
        updated ? okAsync(updated) : errAsync(notFound("Campaign not found")),
      );
    });
  },
};
