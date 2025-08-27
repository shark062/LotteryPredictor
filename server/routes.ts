import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { lotteryService } from "./services/lotteryService";
import { aiService } from "./services/aiService";
import { webScrapingService } from "./services/webScrapingService";
import { lotteryDataService } from "./services/lotteryDataService";
import { insertUserGameSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize lottery service
  await lotteryService.initializeLotteries();
  
  // Initialize Brazilian lotteries with real data
  await lotteryDataService.initializeLotteries();

  // Cache para dados das loterias (atualizado a cada 1 hora)
  let upcomingDrawsCache: any = null;
  let cacheTimestamp = 0;
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hora em milliseconds

  // Auth routes - simplified without authentication
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Return default user for demo purposes
      const defaultUser = {
        id: 'demo-user',
        email: 'usuario@demo.com',
        name: 'Usuário Demo'
      };
      res.json(defaultUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Lottery routes
  app.get("/api/lotteries", async (req, res) => {
    try {
      const lotteries = await storage.getAllLotteries();
      res.json(lotteries);
    } catch (error) {
      console.error("Error fetching lotteries:", error);
      res.status(500).json({ message: "Failed to fetch lotteries" });
    }
  });

  app.get("/api/lotteries/upcoming", async (req, res) => {
    try {
      const now = Date.now();
      const forceUpdate = req.query.force === 'true';
      
      // Verificar se o cache ainda é válido
      if (!forceUpdate && upcomingDrawsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return res.json(upcomingDrawsCache);
      }

      // Atualizar cache
      const upcoming = await lotteryService.getUpcomingDraws();
      upcomingDrawsCache = upcoming;
      cacheTimestamp = now;
      
      res.json(upcoming);
    } catch (error) {
      console.error("Error fetching upcoming draws:", error);
      res.status(500).json({ message: "Failed to fetch upcoming draws" });
    }
  });

  // Nova rota para atualizar dados manualmente
  app.post("/api/lotteries/update", async (req, res) => {
    try {
      const scrapeData = await webScrapingService.getLotteryInfo();
      
      // Atualizar dados reais das loterias do site Lotérica Nova
      await lotteryDataService.updateAllLotteries();
      
      upcomingDrawsCache = null; // Limpar cache
      res.json({ 
        success: true, 
        data: scrapeData,
        message: "Dados das loterias atualizados com sucesso"
      });
    } catch (error) {
      console.error("Error updating lottery data:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro ao atualizar dados das loterias" 
      });
    }
  });

  // Rota para resetar dados de frequência
  app.post("/api/lotteries/:id/reset-frequency", async (req, res) => {
    try {
      const lotteryId = parseInt(req.params.id);
      const lottery = await storage.getLotteryById(lotteryId);
      
      if (!lottery) {
        return res.status(404).json({ message: "Lottery not found" });
      }

      // Limpar dados de frequência existentes
      await storage.clearNumberFrequencies(lotteryId);
      
      // Reinicializar com dados aleatórios
      await lotteryService.initializeFrequencyData(lotteryId, lottery.maxNumber);
      
      res.json({ 
        success: true, 
        message: "Dados de frequência resetados com sucesso" 
      });
    } catch (error) {
      console.error("Error resetting frequency data:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro ao resetar dados de frequência" 
      });
    }
  });

  app.get("/api/lotteries/:id/results", async (req, res) => {
    try {
      const lotteryId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 20;
      const results = await storage.getLatestResults(lotteryId, limit);
      res.json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  // Nova rota para obter resultados atualizados da Lotérica Nova
  app.get("/api/lotteries/:slug/latest", async (req, res) => {
    try {
      const { slug } = req.params;
      const result = await lotteryDataService.getLotteryResults(slug);
      
      if (!result) {
        return res.status(404).json({ message: "Lottery not found or no results available" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching latest lottery results:", error);
      res.status(500).json({ message: "Failed to fetch latest lottery results" });
    }
  });

  // Nova rota para obter todos os dados reais das loterias
  app.get("/api/lotteries/real-data", async (req, res) => {
    try {
      const realData = await lotteryDataService.getAllLotteryData();
      res.json(realData);
    } catch (error) {
      console.error("Error fetching real lottery data:", error);
      res.status(500).json({ message: "Failed to fetch real lottery data" });
    }
  });

  app.get("/api/lotteries/:id/analysis", async (req, res) => {
    try {
      const lotteryId = parseInt(req.params.id);
      await lotteryService.updateFrequencyAnalysis(lotteryId);
      const analysis = await lotteryService.getNumberAnalysis(lotteryId);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  app.get("/api/lotteries/:id/frequencies", async (req, res) => {
    try {
      const lotteryId = parseInt(req.params.id);
      const frequencies = await storage.getNumberFrequencies(lotteryId);
      res.json(frequencies);
    } catch (error) {
      console.error("Error fetching frequencies:", error);
      res.status(500).json({ message: "Failed to fetch frequencies" });
    }
  });

  // AI prediction routes
  app.post("/api/ai/predict", async (req, res) => {
    try {
      const { lotteryId, count, preferences } = req.body;
      
      if (!lotteryId || !count || count <= 0) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      const prediction = await aiService.generatePrediction(
        parseInt(lotteryId),
        parseInt(count),
        preferences || { useHot: true, useCold: false, useMixed: true }
      );

      res.json({ numbers: prediction });
    } catch (error) {
      console.error("Error generating prediction:", error);
      res.status(500).json({ message: "Failed to generate prediction" });
    }
  });

  app.get("/api/ai/status", async (req, res) => {
    try {
      const status = await aiService.getLearningStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching AI status:", error);
      res.status(500).json({ message: "Failed to fetch AI status" });
    }
  });

  // User game routes - simplified without authentication
  app.post("/api/games", async (req: any, res) => {
    try {
      const userId = 'demo-user';
      const gameData = insertUserGameSchema.parse({
        ...req.body,
        userId,
      });

      const game = await storage.createUserGame(gameData);
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid game data", errors: error.errors });
      }
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.get("/api/games", async (req: any, res) => {
    try {
      const userId = 'demo-user';
      const lotteryId = req.query.lotteryId ? parseInt(req.query.lotteryId as string) : undefined;
      
      const games = await storage.getUserGames(userId, lotteryId);
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/results", async (req: any, res) => {
    try {
      const userId = 'demo-user';
      const results = await storage.getUserGameResults(userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching game results:", error);
      res.status(500).json({ message: "Failed to fetch game results" });
    }
  });

  // User statistics
  app.get("/api/users/stats", async (req: any, res) => {
    try {
      const userId = 'demo-user';
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
