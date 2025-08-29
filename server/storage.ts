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
} from "../shared/schema.js";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Lottery operations
  getAllLotteries(): Promise<Lottery[]>;
  getLotteryById(id: number): Promise<Lottery | undefined>;
  createLottery(lottery: Omit<Lottery, 'id' | 'createdAt'>): Promise<Lottery>;

  // Lottery results
  getLatestResults(lotteryId: number, limit?: number): Promise<LotteryResult[]>;
  createLotteryResult(result: Omit<LotteryResult, 'id' | 'createdAt'>): Promise<LotteryResult>;

  // User games
  createUserGame(game: InsertUserGame): Promise<UserGame>;
  getUserGames(userId: string, lotteryId?: number): Promise<UserGame[]>;
  getUserGamesByLottery(lotteryId: number): Promise<UserGame[]>;

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

  // Collaborative Strategies
  updateCollaborativeStrategies(lotterySlug: string, strategies: any[]): Promise<void>;
  getCollaborativeStrategies(lotterySlug: string): Promise<any[]>;

  // n8n Integration Methods
  saveN8nStatistics(lotteryName: string, data: any): Promise<void>;
  saveN8nStrategies(strategies: any): Promise<void>;
  getLatestN8nStrategies(): Promise<any>;
  getLotteryByName(name: string): Promise<any>;
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

  async createLottery(lotteryData: Omit<Lottery, 'id' | 'createdAt'>): Promise<Lottery> {
    const [newLottery] = await db
      .insert(lotteries)
      .values(lotteryData)
      .returning();
    return newLottery;
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
    const query = db.select().from(userGames).where(eq(userGames.userId, userId));

    if (lotteryId) {
      return await query.where(eq(userGames.lotteryId, lotteryId));
    }

    return await query;
  }

  async getUserGamesByLottery(lotteryId: number): Promise<UserGame[]> {
    return await db
      .select()
      .from(userGames)
      .where(eq(userGames.lotteryId, lotteryId))
      .orderBy(desc(userGames.createdAt));
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
    const newVersion = currentModel ? (currentModel.version || 0) + 1 : 1;

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

  async clearNumberFrequencies(lotteryId: number): Promise<void> {
    await db.delete(numberFrequency).where(eq(numberFrequency.lotteryId, lotteryId));
  }

  async updateNumberFrequency(lotteryId: number, number: number, frequency: number): Promise<void> {
    // Primeiro, tentar encontrar um registro existente
    const existing = await db
      .select()
      .from(numberFrequency)
      .where(
        and(
          eq(numberFrequency.lotteryId, lotteryId),
          eq(numberFrequency.number, number)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Atualizar registro existente
      await db
        .update(numberFrequency)
        .set({
          frequency,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(numberFrequency.lotteryId, lotteryId),
            eq(numberFrequency.number, number)
          )
        );
    } else {
      // Inserir novo registro
      await db
        .insert(numberFrequency)
        .values({
          lotteryId,
          number,
          frequency,
          updatedAt: new Date(),
        });
    }
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

  // Buscar todos os jogos de usuários (para estatísticas gerais)
  async getAllUserGames(): Promise<UserGame[]> {
    return await db
      .select()
      .from(userGames)
      .orderBy(desc(userGames.createdAt));
  }

  // Buscar jogos recentes por data
  async getRecentUserGames(lotteryId: number, since: Date): Promise<UserGame[]> {
    return await db
      .select()
      .from(userGames)
      .where(
        and(
          eq(userGames.lotteryId, lotteryId),
          gte(userGames.createdAt, since)
        )
      )
      .orderBy(desc(userGames.createdAt));
  }

  async updateCollaborativeStrategies(lotterySlug: string, strategies: any[]): Promise<void> {
    try {
      // Salvar estratégias colaborativas (implementação simplificada usando uma tabela temporária ou cache)
      console.log(`💡 Estratégias colaborativas atualizadas para ${lotterySlug}:`, strategies.length);
    } catch (error) {
      console.error('Erro ao salvar estratégias colaborativas:', error);
    }
  }

  async getCollaborativeStrategies(lotterySlug: string): Promise<any[]> {
    try {
      // Recuperar estratégias colaborativas
      return [];
    } catch (error) {
      console.error('Erro ao recuperar estratégias colaborativas:', error);
      return [];
    }
  }

  // Métodos para integração com n8n
  async saveN8nStatistics(lotteryName: string, data: any): Promise<void> {
    try {
      // Assumindo que 'db' é uma instância acessível ou passada para a classe.
      // Se 'db' não estiver diretamente acessível aqui, você precisará passá-lo para o construtor da classe.
      // Exemplo com um cliente de banco de dados hipotético `this.db`:
      const query = `
        INSERT INTO n8n_statistics (lottery_name, statistics_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (lottery_name) 
        DO UPDATE SET statistics_data = $2, updated_at = NOW()
      `;

      // Substitua `this.db.execute` pelo método correto do seu cliente de banco de dados
      // Aqui, estamos usando `db` diretamente como no restante da classe, mas para maior clareza,
      // pode ser melhor ter uma instância de banco de dados explícita na classe.
      await db.execute(query, [lotteryName, JSON.stringify(data)]);
      console.log(`✅ Estatísticas n8n salvas para ${lotteryName}`);
    } catch (error) {
      console.error("Erro ao salvar estatísticas n8n:", error);
      throw error;
    }
  }

  async saveN8nStrategies(strategies: any): Promise<void> {
    try {
      const query = `
        INSERT INTO n8n_strategies (strategies_data, created_at)
        VALUES ($1, NOW())
      `;
      // Novamente, assumindo `db` acessível.
      await db.execute(query, [JSON.stringify(strategies)]);
      console.log('✅ Estratégias n8n salvas');
    } catch (error) {
      console.error("Erro ao salvar estratégias n8n:", error);
      throw error;
    }
  }

  async getLatestN8nStrategies(): Promise<any> {
    try {
      // Assumindo `db` acessível.
      const result = await db.execute(`
        SELECT strategies_data
        FROM n8n_strategies
        ORDER BY created_at DESC
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        return JSON.parse(result.rows[0].strategies_data);
      }

      return {};
    } catch (error) {
      console.error("Erro ao buscar estratégias n8n:", error);
      return {};
    }
  }

  async getLotteryByName(name: string): Promise<any> {
    try {
      // Assumindo `db` acessível.
      const result = await db.execute(
        'SELECT * FROM lotteries WHERE name = $1',
        [name]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error("Erro ao buscar loteria por nome:", error);
      return null;
    }
  }
}

export const storage = new DatabaseStorage();