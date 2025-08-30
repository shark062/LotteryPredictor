
import { WebSocket } from 'ws';
import { storage } from '../storage';

interface ConnectedUser {
  userId: string;
  socket: WebSocket;
  connectedAt: Date;
}

interface NotificationData {
  id: string;
  type: 'winner' | 'draw_starting' | 'prize_update' | 'system' | 'status';
  title: string;
  message: string;
  lottery?: string;
  prize?: string;
  timestamp: Date;
  data?: any;
}

interface WinnerStats {
  totalWinners: number;
  totalPrizes: string;
  todayWinners: number;
  weeklyWinners: number;
  monthlyWinners: number;
  averagePrize: string;
  biggestPrize: string;
  lotteryStats: { [key: string]: { winners: number; totalPrize: string } };
}

export class NotificationService {
  private static instance: NotificationService;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private drawTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastKnownPrizes: Map<string, string> = new Map();
  private winnerStats: WinnerStats = {
    totalWinners: 0,
    totalPrizes: 'R$ 0,00',
    todayWinners: 0,
    weeklyWinners: 0,
    monthlyWinners: 0,
    averagePrize: 'R$ 0,00',
    biggestPrize: 'R$ 0,00',
    lotteryStats: {}
  };

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Registrar usuário conectado
  registerUser(userId: string, socket: WebSocket) {
    this.connectedUsers.set(userId, {
      userId,
      socket,
      connectedAt: new Date()
    });

    console.log(`👤 Usuário ${userId} conectado às notificações (${this.connectedUsers.size} usuários online)`);

    // Enviar estatísticas atuais para o novo usuário
    this.sendWinnerStatsToUser(userId);

    // Configurar cleanup quando desconectar
    socket.on('close', () => {
      this.connectedUsers.delete(userId);
      console.log(`👋 Usuário ${userId} desconectado (${this.connectedUsers.size} usuários online)`);
    });
  }

  // Enviar notificação para usuário específico
  sendNotificationToUser(userId: string, notification: NotificationData) {
    const user = this.connectedUsers.get(userId);
    if (user && user.socket.readyState === WebSocket.OPEN) {
      try {
        user.socket.send(JSON.stringify(notification));
      } catch (error) {
        console.error(`Erro ao enviar notificação para ${userId}:`, error);
        this.connectedUsers.delete(userId);
      }
    }
  }

  // Broadcast para todos os usuários conectados
  broadcast(notification: NotificationData) {
    console.log(`📢 Broadcasting: ${notification.title} - ${notification.message}`);
    
    this.connectedUsers.forEach((user, userId) => {
      if (user.socket.readyState === WebSocket.OPEN) {
        try {
          user.socket.send(JSON.stringify(notification));
        } catch (error) {
          console.error(`Erro ao enviar broadcast para ${userId}:`, error);
          this.connectedUsers.delete(userId);
        }
      } else {
        this.connectedUsers.delete(userId);
      }
    });
  }

  // Detectar e notificar ganhadores reais
  async checkForRealWinners() {
    try {
      const lotteries = await storage.getAllLotteries();
      
      for (const lottery of lotteries) {
        const latestResults = await storage.getLatestResults(lottery.id, 5);
        
        if (latestResults && latestResults.length > 0) {
          const latestResult = latestResults[0];
          
          // Verificar se há ganhadores reais neste resultado
          if (latestResult.winners && latestResult.winners.length > 0) {
            for (const winner of latestResult.winners) {
              if (winner.winners > 0 && winner.prize) {
                // Atualizar estatísticas
                this.updateWinnerStats(lottery.name, winner.winners, winner.prize);
                
                // Notificar sobre ganhador real
                this.notifyRealWinner(
                  lottery.name,
                  winner.winners,
                  winner.prize,
                  latestResult.contestNumber,
                  winner.category
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar ganhadores reais:', error);
    }
  }

  // Notificar sobre ganhador real - preservando privacidade
  notifyRealWinner(lottery: string, winnerCount: number, prize: string, contestNumber?: number, category?: string) {
    const message = winnerCount === 1 
      ? `1 pessoa ganhou ${prize} na ${lottery}!`
      : `${winnerCount} pessoas ganharam ${prize} cada na ${lottery}!`;

    const notification: NotificationData = {
      id: `real-winner-${Date.now()}`,
      type: 'winner',
      title: '🎉 GANHADOR CONFIRMADO! 🎉',
      message,
      lottery,
      prize,
      timestamp: new Date(),
      data: { 
        contestNumber, 
        category,
        winnerCount,
        isReal: true
      }
    };

    this.broadcast(notification);
    
    console.log(`🏆 GANHADOR REAL DETECTADO: ${winnerCount} ganhador(es) - ${prize} na ${lottery} (Concurso ${contestNumber})`);
  }

  // Atualizar estatísticas de ganhadores
  updateWinnerStats(lottery: string, winnerCount: number, prize: string) {
    // Converter prize string para número para cálculos
    const prizeValue = this.parsePrizeValue(prize);
    
    this.winnerStats.totalWinners += winnerCount;
    this.winnerStats.todayWinners += winnerCount;
    
    // Atualizar stats por loteria
    if (!this.winnerStats.lotteryStats[lottery]) {
      this.winnerStats.lotteryStats[lottery] = { winners: 0, totalPrize: 'R$ 0,00' };
    }
    
    this.winnerStats.lotteryStats[lottery].winners += winnerCount;
    const currentLotteryPrize = this.parsePrizeValue(this.winnerStats.lotteryStats[lottery].totalPrize);
    this.winnerStats.lotteryStats[lottery].totalPrize = this.formatPrizeValue(currentLotteryPrize + (prizeValue * winnerCount));
    
    // Atualizar maior prêmio
    if (prizeValue > this.parsePrizeValue(this.winnerStats.biggestPrize)) {
      this.winnerStats.biggestPrize = prize;
    }
    
    // Recalcular totais
    const totalPrizeValue = this.parsePrizeValue(this.winnerStats.totalPrizes) + (prizeValue * winnerCount);
    this.winnerStats.totalPrizes = this.formatPrizeValue(totalPrizeValue);
    
    if (this.winnerStats.totalWinners > 0) {
      this.winnerStats.averagePrize = this.formatPrizeValue(totalPrizeValue / this.winnerStats.totalWinners);
    }
    
    // Broadcast das estatísticas atualizadas
    this.broadcastWinnerStats();
  }

  // Converter string de prêmio para número
  private parsePrizeValue(prizeStr: string): number {
    return parseFloat(prizeStr.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
  }

  // Formatar número para string de prêmio
  private formatPrizeValue(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // Detectar mudanças de prêmio
  async checkPrizeUpdates() {
    try {
      const lotteries = await storage.getAllLotteries();
      
      for (const lottery of lotteries) {
        // Aqui você pode integrar com o serviço que busca dados da Caixa
        // Por enquanto, vamos simular verificação de mudança de prêmio
        const currentPrize = await this.getCurrentPrize(lottery.name);
        const lastKnownPrize = this.lastKnownPrizes.get(lottery.name);
        
        if (currentPrize && lastKnownPrize && currentPrize !== lastKnownPrize) {
          this.notifyPrizeUpdate(lottery.name, currentPrize, lastKnownPrize);
        }
        
        if (currentPrize) {
          this.lastKnownPrizes.set(lottery.name, currentPrize);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações de prêmio:', error);
    }
  }

  // Obter prêmio atual (integrar com serviço real)
  private async getCurrentPrize(lotteryName: string): Promise<string | null> {
    // Integrar com o serviço que busca dados da Caixa
    // Por enquanto retorna null para não gerar notificações falsas
    return null;
  }

  // Notificar início de sorteio baseado em dados reais
  notifyDrawStarting(lottery: string, drawTime: Date, contestNumber: number) {
    const timeUntil = Math.round((drawTime.getTime() - Date.now()) / (1000 * 60)); // minutos
    
    const notification: NotificationData = {
      id: `draw-${lottery}-${contestNumber}`,
      type: 'draw_starting',
      title: '🎯 Sorteio Começando!',
      message: timeUntil > 0 
        ? `${lottery} em ${timeUntil} minutos` 
        : `${lottery} acontecendo agora!`,
      lottery,
      timestamp: new Date(),
      data: { contestNumber, drawTime, timeUntil }
    };

    this.broadcast(notification);
  }

  // Notificar atualização de prêmio
  notifyPrizeUpdate(lottery: string, newPrize: string, previousPrize?: string) {
    const notification: NotificationData = {
      id: `prize-${lottery}-${Date.now()}`,
      type: 'prize_update',
      title: '💰 Prêmio Atualizado!',
      message: previousPrize 
        ? `${lottery}: ${previousPrize} → ${newPrize}`
        : `${lottery}: Novo prêmio ${newPrize}`,
      lottery,
      prize: newPrize,
      timestamp: new Date(),
      data: { previousPrize }
    };

    this.broadcast(notification);
  }

  // Enviar estatísticas para usuário específico
  sendWinnerStatsToUser(userId: string) {
    const notification: NotificationData = {
      id: `stats-${userId}-${Date.now()}`,
      type: 'status',
      title: '📊 Estatísticas de Ganhadores',
      message: `${this.winnerStats.totalWinners} ganhadores confirmados`,
      timestamp: new Date(),
      data: { stats: this.winnerStats }
    };

    this.sendNotificationToUser(userId, notification);
  }

  // Broadcast das estatísticas atualizadas
  broadcastWinnerStats() {
    const notification: NotificationData = {
      id: `stats-broadcast-${Date.now()}`,
      type: 'status',
      title: '📊 Estatísticas Atualizadas',
      message: `${this.winnerStats.totalWinners} ganhadores confirmados`,
      timestamp: new Date(),
      data: { stats: this.winnerStats }
    };

    this.broadcast(notification);
  }

  // Programar notificações de sorteio baseadas em dados reais
  scheduleRealDrawNotifications() {
    // Integrar com dados reais de próximos sorteios
    // Por enquanto vazio, pode ser implementado quando houver integração completa
  }

  // Getter para usuários conectados
  getConnectedUsers() {
    return this.connectedUsers;
  }

  // Status do serviço com estatísticas reais
  getStatus() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeTimers: this.drawTimers.size,
      users: Array.from(this.connectedUsers.keys()),
      winnerStats: this.winnerStats,
      lastUpdate: new Date().toISOString()
    };
  }

  // Monitorar resultados para detectar ganhadores automaticamente
  async checkForNewWinners() {
    try {
      await this.checkForRealWinners();
      await this.checkPrizeUpdates();
    } catch (error) {
      console.error('Erro ao verificar novos ganhadores:', error);
    }
  }

  // Iniciar monitoramento periódico com dados reais
  startPeriodicChecks() {
    // Verificar ganhadores reais a cada 60 segundos para reduzir carga
    setInterval(() => {
      this.checkForNewWinners();
    }, 60 * 1000);

    // Reset das estatísticas diárias à meia-noite
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.winnerStats.todayWinners = 0;
      }
    }, 60 * 1000); // Verificar a cada minuto

    // Status log a cada 10 minutos
    setInterval(() => {
      const status = this.getStatus();
      console.log(`📊 Notificações: ${status.connectedUsers} usuários, ${status.winnerStats.totalWinners} ganhadores detectados`);
    }, 10 * 60 * 1000);

    console.log('🔔 Sistema de notificações iniciado com monitoramento de dados reais');
  }

  // Resetar estatísticas (para manutenção)
  resetStats() {
    this.winnerStats = {
      totalWinners: 0,
      totalPrizes: 'R$ 0,00',
      todayWinners: 0,
      weeklyWinners: 0,
      monthlyWinners: 0,
      averagePrize: 'R$ 0,00',
      biggestPrize: 'R$ 0,00',
      lotteryStats: {}
    };
    
    this.broadcastWinnerStats();
  }
}

export const notificationService = NotificationService.getInstance();
