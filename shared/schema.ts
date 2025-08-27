import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  boolean,
  text,
  decimal,
  serial,
  unique, // Import unique
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lottery types - Todas as loterias da Caixa
export const lotteries = pgTable("lotteries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(), // Para URLs e identificação
  maxNumber: integer("max_number").notNull(),
  minNumbers: integer("min_numbers").notNull(),
  maxNumbers: integer("max_numbers").notNull(),
  drawDays: text("draw_days").notNull(), // JSON string array
  description: text("description"),
  gameType: varchar("game_type", { length: 30 }).notNull(), // standard, special, etc
  betValue: decimal("bet_value", { precision: 10, scale: 2 }).default("2.50"),
  specialNumbers: boolean("special_numbers").default(false), // Para Dia de Sorte (mês da sorte)
  createdAt: timestamp("created_at").defaultNow(),
});

// Historical lottery results - Resultados completos com premiações
export const lotteryResults = pgTable("lottery_results", {
  id: serial("id").primaryKey(),
  lotteryId: integer("lottery_id").references(() => lotteries.id),
  contestNumber: integer("contest_number").notNull(),
  drawnNumbers: text("drawn_numbers").notNull(), // JSON array de números sorteados
  drawDate: timestamp("draw_date").notNull(),
  nextDrawDate: timestamp("next_draw_date"),
  estimatedPrize: decimal("estimated_prize", { precision: 15, scale: 2 }),
  actualPrize: decimal("actual_prize", { precision: 15, scale: 2 }),
  isAccumulated: boolean("is_accumulated").default(false),
  specialNumber: varchar("special_number", { length: 20 }), // Para Dia de Sorte (mês), Timemania (time)
  prizeTiers: jsonb("prize_tiers"), // Detalhes de todas as faixas de premiação
  totalWinners: integer("total_winners").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  lotteryContestIdx: index("lottery_contest_idx").on(table.lotteryId, table.contestNumber),
  lotteryContestUnique: unique('lottery_contest_unique').on(table.lotteryId, table.contestNumber),
}));

// User generated games
export const userGames = pgTable("user_games", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  lotteryId: integer("lottery_id").references(() => lotteries.id),
  numbers: text("numbers").notNull(), // JSON array
  contestNumber: integer("contest_number"),
  isPlayed: boolean("is_played").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User game results tracking
export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  userGameId: integer("user_game_id").references(() => userGames.id),
  contestId: integer("contest_id").references(() => lotteryResults.id),
  hits: integer("hits").notNull(),
  prizeValue: decimal("prize_value", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI prediction models
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  lotteryId: integer("lottery_id").references(() => lotteries.id),
  modelData: jsonb("model_data").notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  trainingDate: timestamp("training_date").defaultNow(),
  version: integer("version").default(1),
});

// Number frequency analysis
export const numberFrequency = pgTable("number_frequency", {
  id: serial("id").primaryKey(),
  lotteryId: integer("lottery_id").references(() => lotteries.id),
  number: integer("number").notNull(),
  frequency: integer("frequency").notNull(),
  lastDrawn: timestamp("last_drawn"),
  isHot: boolean("is_hot").default(false),
  isCold: boolean("is_cold").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  lotteryNumberIdx: index("lottery_number_idx").on(table.lotteryId, table.number),
  lotteryNumberUnique: unique('lottery_number_unique').on(table.lotteryId, table.number),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  games: many(userGames),
}));

export const lotteriesRelations = relations(lotteries, ({ many }) => ({
  results: many(lotteryResults),
  games: many(userGames),
  aiModels: many(aiModels),
  frequencies: many(numberFrequency),
}));

export const userGamesRelations = relations(userGames, ({ one, many }) => ({
  user: one(users, { fields: [userGames.userId], references: [users.id] }),
  lottery: one(lotteries, { fields: [userGames.lotteryId], references: [lotteries.id] }),
  results: many(gameResults),
}));

export const lotteryResultsRelations = relations(lotteryResults, ({ one, many }) => ({
  lottery: one(lotteries, { fields: [lotteryResults.lotteryId], references: [lotteries.id] }),
  gameResults: many(gameResults),
}));

export const gameResultsRelations = relations(gameResults, ({ one }) => ({
  userGame: one(userGames, { fields: [gameResults.userGameId], references: [userGames.id] }),
  contest: one(lotteryResults, { fields: [gameResults.contestId], references: [lotteryResults.id] }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Lottery = typeof lotteries.$inferSelect;
export type LotteryResult = typeof lotteryResults.$inferSelect;
export type UserGame = typeof userGames.$inferSelect;
export type GameResult = typeof gameResults.$inferSelect;
export type AIModel = typeof aiModels.$inferSelect;
export type NumberFrequency = typeof numberFrequency.$inferSelect;

// Insert schemas
export const insertLotterySchema = createInsertSchema(lotteries);
export const insertUserGameSchema = createInsertSchema(userGames).omit({ id: true, createdAt: true });
export const insertGameResultSchema = createInsertSchema(gameResults).omit({ id: true, createdAt: true });

export type InsertUserGame = z.infer<typeof insertUserGameSchema>;
export type InsertGameResult = z.infer<typeof insertGameResultSchema>;