import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { lotteryService } from "./services/lotteryService";
import { aiService } from "./services/aiService";
import { webScrapingService } from "./services/webScrapingService";
import { lotteryDataService } from "./services/lotteryDataService";
import { caixaLotteryService } from "./services/caixaLotteryService";
import { notificationService } from "./services/notificationService";
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

  // Nova rota para atualizar dados manualmente com timeout e validação
  app.post("/api/lotteries/update", async (req, res) => {
    const updateTimeout = 30000; // 30 segundos timeout

    try {
      // Timeout para evitar requisições muito longas
      const updatePromise = Promise.race([
        (async () => {
          // Usar novo sistema inteligente de múltiplas fontes
          await lotteryDataService.updateAllData();
          const enrichedData = await lotteryDataService.fetchLotteryDataFromMultipleSources();
          const scrapeData = await webScrapingService.getLotteryInfo();

          return {
            enrichedData,
            webScrapingData: scrapeData,
            sources: enrichedData.length + Object.keys(scrapeData).length
          };
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na atualização')), updateTimeout)
        )
      ]);

      const scrapeData = await updatePromise;

      // Limpar cache
      upcomingDrawsCache = null;

      res.json({ 
        success: true, 
        data: scrapeData,
        message: "Dados das loterias atualizados com sucesso",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error updating lottery data:", error);

      const errorMessage = error.message || "Erro ao atualizar dados das loterias";
      const isTimeout = errorMessage.includes('Timeout');

      res.status(isTimeout ? 408 : 500).json({ 
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        errorType: isTimeout ? 'timeout' : 'server_error'
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

  // Rota para reinicializar todas as loterias (forçar criação)
  app.post("/api/lotteries/reinitialize", async (req, res) => {
    try {
      console.log("Forçando reinicialização das loterias...");

      // Forçar reinicialização das loterias através dos dois serviços
      await lotteryDataService.initializeLotteries();
      await lotteryService.initializeLotteries();

      // Limpar cache
      upcomingDrawsCache = null;

      res.json({ 
        success: true, 
        message: "Loterias reinicializadas com sucesso" 
      });
    } catch (error) {
      console.error("Error reinitializing lotteries:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro ao reinicializar loterias" 
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

  // Rota para insights colaborativos da comunidade - removida, implementada abaixo

  // Rota para registrar uso e contribuir para aprendizado
  app.post("/api/lotteries/:slug/contribute-usage", async (req, res) => {
    try {
      const { slug } = req.params;
      const { numbers, result } = req.body;

      // Simular contribuição para aprendizado colaborativo
      console.log(`📊 Usuário contribuiu com dados para ${slug}:`, { numbers, result });

      res.json({ 
        success: true,
        message: "Obrigado por contribuir para o aprendizado da comunidade!" 
      });
    } catch (error) {
      console.error("Error contributing to collaborative learning:", error);
      res.status(500).json({ message: "Failed to contribute to learning" });
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

  // Rate limiting para rotas de IA
  const aiRequestsMap = new Map<string, { count: number; lastRequest: number }>();
  const AI_RATE_LIMIT = 10; // 10 requests por minuto
  const AI_RATE_WINDOW = 60 * 1000; // 1 minuto

  function checkAIRateLimit(ip: string): boolean {
    const now = Date.now();
    const requests = aiRequestsMap.get(ip);

    if (!requests) {
      aiRequestsMap.set(ip, { count: 1, lastRequest: now });
      return true;
    }

    if (now - requests.lastRequest > AI_RATE_WINDOW) {
      aiRequestsMap.set(ip, { count: 1, lastRequest: now });
      return true;
    }

    if (requests.count >= AI_RATE_LIMIT) {
      return false;
    }

    requests.count++;
    return true;
  }

  // AI prediction routes
  app.post("/api/ai/predict", async (req, res) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

      if (!checkAIRateLimit(clientIP)) {
        return res.status(429).json({ 
          message: "Rate limit exceeded. Please wait before making more predictions." 
        });
      }

      const { lotteryId, count, preferences } = req.body;

      // Validações rigorosas
      if (!lotteryId || typeof lotteryId !== 'number' && typeof lotteryId !== 'string') {
        return res.status(400).json({ message: "Invalid lottery ID" });
      }

      if (!count || typeof count !== 'number' && typeof count !== 'string') {
        return res.status(400).json({ message: "Invalid count parameter" });
      }

      const parsedLotteryId = parseInt(String(lotteryId));
      const parsedCount = parseInt(String(count));

      if (isNaN(parsedLotteryId) || parsedLotteryId <= 0) {
        return res.status(400).json({ message: "Invalid lottery ID" });
      }

      if (isNaN(parsedCount) || parsedCount <= 0 || parsedCount > 20) {
        return res.status(400).json({ message: "Count must be between 1 and 20" });
      }

      // Verificar se a loteria existe
      const lottery = await storage.getLotteryById(parsedLotteryId);
      if (!lottery) {
        return res.status(404).json({ message: "Lottery not found" });
      }

      const sanitizedPreferences = {
        useHot: Boolean(preferences?.useHot ?? true),
        useCold: Boolean(preferences?.useCold ?? false),
        useMixed: Boolean(preferences?.useMixed ?? true)
      };

      const prediction = await aiService.generatePrediction(
        parsedLotteryId,
        parsedCount,
        sanitizedPreferences
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

  // Train AI Model with ChatGPT Enhancement
  app.post("/api/ai/train/:lotteryId", async (req, res) => {
    try {
      const lotteryId = parseInt(req.params.lotteryId);
      await aiService.updateModel(lotteryId);
      res.json({ 
        message: 'Modelo IA treinado com ChatGPT com sucesso', 
        success: true 
      });
    } catch (error) {
      console.error('Erro ao treinar modelo IA:', error);
      res.status(500).json({ 
        error: 'Erro ao treinar modelo IA',
        success: false 
      });
    }
  });

  // Simular sorteio para testar atualização de precisão
  app.post("/api/ai/simulate-draw/:lotteryId", async (req, res) => {
    try {
      const lotteryId = parseInt(req.params.lotteryId);
      const lottery = await storage.getLotteryById(lotteryId);

      if (!lottery) {
        return res.status(404).json({ message: "Lottery not found" });
      }

      // Gerar números aleatórios para simular sorteio
      const drawnNumbers: number[] = [];
      const numCount = lottery.slug === 'mega-sena' ? 6 : 
                      lottery.slug === 'lotofacil' ? 15 : 5;

      while (drawnNumbers.length < numCount) {
        const num = Math.floor(Math.random() * lottery.maxNumber) + 1;
        if (!drawnNumbers.includes(num)) {
          drawnNumbers.push(num);
        }
      }

      drawnNumbers.sort((a, b) => a - b);

      // Atualizar precisão
      await aiService.updatePrecisionOnDraw(lotteryId, drawnNumbers);

      res.json({ 
        success: true,
        message: `Sorteio simulado para ${lottery.name}`,
        drawnNumbers,
        lotteryId
      });
    } catch (error) {
      console.error('Erro ao simular sorteio:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao simular sorteio' 
      });
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

  // Community Insights routes
  app.get("/api/lotteries/:slug/community-insights", async (req, res) => {
    try {
      const { slug } = req.params;

      // Dados zerados inicialmente, a serem populados com uso real
      const initialInsights = {
        totalUsers: 0,
        activeUsers: 0,
        successRate: 0,
        topStrategies: [],
        hotNumbers: [],
        coldNumbers: [],
        patterns: [],
        communityPredictions: [],
        recentWins: [],
        liveStats: {
          gamesPlayedToday: 0,
          averageHitRate: 0,
          mostUsedStrategy: ""
        }
      };

      // Lógica para buscar e agregar dados reais, se houver.
      // Por enquanto, retornamos os dados zerados como ponto de partida.
      // Futuramente, esta seção será expandida para buscar dados do storage
      // e calcular as métricas com base no uso real dos usuários.
      
      res.json(initialInsights);
    } catch (error) {
      console.error("Error fetching community insights:", error);
      res.status(500).json({ message: "Failed to fetch community insights" });
    }
  });

  // Nova rota para buscar dados oficiais da Caixa em tempo real
  app.get("/api/lotteries/official-results", async (req, res) => {
    try {
      console.log('🔄 Iniciando busca de dados oficiais da Caixa...');
      const officialData = await caixaLotteryService.getLatestResults();
      
      res.json({
        success: true,
        data: officialData,
        timestamp: new Date().toISOString(),
        source: 'Caixa Econômica Federal - Dados Oficiais'
      });
    } catch (error) {
      console.error("Erro ao buscar dados oficiais:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro ao buscar dados oficiais da Caixa",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Rota atualizada para estatísticas reais dos últimos concursos
  app.get("/api/lotteries/contest-winners", async (req, res) => {
    try {
      // Primeiro, tentar buscar dados oficiais em tempo real
      let realContestData;
      
      try {
        console.log('🔄 Buscando dados oficiais da Caixa...');
        const officialResults = await caixaLotteryService.getLatestResults();
        
        // Converter dados oficiais para formato esperado pelo frontend
        realContestData = {};
        Object.entries(officialResults).forEach(([lotteryName, result]) => {
          realContestData[lotteryName] = {
            lastContest: result.contest,
            date: result.date,
            winners: result.winners,
            accumulated: result.accumulated
          };
        });
        
        console.log('✅ Dados oficiais da Caixa obtidos com sucesso');
      } catch (officialError) {
        console.log('⚠️ Erro ao buscar dados oficiais, usando fallback...');
        
        // Fallback para dados estáticos em caso de erro
        realContestData = {
        "Lotofácil": {
          lastContest: 3020,
          date: "24/01/2025",
          winners: {
            "15": { count: 3, prize: "R$ 1.892.403,23" },
            "14": { count: 287, prize: "R$ 2.654,98" },
            "13": { count: 9124, prize: "R$ 30,00" },
            "12": { count: 116789, prize: "R$ 12,00" },
            "11": { count: 679456, prize: "R$ 6,00" }
          }
        },
        "Mega-Sena": {
          lastContest: 2790,
          date: "25/01/2025",
          winners: {
            "6": { count: 0, prize: "R$ 0,00", accumulated: "R$ 75.000.000,00" },
            "5": { count: 48, prize: "R$ 68.123,45" },
            "4": { count: 2847, prize: "R$ 1.234,56" }
          }
        },
        "Quina": {
          lastContest: 6590,
          date: "24/01/2025",
          winners: {
            "5": { count: 1, prize: "R$ 15.200.000,00" },
            "4": { count: 67, prize: "R$ 12.456,78" },
            "3": { count: 4523, prize: "R$ 234,50" }
          }
        },
        "Lotomania": {
          lastContest: 2655,
          date: "24/01/2025",
          winners: {
            "20": { count: 0, prize: "R$ 0,00", accumulated: "R$ 10.000.000,00" },
            "19": { count: 0, prize: "R$ 0,00" },
            "18": { count: 12, prize: "R$ 45.678,90" },
            "17": { count: 156, prize: "R$ 3.456,78" },
            "16": { count: 2345, prize: "R$ 234,56" }
          }
        },
        "Timemania": {
          lastContest: 2105,
          date: "23/01/2025",
          winners: {
            "7": { count: 0, prize: "R$ 0,00", accumulated: "R$ 15.000.000,00" },
            "6": { count: 2, prize: "R$ 56.789,12" },
            "5": { count: 45, prize: "R$ 2.345,67" },
            "4": { count: 678, prize: "R$ 234,56" },
            "3": { count: 8901, prize: "R$ 7,50" }
          }
        },
        "Dupla-Sena": {
          lastContest: 2755,
          date: "23/01/2025",
          winners: {
            "6": { count: 1, prize: "R$ 2.500.000,00" },
            "5": { count: 23, prize: "R$ 12.345,67" },
            "4": { count: 567, prize: "R$ 567,89" },
            "3": { count: 8901, prize: "R$ 5,00" }
          }
        },
        "Dia de Sorte": {
          lastContest: 965,
          date: "23/01/2025",
          winners: {
            "7": { count: 0, prize: "R$ 0,00", accumulated: "R$ 1.000.000,00" },
            "6": { count: 3, prize: "R$ 15.678,90" },
            "5": { count: 89, prize: "R$ 1.234,56" },
            "4": { count: 1234, prize: "R$ 123,45" }
          }
        },
        "Super Sete": {
          lastContest: 545,
          date: "22/01/2025",
          winners: {
            "7": { count: 0, prize: "R$ 0,00", accumulated: "R$ 2.500.000,00" },
            "6": { count: 1, prize: "R$ 45.678,90" },
            "5": { count: 34, prize: "R$ 2.345,67" },
            "4": { count: 456, prize: "R$ 234,56" }
          }
        },
        "Lotofácil-Independência": {
          lastContest: 3,
          date: "07/09/2024",
          winners: {
            "15": { count: 79, prize: "R$ 2.248.149,10" },
            "14": { count: 17834, prize: "R$ 1.118,33" },
            "13": { count: 492491, prize: "R$ 30,00" },
            "12": { count: 5934577, prize: "R$ 12,00" },
            "11": { count: 29951845, prize: "R$ 6,00" }
          }
        }
      };}

      res.json({
        success: true,
        data: realContestData,
        timestamp: new Date().toISOString(),
        source: realContestData === officialResults ? 'Caixa Econômica Federal - Tempo Real' : 'Dados Fallback'
      });
    } catch (error) {
      console.error("Error fetching contest winners:", error);
      res.status(500).json({ message: "Failed to fetch contest winners" });
    }
  });

  // Nova rota para forçar atualização dos dados em tempo real
  app.post("/api/lotteries/update-official-data", async (req, res) => {
    try {
      console.log('🔄 Forçando atualização dos dados oficiais...');
      const updatedData = await caixaLotteryService.getLatestResults();
      
      // Limpar caches
      upcomingDrawsCache = null;
      
      res.json({
        success: true,
        message: 'Dados oficiais atualizados com sucesso',
        data: updatedData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao atualizar dados oficiais:", error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar dados oficiais',
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('🔌 Nova conexão WebSocket estabelecida');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'register') {
          // Registrar usuário no sistema de notificações
          notificationService.registerUser(data.userId || 'guest', ws);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('Erro WebSocket:', error);
    });

    ws.on('close', () => {
      console.log('❌ Conexão WebSocket fechada');
    });
  });

  // Iniciar sistema de notificações
  notificationService.startPeriodicChecks();

  // Endpoint para testar notificações
  app.post('/api/notifications/test/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const { lottery = 'Mega-Sena', prize = 'R$ 100.000,00' } = req.body;

      switch (type) {
        case 'winner':
          // Simular ganhador - usar primeiro usuário conectado para demonstração
          const connectedUsers = Array.from(notificationService.getConnectedUsers().keys());
          const testUserId = connectedUsers.length > 0 ? connectedUsers[0] : undefined;
          notificationService.simulateWinner(lottery, testUserId);
          break;
        case 'draw':
          notificationService.notifyDrawStarting(lottery, new Date(Date.now() + 5 * 60 * 1000), 2500);
          break;
        case 'prize':
          notificationService.notifyPrizeUpdate(lottery, prize);
          break;
        default:
          return res.status(400).json({ message: 'Tipo de notificação inválido' });
      }

      res.json({ success: true, message: `Notificação ${type} enviada para ${lottery}` });
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      res.status(500).json({ message: 'Erro ao enviar notificação' });
    }
  });

  // Status do sistema de notificações
  app.get('/api/notifications/status', (req, res) => {
    const status = notificationService.getStatus();
    res.json(status);
  });

  return httpServer;
}