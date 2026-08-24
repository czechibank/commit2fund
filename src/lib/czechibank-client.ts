import { type AppError, fromUnknown } from "@/lib/errors";
import { ResultAsync } from "neverthrow";

export interface CzechibankUser {
  id: string;
  name: string;
  email: string;
}

export interface CzechibankBankAccount {
  id: string;
  number: string;
  name: string;
  balance: number;
  currency: string;
}

export interface CzechibankTransaction {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
  from: { id: string; number: string };
  to: { id: string; number: string };
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class CzechibankClient {
  constructor(private baseUrl: string) {}

  validateApiKey(apiKey: string): ResultAsync<CzechibankUser, AppError> {
    return this.request("GET", "/api/v1/user", apiKey).map((json) => json.data as CzechibankUser);
  }

  createBankAccount(
    apiKey: string,
    name: string,
    currency = "CZECHITOKEN",
  ): ResultAsync<CzechibankBankAccount, AppError> {
    return this.request("POST", "/api/v1/bank-account/create", apiKey, {
      name,
      currency,
    }).map((json) => {
      // Response: data.bankAccount.data.{id, number, ...}
      const nested = json.data?.bankAccount;
      const account = nested?.data ?? nested;
      return account as CzechibankBankAccount;
    });
  }

  getBankAccounts(
    apiKey: string,
    page = 1,
    limit = 10,
  ): ResultAsync<PaginatedResult<CzechibankBankAccount>, AppError> {
    return this.request("GET", `/api/v1/bank-account?page=${page}&limit=${limit}`, apiKey).map(
      (json) => ({
        // Response: data.bankAccounts[...] + meta.pagination
        items: (json.data?.bankAccounts ?? []) as CzechibankBankAccount[],
        pagination: json.meta?.pagination ?? { page, limit, total: 0, totalPages: 0 },
      }),
    );
  }

  getBankAccount(apiKey: string, id: string): ResultAsync<CzechibankBankAccount, AppError> {
    return this.request("GET", `/api/v1/bank-account/${id}`, apiKey).map((json) => {
      const account = json.data?.bankAccount ?? json.data;
      return account as CzechibankBankAccount;
    });
  }

  createTransaction(
    apiKey: string,
    fromBankNumber: string,
    toBankNumber: string,
    amount: number,
    currency = "CZECHITOKEN",
  ): ResultAsync<CzechibankTransaction, AppError> {
    return this.request("POST", "/api/v1/transactions/create", apiKey, {
      fromBankNumber,
      toBankNumber,
      amount,
      currency,
    }).map((json) => {
      const nested = json.data?.transaction;
      const tx = nested?.data ?? nested ?? json.data;
      return tx as CzechibankTransaction;
    });
  }

  getTransactions(
    apiKey: string,
    page = 1,
    limit = 10,
    sortBy?: string,
    sortOrder?: string,
  ): ResultAsync<PaginatedResult<CzechibankTransaction>, AppError> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    return this.request("GET", `/api/v1/transactions?${params}`, apiKey).map((json) => ({
      items: (json.data?.transactions ?? []) as CzechibankTransaction[],
      pagination: json.meta?.pagination ?? { page, limit, total: 0, totalPages: 0 },
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private request(
    method: string,
    path: string,
    apiKey?: string,
    body?: unknown,
  ): ResultAsync<{ success: boolean; data: any; meta: any }, AppError> {
    return ResultAsync.fromPromise(
      fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-API-Key": apiKey } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      }).then(async (res) => {
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        return json;
      }),
      (e) => fromUnknown(e, "Czechibank API request failed"),
    );
  }
}

export const czechibankClient = new CzechibankClient(
  process.env.CZECHIBANK_API_URL || "http://localhost:3000",
);
