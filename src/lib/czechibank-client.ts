import { ResultAsync } from "neverthrow";
import { type AppError, fromUnknown } from "@/lib/errors";

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
  fromBankNumber: string;
  toBankNumber: string;
  amount: number;
  currency: string;
  createdAt: string;
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
    return this.request<CzechibankUser>("GET", "/api/v1/user", apiKey);
  }

  createBankAccount(
    apiKey: string,
    name: string,
    currency = "CZECHITOKEN",
  ): ResultAsync<CzechibankBankAccount, AppError> {
    return this.request<CzechibankBankAccount>("POST", "/api/v1/bank-account/create", apiKey, {
      name,
      currency,
    });
  }

  getBankAccounts(
    apiKey: string,
    page = 1,
    limit = 10,
  ): ResultAsync<PaginatedResult<CzechibankBankAccount>, AppError> {
    return this.request<PaginatedResult<CzechibankBankAccount>>(
      "GET",
      `/api/v1/bank-account?page=${page}&limit=${limit}`,
      apiKey,
    );
  }

  getBankAccount(apiKey: string, id: string): ResultAsync<CzechibankBankAccount, AppError> {
    return this.request<CzechibankBankAccount>("GET", `/api/v1/bank-account/${id}`, apiKey);
  }

  createTransaction(
    apiKey: string,
    fromBankNumber: string,
    toBankNumber: string,
    amount: number,
    currency = "CZECHITOKEN",
  ): ResultAsync<CzechibankTransaction, AppError> {
    return this.request<CzechibankTransaction>("POST", "/api/v1/transactions/create", apiKey, {
      fromBankNumber,
      toBankNumber,
      amount,
      currency,
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
    return this.request<PaginatedResult<CzechibankTransaction>>(
      "GET",
      `/api/v1/transactions?${params}`,
      apiKey,
    );
  }

  private request<T>(
    method: string,
    path: string,
    apiKey?: string,
    body?: unknown,
  ): ResultAsync<T, AppError> {
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
        return json.data as T;
      }),
      (e) => fromUnknown(e, "Czechibank API request failed"),
    );
  }
}

export const czechibankClient = new CzechibankClient(
  process.env.CZECHIBANK_API_URL || "http://localhost:3000",
);
