import {
  users,
  lotteries,
  lotteryResults,
  userGames,
  gameResults,
  aiModels,
  numberFrequency,
  type User,
  type UpsertUser,
  type Lottery,
  type LotteryResult,
  type UserGame,
  type GameResult,
  type AIModel,
  type NumberFrequency,
  type InsertUserGame,
  type InsertGameResult,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Lottery operations
  getAllLotteries(): Promise<Lottery[]>;
  getLotteryById(id: number): Promise<Lottery | undefined>;
  
  // Lottery results
  getLatestResults(lotteryId: number, limit?: number): Promise<LotteryResult[]>;
  createLotteryResult(result: Omit<LotteryResult, 'id' | 'createdAt'>): Promise<LotteryResult>;
  
  // User games
  createUserGame(game: InsertUserGame): Promise<UserGame>;
  getUserGames(userId: string, lotteryId?: number): Promise<UserGame[]>;
  
  // Game results
  createGameResult(result: InsertGameResult): Promise<GameResult>;
  getUserGameResults(userId: string): Promise<GameResult[]>;
  
  // AI models
  getAIModel(lotteryId: number): Promise<AIModel | undefined>;
  updateAIModel(lotteryId: number, modelData: any, accuracy: number): Promise<AIModel>;
  
  // Number frequency
  getNumberFrequencies(lotteryId: number): Promise<NumberFrequency[]>;
  updateNumberFrequency(lotteryId: number, number: number, frequency: number): Promise<void>;
  
  // Analytics
  getUserStats(userId: string): Promise<{
    totalGames: number;
    totalWins: number;
    totalEarnings: number;
    winRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Lottery operations
  async getAllLotteries(): Promise<Lottery[]> {
    return await db.select().from(lotteries);
  }

  async getLotteryById(id: number): Promise<Lottery | undefined> {
    const [lottery] = await db.select().from(lotteries).where(eq(lotteries.id, id));
    return lottery;
  }

  // Lottery results
  async getLatestResults(lotteryId: number, limit = 20): Promise<LotteryResult[]> {
    return await db
      .select()
      .from(lotteryResults)
      .where(eq(lotteryResults.lotteryId, lotteryId))
      .orderBy(desc(lotteryResults.drawDate))
      .limit(limit);
  }

  async createLotteryResult(result: Omit<LotteryResult, 'id' | 'createdAt'>): Promise<LotteryResult> {
    const [newResult] = await db
      .insert(lotteryResults)
      .values(result)
      .returning();
    return newResult;
  }

  // User games
  async createUserGame(game: InsertUserGame): Promise<UserGame> {
    const [newGame] = await db
      .insert(userGames)
      .values(game)
      .returning();
    return newGame;
  }

  async getUserGames(userId: string, lotteryId?: number): Promise<UserGame[]> {
    const query = db
      .select()
      .from(userGames)
      .where(eq(userGames.userId, userId));
      
    if (lotteryId) {
      query.where(and(eq(userGames.userId, userId), eq(userGames.lotteryId, lotteryId)));
    }
    
    return await query.orderBy(desc(userGames.createdAt));
  }

  // Game results
  async createGameResult(result: InsertGameResult): Promise<GameResult> {
    const [newResult] = await db
      .insert(gameResults)
      .values(result)
      .returning();
    return newResult;
  }

  async getUserGameResults(userId: string): Promise<GameResult[]> {
    return await db
      .select({
        id: gameResults.id,
        userGameId: gameResults.userGameId,
        contestId: gameResults.contestId,
        hits: gameResults.hits,
        prizeValue: gameResults.prizeValue,
        createdAt: gameResults.createdAt,
      })
      .from(gameResults)
      .innerJoin(userGames, eq(gameResults.userGameId, userGames.id))
      .where(eq(userGames.userId, userId))
      .orderBy(desc(gameResults.createdAt));
  }

  // AI models
  async getAIModel(lotteryId: number): Promise<AIModel | undefined> {
    const [model] = await db
      .select()
      .from(aiModels)
      .where(eq(aiModels.lotteryId, lotteryId))
      .orderBy(desc(aiModels.version))
      .limit(1);
    return model;
  }

  async updateAIModel(lotteryId: number, modelData: any, accuracy: number): Promise<AIModel> {
    const currentModel = await this.getAIModel(lotteryId);
    const newVersion = currentModel ? currentModel.version + 1 : 1;
    
    const [model] = await db
      .insert(aiModels)
      .values({
        lotteryId,
        modelData,
        accuracy: accuracy.toString(),
        version: newVersion,
      })
      .returning();
    return model;
  }

  // Number frequency
  async getNumberFrequencies(lotteryId: number): Promise<NumberFrequency[]> {
    return await db
      .select()
      .from(numberFrequency)
      .where(eq(numberFrequency.lotteryId, lotteryId))
      .orderBy(numberFrequency.number);
  }

  async updateNumberFrequency(lotteryId: number, number: number, frequency: number): Promise<void> {
    await db
      .insert(numberFrequency)
      .values({
        lotteryId,
        number,
        frequency,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [numberFrequency.lotteryId, numberFrequency.number],
        set: {
          frequency,
          updatedAt: new Date(),
        },
      });
  }

  // Analytics
  async getUserStats(userId: string): Promise<{
    totalGames: number;
    totalWins: number;
    totalEarnings: number;
    winRate: number;
  }> {
    const games = await db
      .select({ count: sql<number>`count(*)` })
      .from(userGames)
      .where(eq(userGames.userId, userId));

    const results = await db
      .select({
        wins: sql<number>`count(*)`,
        earnings: sql<number>`sum(${gameResults.prizeValue})`,
      })
      .from(gameResults)
      .innerJoin(userGames, eq(gameResults.userGameId, userGames.id))
      .where(and(
        eq(userGames.userId, userId),
        gte(gameResults.hits, 3)
      ));

    const totalGames = games[0]?.count || 0;
    const totalWins = results[0]?.wins || 0;
    const totalEarnings = parseFloat(results[0]?.earnings?.toString() || '0');
    const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

    return {
      totalGames,
      totalWins,
      totalEarnings,
      winRate,
    };
  }
}

export const storage = new DatabaseStorage();
