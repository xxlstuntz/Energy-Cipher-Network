import { pgTable, text, serial, boolean, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inviteCodesTable = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  tier: text("tier").notNull().default("ascended"),
});

export const insertInviteCodeSchema = createInsertSchema(inviteCodesTable).omit({ id: true, createdAt: true });
export type InsertInviteCode = z.infer<typeof insertInviteCodeSchema>;
export type InviteCode = typeof inviteCodesTable.$inferSelect;

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  alias: text("alias").notNull(),
  vibrationLevel: text("vibration_level").notNull().default("Seeker"),
  plan: text("plan").notNull().default("free"),
  dailyMessages: integer("daily_messages").notNull().default(0),
  lastMessageDate: text("last_message_date").default(""),
  resonanceProfile: text("resonance_profile").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true, lastActiveAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;

export const chatMessagesTable = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  energySignature: text("energy_signature"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;

// ── Community Feed Posts (TikTok-inspired) ──────────────────────────────────
export const feedPostsTable = pgTable("feed_posts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id),
  authorAlias: text("author_alias").notNull(),
  vibrationLevel: text("vibration_level").notNull().default("Seeker"),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"), // "general" | "insight" | "feedback" | "bug" | "idea"
  amplifies: integer("amplifies").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFeedPostSchema = createInsertSchema(feedPostsTable).omit({ id: true, createdAt: true, amplifies: true });
export type InsertFeedPost = z.infer<typeof insertFeedPostSchema>;
export type FeedPost = typeof feedPostsTable.$inferSelect;

// ── Feed Comments ─────────────────────────────────────────────────────────────
export const feedCommentsTable = pgTable("feed_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => feedPostsTable.id),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id),
  authorAlias: text("author_alias").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFeedCommentSchema = createInsertSchema(feedCommentsTable).omit({ id: true, createdAt: true });
export type InsertFeedComment = z.infer<typeof insertFeedCommentSchema>;
export type FeedComment = typeof feedCommentsTable.$inferSelect;

// ── Community Group Chat ──────────────────────────────────────────────────────
export const communityMessagesTable = pgTable("community_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id),
  authorAlias: text("author_alias").notNull(),
  vibrationLevel: text("vibration_level").notNull().default("Seeker"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommunityMessageSchema = createInsertSchema(communityMessagesTable).omit({ id: true, createdAt: true });
export type InsertCommunityMessage = z.infer<typeof insertCommunityMessageSchema>;
export type CommunityMessage = typeof communityMessagesTable.$inferSelect;

// ── Direct Messages (Snapchat-style ephemeral) ────────────────────────────────
export const directMessagesTable = pgTable("direct_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromAlias: text("from_alias").notNull(),
  toAlias: text("to_alias").notNull(),
  content: text("content").notNull(),
  viewed: boolean("viewed").notNull().default(false),
  viewedAt: timestamp("viewed_at"),
  expiresAt: timestamp("expires_at"), // null = lasts until viewed
  streak: integer("streak").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDirectMessageSchema = createInsertSchema(directMessagesTable).omit({ createdAt: true, viewed: true, viewedAt: true });
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessagesTable.$inferSelect;

// ── Amplify Records (prevent double-amplifying) ───────────────────────────────
export const amplifiesTable = pgTable("amplifies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => feedPostsTable.id),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
