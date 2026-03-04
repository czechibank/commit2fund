# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

commit2fund is a crowdfunding platform where users create funding campaigns and supporters send Czechitokens to fund them. It is a **standalone Next.js application** that communicates with the [Czechibank API](https://github.com/czechitas/czechibank) for all banking operations (bank accounts, transactions). commit2fund maintains its own database for campaigns, contributions, and user profiles.

**Key concept:** Users must already have a Czechibank account. They register on commit2fund and link their Czechibank API key to enable banking operations.

**Tech Stack:** newest Next.js (TypeScript) + Drizzle ORM (PostgreSQL) + Better-Auth + shadcn/ui + Tailwind CSS + neverthrow

Generate nextjs with `pnpm create next-app@latest --yes`
For `better-auth` use skills what we have in project


## Common Commands

All commands use **pnpm** (not npm):

```bash
# Development
pnpm run dev              # Start dev server with Turbopack (port 3001)
pnpm run build            # Production build
pnpm start                # Start production server

# Testing
pnpm run test:unit        # Unit tests (Vitest)
pnpm run test:api         # API integration tests (Vitest, requires DB + running server)
pnpm run test:e2e         # E2E tests (Playwright-BDD): runs bddgen then playwright
pnpm run test             # Run all tests sequentially (unit -> api -> e2e)

# Code Quality
pnpm run lint             # ESLint
pnpm run format           # Prettier

# Database
pnpm run db:generate      # Generate Drizzle migration files from schema changes
pnpm run db:migrate       # Apply pending migrations
pnpm run db:push          # Push schema directly (dev only, no migration file)
pnpm run db:studio        # Open Drizzle Studio (DB browser)
pnpm run db:seed          # Seed test data (users, campaigns, contributions)
```

## Architecture

### Directory Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth route group (signin, signup, link-account)
│   ├── (dashboard)/            # Protected dashboard route group
│   │   ├── campaigns/          # Campaign management pages
│   │   ├── contributions/      # User's contribution history
│   │   └── dashboard/          # Overview page
│   ├── api/
│   │   ├── auth/[...all]/      # Better-Auth catch-all handler
│   │   └── v1/                 # REST API endpoints
│   │       ├── campaigns/      # Campaign API (CRUD, public listing)
│   │       └── contributions/  # Contribution API (create, list)
│   └── campaign/[id]/          # Public campaign page (shareable link)
├── components/                 # UI components
│   ├── ui/                     # Base shadcn/ui components
│   ├── campaign/               # Campaign-specific components
│   └── layout/                 # Shell, nav, sidebar
├── domain/                     # Business logic by domain
│   ├── campaign-domain/
│   │   ├── campaign-schema.ts      # Zod validation schemas
│   │   ├── campaign-repository.ts  # Drizzle DB queries
│   │   └── campaign-service.ts     # Business logic (ResultAsync-based)
│   ├── contribution-domain/
│   │   ├── contribution-schema.ts
│   │   ├── contribution-repository.ts
│   │   └── contribution-service.ts
│   └── user-domain/
│       ├── user-schema.ts
│       ├── user-repository.ts
│       └── user-service.ts
├── lib/
│   ├── db/
│   │   ├── index.ts            # Drizzle client instance
│   │   ├── schema.ts           # Drizzle table definitions (single source of truth)
│   │   └── migrate.ts          # Migration runner
│   ├── czechibank-client.ts    # Typed HTTP client for Czechibank API
│   ├── auth.ts                 # Better-Auth server config
│   ├── auth-client.ts          # Better-Auth client instance
│   ├── env.ts                  # Environment variable validation (Zod)
│   ├── errors.ts               # AppError type + convenience constructors
│   ├── result-helpers.ts       # toApiResponse, validateWithResult
│   └── response.ts             # API response types + formatters
├── server-actions/             # Next.js server actions
│   ├── campaign-actions.ts
│   └── contribution-actions.ts
└── middleware.ts               # Auth middleware for protected routes

shared/
└── fixtures/                   # Shared test fixtures
    ├── index.ts
    ├── users.ts                # Seed user definitions
    └── campaigns.ts            # Seed campaign definitions

tests/
├── unit/                       # Vitest unit tests
│   ├── czechibank-client.test.ts
│   ├── campaign-service.test.ts
│   └── contribution-service.test.ts
├── api/                        # Vitest API integration tests
│   ├── config/config.ts
│   ├── campaigns.api.test.ts
│   └── contributions.api.test.ts
└── bdd-tests/                  # Playwright-BDD tests
    ├── features/               # Gherkin .feature files
    │   ├── create-campaign.feature
    │   ├── contribute.feature
    │   └── campaign-progress.feature
    ├── steps/                  # Step implementations
    │   ├── campaign.steps.ts
    │   ├── contribute.steps.ts
    │   └── auth.steps.ts
    └── constants/
        └── pageMap.ts

drizzle/                        # Generated migration files (do not edit manually)
drizzle.config.ts               # Drizzle Kit configuration
```

### Key Patterns

**API Response Format** (matches Czechibank convention):

```json
{
  "success": true,
  "message": "Campaign created successfully",
  "data": {},
  "meta": { "timestamp": "...", "requestId": "...", "pagination": {} }
}
```

**Error Response Format:**

```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation error",
    "details": [{ "code": "VALIDATION_ERROR", "field": "title", "message": "Required" }]
  },
  "meta": { "timestamp": "..." }
}
```

**Authentication:**

- Web UI: Better-Auth session-based (cookie)
- API: Session token via cookie or `Authorization: Bearer <token>` header
- Czechibank calls: `X-API-Key` header (stored per-user in commit2fund DB)

**Component Convention:**

- Client components use `.client.tsx` suffix
- Server components are the default (no suffix)

**neverthrow Pattern** (same as Czechibank):

- Domain services expose `*Result()` methods returning `ResultAsync<T, AppError>`
- API routes use `toApiResponse()` or `toPaginatedApiResponse()`
- `validateWithResult(schema, data)` for Zod validation inside Result chains
- `fromUnknown(error)` wraps caught unknowns into `AppError`

**"use server" Constraint:**

- Server action files have `"use server"` directive — ALL exports MUST be `async` functions
- `authenticateSession()` returns `ResultAsync` synchronously, so it lives in `lib/auth.ts`, NOT in a server action file

## Database

### Infrastructure

PostgreSQL via Docker Compose on **port 2222** (avoids conflict with Czechibank on port 1111).

### Drizzle Schema (`src/lib/db/schema.ts`)

```typescript
import { pgTable, text, integer, timestamp, boolean, pgEnum, uuid } from "drizzle-orm/pg-core";

// ── Better-Auth managed tables ──────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // commit2fund-specific: linked Czechibank account
  czechibankApiKey: text("czechibank_api_key"),         // set after linking
  czechibankUserId: text("czechibank_user_id"),          // Czechibank user ID
  czechibankLinked: boolean("czechibank_linked").notNull().default(false),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ── Application tables ──────────────────────────────────────────

export const campaignStatusEnum = pgEnum("campaign_status", [
  "active",
  "completed",
  "cancelled",
]);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetAmount: integer("target_amount").notNull(),           // in CZECHITOKEN (integer, no decimals)
  currentAmount: integer("current_amount").notNull().default(0), // denormalized sum
  deadline: timestamp("deadline").notNull(),
  status: campaignStatusEnum("status").notNull().default("active"),
  creatorId: text("creator_id").notNull().references(() => user.id),
  czechibankAccountNumber: text("czechibank_account_number"), // dedicated bank account for this campaign
  czechibankAccountId: text("czechibank_account_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contributions = pgTable("contributions", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id),
  contributorId: text("contributor_id").notNull().references(() => user.id),
  amount: integer("amount").notNull(),                         // in CZECHITOKEN
  czechibankTransactionId: text("czechibank_transaction_id"),   // from Czechibank API response
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### Drizzle Config (`drizzle.config.ts`)

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Migration Workflow

```bash
# After changing schema.ts:
pnpm run db:generate      # Creates SQL migration in drizzle/
pnpm run db:migrate       # Applies migration

# Quick iteration (dev only, no migration file):
pnpm run db:push
```

## Czechibank Integration

### API Endpoints Consumed

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/v1/user` | Validate API key & get user profile | X-API-Key |
| POST | `/api/v1/bank-account/create` | Create dedicated campaign bank account | X-API-Key |
| GET | `/api/v1/bank-account` | List user's bank accounts (paginated) | X-API-Key |
| GET | `/api/v1/bank-account/{id}` | Get account details/balance | X-API-Key |
| POST | `/api/v1/transactions/create` | Send contribution (CZECHITOKEN transfer) | X-API-Key |
| GET | `/api/v1/transactions` | List transactions (paginated, sortable) | X-API-Key |

**Czechibank response format:**
```json
{
  "success": boolean,
  "message": string,
  "data": {},
  "meta": { "timestamp": "ISO-8601", "requestId": "...", "pagination": { "page", "limit", "total", "totalPages" } }
}
```

### Czechibank Client (`src/lib/czechibank-client.ts`)

Typed HTTP client wrapping all Czechibank API calls. Every method returns `ResultAsync<T, AppError>`.

```typescript
import { ResultAsync } from "neverthrow";
import { type AppError, fromUnknown } from "@/lib/errors";

class CzechibankClient {
  constructor(private baseUrl: string) {}

  // Validate an API key and return user profile
  validateApiKey(apiKey: string): ResultAsync<CzechibankUser, AppError>;

  // Bank Accounts
  createBankAccount(apiKey: string, name: string, currency?: string): ResultAsync<CzechibankBankAccount, AppError>;
  getBankAccounts(apiKey: string, page?: number, limit?: number): ResultAsync<PaginatedResult<CzechibankBankAccount>, AppError>;
  getBankAccount(apiKey: string, id: string): ResultAsync<CzechibankBankAccount, AppError>;

  // Transactions
  createTransaction(apiKey: string, fromBankNumber: string, toBankNumber: string, amount: number, currency?: string): ResultAsync<CzechibankTransaction, AppError>;
  getTransactions(apiKey: string, page?: number, limit?: number, sortBy?: string, sortOrder?: string): ResultAsync<PaginatedResult<CzechibankTransaction>, AppError>;

  // Internal: all calls go through this
  private request<T>(method: string, path: string, apiKey?: string, body?: unknown): ResultAsync<T, AppError> {
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

export const czechibankClient = new CzechibankClient(process.env.CZECHIBANK_API_URL!);
```

## Authentication Flow

### Czechibank-First Approach

Users must already have a Czechibank account before using commit2fund.

1. **Sign up on commit2fund** — Better-Auth creates local user (email + password)
2. **Link Czechibank account** — User enters their Czechibank API key on a "Link Account" page
3. **Validate API key** — Server calls `GET /api/v1/user` with the provided key
4. **Store on success** — `czechibank_api_key`, `czechibank_user_id`, and `czechibank_linked = true` saved to user record
5. **Gate features** — Campaign creation and contributions require `czechibank_linked = true`

### Session Authentication for API Routes

```typescript
// src/lib/auth.ts
import { auth } from "../../auth";
import { unauthorized, type AppError } from "@/lib/errors";
import { ResultAsync, errAsync, okAsync } from "neverthrow";

export function authenticateSession(request: Request): ResultAsync<typeof auth.$Infer.Session, AppError> {
  return ResultAsync.fromPromise(
    auth.api.getSession({ headers: request.headers }),
    () => unauthorized(),
  ).andThen((session) =>
    session ? okAsync(session) : errAsync(unauthorized())
  );
}
```

## API Design

### Own API Endpoints (`src/app/api/v1/`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/campaigns` | List active campaigns (public, paginated) | None |
| GET | `/api/v1/campaigns/[id]` | Get campaign detail + contribution count | None |
| POST | `/api/v1/campaigns` | Create campaign | Session + linked |
| PATCH | `/api/v1/campaigns/[id]` | Update campaign (title, description) | Session (owner) |
| DELETE | `/api/v1/campaigns/[id]` | Cancel campaign | Session (owner) |
| POST | `/api/v1/contributions` | Contribute to a campaign | Session + linked |
| GET | `/api/v1/contributions/my` | List user's contributions (paginated) | Session |
| GET | `/api/v1/campaigns/my` | List user's own campaigns (paginated) | Session |

### API Route Pattern

```typescript
// src/app/api/v1/campaigns/route.ts
export async function POST(request: Request) {
  const result = authenticateSession(request)
    .andThen((session) =>
      ResultAsync.fromPromise(request.json(), () => badRequest("Invalid JSON"))
        .andThen((body) => validateWithResult(CreateCampaignSchema, body))
        .andThen((input) => campaignService.createCampaignResult(session.user.id, input))
    );

  return toApiResponse(result, "Campaign created successfully", 201);
}

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
```

## Business Rules

### Campaign Lifecycle

1. **active** — accepting contributions, countdown to deadline
2. **completed** — `current_amount >= target_amount` (auto-transition on contribution)
3. **cancelled** — creator manually cancels (only if status is `active`)

### Rules

- Each campaign gets exactly ONE dedicated Czechibank bank account (created at campaign creation time via Czechibank API) (what happens, when the bank-account is removed??)
- Contributions are Czechibank transactions from contributor's bank account to campaign's bank account
- `campaigns.current_amount` is denormalized — updated on each contribution. Can be reconciled by summing `contributions.amount`
- Users must have `czechibank_linked = true` to create campaigns or contribute
- Amounts are always in whole CZECHITOKEN (integer, no decimals)
- A user cannot contribute to their own campaign
- Contributions to completed or cancelled campaigns are rejected
- Contributions after the campaign deadline are rejected

### Contributing Flow

1. Contributor clicks "Fund this campaign" on a campaign page
2. Server retrieves contributor's Czechibank API key and selects their bank account
3. Calls Czechibank `POST /api/v1/transactions/create` with:
   - `fromBankNumber`: contributor's bank account number
   - `toBankNumber`: campaign's dedicated Czechibank account number
   - `amount`: contribution amount
   - `currency`: `"CZECHITOKEN"`
4. On success, creates `contributions` record + updates `campaigns.current_amount`
5. If `current_amount >= target_amount`, sets `campaigns.status = "completed"`

### Validation Schemas

```typescript
// campaign-schema.ts
export const CreateCampaignSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  targetAmount: z.number().int().positive().min(1),
  deadline: z.coerce.date().refine((d) => d > new Date(), {
    message: "Deadline must be in the future",
  }),
});

export const ContributeSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z.number().int().positive().min(1),
});

export const LinkCzechibankSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});
```

## Testing

### Test Fixtures (`shared/fixtures/`)

```typescript
// shared/fixtures/users.ts
export const SEED_USERS = {
  campaignCreator: {
    email: "creator@example.com",
    name: "Campaign Creator",
    password: "password123",
    czechibankApiKey: "key__creator",
    czechibankLinked: true,
    // has bank account with sufficient balance
  },
  contributor: {
    email: "contributor@example.com",
    name: "Generous Contributor",
    password: "password123",
    czechibankApiKey: "key__contributor",
    czechibankLinked: true,
  },
  unlinkedUser: {
    email: "unlinked@example.com",
    name: "Unlinked User",
    password: "password123",
    czechibankLinked: false,
    // no Czechibank API key
  },
} as const;

// shared/fixtures/campaigns.ts
export const SEED_CAMPAIGNS = {
  activeCampaign: {
    title: "Save the Kittens",
    description: "Help us rescue kittens from the streets",
    targetAmount: 5000,
    currentAmount: 1200,
    status: "active",
    deadline: "2026-12-31",
  },
  completedCampaign: {
    title: "Build a Playground",
    description: "Community playground project",
    targetAmount: 10000,
    currentAmount: 10000,
    status: "completed",
  },
} as const;
```

### Unit Tests (`tests/unit/`) — Vitest

Mock Czechibank client and Drizzle queries, test domain services in isolation.

```typescript
// tests/unit/campaign-service.test.ts
import { describe, it, expect, vi } from "vitest";
import { okAsync } from "neverthrow";

vi.mock("@/lib/czechibank-client", () => ({
  czechibankClient: {
    createBankAccount: vi.fn().mockReturnValue(okAsync({
      id: "ba-123",
      number: "900000000001/5555",
    })),
  },
}));

describe("Campaign Service", () => {
  it("should create campaign with dedicated bank account", async () => {
    const result = await campaignService.createCampaignResult("user-1", {
      title: "Test Campaign",
      description: "A test campaign for unit testing",
      targetAmount: 1000,
      deadline: new Date("2026-12-31"),
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.czechibankAccountNumber).toBe("900000000001/5555");
    }
  });

  it("should reject contribution to own campaign", async () => {
    const result = await contributionService.contributeResult("creator-id", {
      campaignId: "campaign-owned-by-creator",
      amount: 100,
    });

    expect(result.isErr()).toBe(true);
  });
});
```

### API Integration Tests (`tests/api/`) — Vitest

Require running commit2fund server + database. Test real HTTP requests.

```typescript
// tests/api/config/config.ts
export const config = {
  BASE_URL: `http://${process.env.HOST ?? "localhost:3001"}`,
};

// tests/api/campaigns.api.test.ts
import { describe, it, expect } from "vitest";
import { config } from "./config/config";

describe("Campaigns API", () => {
  describe("GET /api/v1/campaigns", () => {
    it("should return paginated active campaigns (public)", async () => {
      const response = await fetch(`${config.BASE_URL}/api/v1/campaigns?page=1&limit=5`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.meta.pagination.page).toBe(1);
      expect(data.meta.pagination.limit).toBe(5);
    });
  });

  describe("POST /api/v1/campaigns", () => {
    it("should return 401 without session", async () => {
      const response = await fetch(`${config.BASE_URL}/api/v1/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Test" }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 422 for invalid campaign data", async () => {
      // ... authenticate first, then send invalid body
      // expect 422 with validation details
    });
  });

  describe("POST /api/v1/contributions", () => {
    it("should reject contribution to completed campaign", async () => {
      // ... authenticate, attempt contribution to completed campaign
      // expect error response
    });

    it("should reject self-contribution", async () => {
      // ... authenticate as campaign owner, attempt contribution
      // expect error response
    });
  });
});
```

### BDD E2E Tests (`tests/bdd-tests/`) — Playwright-BDD

```gherkin
# tests/bdd-tests/features/create-campaign.feature
Feature: Create Campaign
  As a registered user with a linked Czechibank account
  I want to create a funding campaign
  So that supporters can contribute Czechitokens

  Background:
    Given I am logged in as "creator@example.com"
    And my Czechibank account is linked

  Scenario: Create a campaign with valid data
    When I navigate to "Create Campaign"
    And I fill in campaign title "Save the Kittens"
    And I fill in campaign description "Help us rescue kittens from the streets"
    And I fill in target amount "5000"
    And I select deadline "2026-12-31"
    And I click "Create Campaign"
    Then I should see "Campaign created successfully"
    And I should be redirected to the campaign page
    And I should see progress bar at "0%"

  Scenario: Cannot create campaign without linked Czechibank account
    Given I am logged in as "unlinked@example.com"
    When I navigate to "Create Campaign"
    Then I should see "Link your Czechibank account first"
```

```gherkin
# tests/bdd-tests/features/contribute.feature
Feature: Contribute to Campaign
  As a supporter with a linked Czechibank account
  I want to send Czechitokens to a campaign
  So that I can help fund it

  Background:
    Given I am logged in as "contributor@example.com"
    And a campaign "Save the Kittens" exists with target "5000"

  Scenario: Make a successful contribution
    When I open campaign "Save the Kittens"
    And I enter contribution amount "100"
    And I click "Contribute"
    Then I should see "Contribution successful"
    And the campaign progress should update

  Scenario: Cannot contribute to own campaign
    Given I am logged in as "creator@example.com"
    When I open my campaign "Save the Kittens"
    Then I should not see the "Contribute" button
```

```gherkin
# tests/bdd-tests/features/link-account.feature
Feature: Link Czechibank Account
  As a registered user
  I want to link my Czechibank API key
  So that I can create campaigns and contribute

  Background:
    Given I am logged in as "unlinked@example.com"

  Scenario: Successfully link Czechibank account
    When I navigate to "Link Account"
    And I enter my Czechibank API key
    And I click "Link Account"
    Then I should see "Account linked successfully"
    And I should see my Czechibank user name

  Scenario: Invalid API key
    When I navigate to "Link Account"
    And I enter an invalid API key "invalid-key-123"
    And I click "Link Account"
    Then I should see error "Invalid Czechibank API key"
```

**Step Implementation Pattern:**

```typescript
// tests/bdd-tests/steps/campaign.steps.ts
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given("I am logged in as {string}", async ({ page }, email: string) => {
  await page.goto("/signin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/dashboard");
});

When("I navigate to {string}", async ({ page }, pageName: string) => {
  const path = pageMap[pageName];
  await page.goto(path);
});

When("I fill in campaign title {string}", async ({ page }, title: string) => {
  await page.getByLabel("Title").fill(title);
});

Then("I should see progress bar at {string}", async ({ page }, percentage: string) => {
  await expect(page.getByRole("progressbar")).toContainText(percentage);
});
```

**Page Map:**

```typescript
// tests/bdd-tests/constants/pageMap.ts
export const pageMap: Record<string, string> = {
  Dashboard: "/dashboard",
  "Create Campaign": "/campaigns/new",
  "Link Account": "/link-account",
  Signin: "/signin",
};
```

### Vitest Config (`vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["./tests/api/**/*.test.ts", "./tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Playwright Config (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "tests/bdd-tests/features/**/*.feature",
  steps: "tests/bdd-tests/steps/**/*.ts",
});

export default defineConfig({
  timeout: 30_000,
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list", { printSteps: false }], ["html"]],
  use: {
    baseURL: process.env.PW_BASE_URL || "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

### Running Tests

```bash
# Single test file
pnpm vitest run tests/unit/campaign-service.test.ts
pnpm vitest run tests/api/campaigns.api.test.ts

# BDD — generates specs then runs Playwright
pnpm run test:e2e

# Single BDD feature
pnpm playwright test tests/bdd-tests/.features-gen/create-campaign.feature.spec.js
```

## Environment Setup

### Prerequisites

- Node.js ~20
- pnpm
- Docker (for PostgreSQL)
- Running Czechibank instance (for integration/E2E tests)

### Steps

1. `cp .env.example .env` and configure:
   ```
   # Database
   DATABASE_URL=postgres://commit2fund:commit2fund@localhost:2222/commit2fund

   # Better-Auth
   AUTH_SECRET=<minimum 32 chars random string>
   BETTER_AUTH_URL=http://localhost:3001

   # Czechibank API
   CZECHIBANK_API_URL=http://localhost:3000

   # App
   HOST=localhost:3001
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   ```
2. `docker compose up -d` (starts PostgreSQL on port 2222)
3. `pnpm install`
4. `pnpm run db:migrate`
5. `pnpm run db:seed` (seeds test users and campaigns)
6. `pnpm run dev` (starts on port 3001)

**Note:** Czechibank must be running on port 3000 for integration tests and full functionality. Start it separately.

### Docker Compose (`docker-compose.yml`)

```yaml
services:
  commit2fund-db:
    container_name: commit2fund-db
    image: postgres:14.1-alpine
    restart: always
    environment:
      - POSTGRES_USER=commit2fund
      - POSTGRES_PASSWORD=commit2fund
      - POSTGRES_DB=commit2fund
    ports:
      - "2222:5432"
    volumes:
      - ./data:/var/lib/postgresql/data
```

## CI/CD

GitHub Actions workflow runs: unit tests → API tests (with PostgreSQL service) → E2E tests (with Docker Compose including Czechibank).

```yaml
# .github/workflows/ci.yml
jobs:
  unit-tests:
    steps:
      - pnpm run test:unit

  api-tests:
    services:
      postgres:
        image: postgres:14.1-alpine
        env:
          POSTGRES_USER: commit2fund
          POSTGRES_PASSWORD: commit2fund
          POSTGRES_DB: commit2fund
        ports: ["2222:5432"]
    steps:
      - pnpm run db:migrate
      - pnpm run db:seed
      - pnpm run build && pnpm start &
      - pnpm run test:api

  e2e-tests:
    steps:
      - docker compose -f docker-compose.ci.yml up -d  # includes Czechibank
      - pnpm run db:migrate
      - pnpm run db:seed
      - pnpm run test:e2e
```

Pre-commit hooks auto-format with Prettier via Husky.
