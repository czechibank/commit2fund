import { pgTable, text, integer, timestamp, boolean, pgEnum, uuid } from "drizzle-orm/pg-core";

// -- Better-Auth managed tables --

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // commit2fund-specific: linked Czechibank account
  czechibankApiKey: text("czechibank_api_key"),
  czechibankUserId: text("czechibank_user_id"),
  czechibankLinked: boolean("czechibank_linked").notNull().default(false),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
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

// -- Application tables --

export const campaignStatusEnum = pgEnum("campaign_status", ["active", "completed", "cancelled"]);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetAmount: integer("target_amount").notNull(),
  currentAmount: integer("current_amount").notNull().default(0),
  deadline: timestamp("deadline").notNull(),
  status: campaignStatusEnum("status").notNull().default("active"),
  creatorId: text("creator_id")
    .notNull()
    .references(() => user.id),
  czechibankAccountNumber: text("czechibank_account_number"),
  czechibankAccountId: text("czechibank_account_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contributions = pgTable("contributions", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id),
  contributorId: text("contributor_id")
    .notNull()
    .references(() => user.id),
  amount: integer("amount").notNull(),
  czechibankTransactionId: text("czechibank_transaction_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
