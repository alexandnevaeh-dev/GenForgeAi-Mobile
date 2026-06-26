import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash"),
  avatar: text("avatar"),
  bio: text("bio"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  aiCreditsUsed: integer("ai_credits_used").notNull().default(0),
  aiCreditsLimit: integer("ai_credits_limit").notNull().default(100),
  totalProjects: integer("total_projects").notNull().default(0),
  totalAssets: integer("total_assets").notNull().default(0),
  totalGenerations: integer("total_generations").notNull().default(0),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  isMfaEnabled: boolean("is_mfa_enabled").notNull().default(false),
  role: text("role").notNull().default("free"),
  preferences: json("preferences").$type<Record<string, unknown>>().default({}),
  notificationSettings: json("notification_settings").$type<Record<string, boolean>>().default({}),
  privacySettings: json("privacy_settings").$type<Record<string, boolean>>().default({}),
  connectedAccounts: json("connected_accounts").$type<Record<string, string>>().default({}),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  deviceInfo: text("device_info"),
  ipAddress: text("ip_address"),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  genre: text("genre").notNull().default("RPG"),
  artStyle: text("art_style").notNull().default("Pixel Art"),
  platform: text("platform").notNull().default("Multi-platform"),
  status: text("status").notNull().default("planning"),
  progress: integer("progress").notNull().default(0),
  coverArt: text("cover_art"),
  tags: json("tags").$type<string[]>().default([]),
  storyData: json("story_data").$type<Record<string, unknown>>().default({}),
  worldData: json("world_data").$type<Record<string, unknown>>().default({}),
  characterData: json("character_data").$type<Record<string, unknown>>().default({}),
  combatData: json("combat_data").$type<Record<string, unknown>>().default({}),
  assetManifest: json("asset_manifest").$type<unknown[]>().default([]),
  audioManifest: json("audio_manifest").$type<unknown[]>().default([]),
  exportConfigs: json("export_configs").$type<Record<string, unknown>>().default({}),
  buildLogs: json("build_logs").$type<unknown[]>().default([]),
  versionHistory: json("version_history").$type<unknown[]>().default([]),
  agentStates: json("agent_states").$type<Record<string, unknown>>().default({}),
  isPublic: boolean("is_public").notNull().default(false),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  lastGeneratedAt: timestamp("last_generated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const aiTasks = pgTable("ai_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentName: text("agent_name").notNull(),
  agentPhase: text("agent_phase").notNull().default("planning"),
  taskType: text("task_type").notNull(),
  status: text("status").notNull().default("pending"),
  priority: integer("priority").notNull().default(5),
  progress: integer("progress").notNull().default(0),
  inputData: json("input_data").$type<Record<string, unknown>>().default({}),
  outputData: json("output_data").$type<Record<string, unknown>>().default({}),
  logs: json("logs").$type<string[]>().default([]),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  executionTimeMs: integer("execution_time_ms"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  url: text("url"),
  thumbnailUrl: text("thumbnail_url"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  tags: json("tags").$type<string[]>().default([]),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("free"),
  status: text("status").notNull().default("active"),
  billingInterval: text("billing_interval").notNull().default("monthly"),
  currentPeriodStart: timestamp("current_period_start").notNull().defaultNow(),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelledAt: timestamp("cancelled_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  externalSubscriptionId: text("external_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: json("data").$type<Record<string, unknown>>().default({}),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agentMemories = pgTable("agent_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agent: text("agent").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  phase: integer("phase").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("generate"),
  status: text("status").notNull().default("pending"),
  phase: integer("phase").notNull().default(0),
  progress: integer("progress").notNull().default(0),
  label: text("label").notNull().default(""),
  inputData: json("input_data").$type<Record<string, unknown>>().default({}),
  result: json("result").$type<Record<string, unknown>>(),
  logs: json("logs").$type<string[]>().default([]),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  author: text("author").notNull().default("ForgeStudio"),
  description: text("description").notNull().default(""),
  genre: text("genre").notNull().default("RPG"),
  artStyle: text("art_style").notNull().default("Pixel Art"),
  difficulty: text("difficulty").notNull().default("Beginner"),
  category: text("category").notNull().default("templates"),
  tags: json("tags").$type<string[]>().default([]),
  rating: integer("rating").notNull().default(47),
  reviewCount: integer("review_count").notNull().default(0),
  usageCount: integer("usage_count").notNull().default(0),
  isPremium: boolean("is_premium").notNull().default(false),
  priceCents: integer("price_cents").notNull().default(0),
  badge: text("badge"),
  promptHint: text("prompt_hint").notNull().default(""),
  coverImageUrl: text("cover_image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type AiTask = typeof aiTasks.$inferSelect;
export type NewAiTask = typeof aiTasks.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type AgentMemory = typeof agentMemories.$inferSelect;
export type NewAgentMemory = typeof agentMemories.$inferInsert;
