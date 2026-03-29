import { pgTable, text, serial, boolean, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inviteCodesTable = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  tier: text("tier").notNull().default("ascended"), // "free" | "ascended"
});

export const insertInviteCodeSchema = createInsertSchema(inviteCodesTable).omit({ id: true, createdAt: true });
export type InsertInviteCode = z.infer<typeof insertInviteCodeSchema>;
export type InviteCode = typeof inviteCodesTable.$inferSelect;

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  alias: text("alias").notNull(),
  vibrationLevel: text("vibration_level").notNull().default("Seeker"),
  plan: text("plan").notNull().default("free"), // "free" | "ascended"
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
