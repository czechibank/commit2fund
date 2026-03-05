import { ResultAsync, errAsync } from "neverthrow";
import { type AppError, notFound, fromUnknown } from "@/lib/errors";
import { userRepository } from "./user-repository";
import { czechibankClient } from "@/lib/czechibank-client";
import type { LinkCzechibankInput } from "./user-schema";

export const userService = {
  linkCzechibankResult(userId: string, input: LinkCzechibankInput) {
    return czechibankClient.validateApiKey(input.apiKey).andThen((czechibankUser) =>
      ResultAsync.fromPromise(
        userRepository.updateCzechibankLink(userId, {
          apiKey: input.apiKey,
          czechibankUserId: czechibankUser.id,
        }),
        (e) => fromUnknown(e),
      ).andThen((updated) =>
        updated
          ? ResultAsync.fromPromise(Promise.resolve(updated), (e) => fromUnknown(e))
          : errAsync(notFound("User not found")),
      ),
    );
  },

  getUserResult(userId: string) {
    return ResultAsync.fromPromise(userRepository.findById(userId), (e) => fromUnknown(e)).andThen(
      (u) =>
        u
          ? ResultAsync.fromPromise(Promise.resolve(u), (e) => fromUnknown(e))
          : errAsync(notFound("User not found")),
    );
  },
};
