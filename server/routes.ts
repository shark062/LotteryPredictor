import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { lotteryService } from "./services/lotteryService";
import { aiService } from "./services/aiService";
import { insertUserGameSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize lottery service
  await lotteryService.initializeLotteries();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
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
      const upcoming = await lotteryService.getUpcomingDraws();
      res.json(upcoming);
    } catch (error) {
      console.error("Error fetching upcoming draws:", error);
      res.status(500).json({ message: "Failed to fetch upcoming draws" });
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
  app.post("/api/ai/predict", isAuthenticated, async (req, res) => {
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

  // User game routes
  app.post("/api/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get("/api/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lotteryId = req.query.lotteryId ? parseInt(req.query.lotteryId as string) : undefined;
      
      const games = await storage.getUserGames(userId, lotteryId);
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/results", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const results = await storage.getUserGameResults(userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching game results:", error);
      res.status(500).json({ message: "Failed to fetch game results" });
    }
  });

  // User statistics
  app.get("/api/users/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
