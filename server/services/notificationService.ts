import { WebSocket } from 'ws';
import { storage } from '../storage';

interface ConnectedUser {
  userId: string;
  socket: WebSocket;
  connectedAt: Date;
}

interface NotificationData {
  id: string;
  type: 'winner' | 'draw_starting' | 'prize_update' | 'system';
  title: string;
  message: string;
  lottery?: string;
  prize?: string;
  timestamp: Date;
  data?: any;
}

export class NotificationService {
  private static instance: NotificationService;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private drawTimers: Map<string, NodeJS.Timeout> = new Map();

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

    // Enviar notificação de boas-vindas
    this.sendNotificationToUser(userId, {
      id: `welcome-${Date.now()}`,
      type: 'system',
      title: '🎯 Shark Loto',
      message: 'Conectado! Você receberá notificações em tempo real sobre sorteios e ganhadores.',
      timestamp: new Date()
    });

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

  // Notificar sobre ganhador
  notifyWinner(lottery: string, winner: string, prize: string, contestNumber?: number) {
    const notification: NotificationData = {
      id: `winner-${Date.now()}`,
      type: 'winner',
      title: '🎉 TEMOS UM GANHADOR! 🎉',
      message: `${winner} ganhou ${prize}!`,
      lottery,
      prize,
      timestamp: new Date(),
      data: { contestNumber }
    };

    this.broadcast(notification);
    
    // Log importante
    console.log(`🏆 GANHADOR DETECTADO: ${winner} - ${prize} na ${lottery}`);
  }

  // Notificar início de sorteio
  notifyDrawStarting(lottery: string, drawTime: Date, contestNumber: number) {
    const timeUntil = Math.round((drawTime.getTime() - Date.now()) / (1000 * 60)); // minutos
    
    const notification: NotificationData = {
      id: `draw-${lottery}-${contestNumber}`,
      type: 'draw_starting',
      title: '🎯 Sorteio Começando!',
      message: timeUntil > 0 
        ? `Sorteio em ${timeUntil} minutos` 
        : 'Sorteio acontecendo agora!',
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
        ? `Prêmio aumentou de ${previousPrize} para ${newPrize}`
        : `Novo prêmio: ${newPrize}`,
      lottery,
      prize: newPrize,
      timestamp: new Date(),
      data: { previousPrize }
    };

    this.broadcast(notification);
  }

  // Programar notificações de sorteio
  scheduleDrawNotifications(lottery: string, drawTime: Date, contestNumber: number) {
    const now = new Date();
    const timeDiff = drawTime.getTime() - now.getTime();
    const lotteryKey = `${lottery}-${contestNumber}`;

    // Limpar timer anterior se existir
    if (this.drawTimers.has(lotteryKey)) {
      clearTimeout(this.drawTimers.get(lotteryKey)!);
    }

    // Notificação 30 minutos antes
    const thirtyMinsBefore = timeDiff - (30 * 60 * 1000);
    if (thirtyMinsBefore > 0) {
      const timer30 = setTimeout(() => {
        this.notifyDrawStarting(lottery, drawTime, contestNumber);
      }, thirtyMinsBefore);
      this.drawTimers.set(`${lotteryKey}-30min`, timer30);
    }

    // Notificação 5 minutos antes
    const fiveMinsBefore = timeDiff - (5 * 60 * 1000);
    if (fiveMinsBefore > 0) {
      const timer5 = setTimeout(() => {
        this.notifyDrawStarting(lottery, drawTime, contestNumber);
      }, fiveMinsBefore);
      this.drawTimers.set(`${lotteryKey}-5min`, timer5);
    }

    // Notificação no momento do sorteio
    if (timeDiff > 0) {
      const timerNow = setTimeout(() => {
        this.notifyDrawStarting(lottery, drawTime, contestNumber);
      }, timeDiff);
      this.drawTimers.set(`${lotteryKey}-now`, timerNow);
    }
  }

  // Simular ganhadores para demonstração
  simulateWinner(lottery: string) {
    const names = [
      'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Lima',
      'Fernanda Souza', 'Rafael Pereira', 'Juliana Alves', 'Marcos Ferreira', 'Camila Rocha'
    ];
    
    const prizes = [
      'R$ 50.000,00', 'R$ 25.000,00', 'R$ 100.000,00', 'R$ 75.000,00', 
      'R$ 15.000,00', 'R$ 200.000,00', 'R$ 35.000,00', 'R$ 80.000,00'
    ];

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];

    this.notifyWinner(lottery, randomName, randomPrize);
  }

  // Status do serviço
  getStatus() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeTimers: this.drawTimers.size,
      users: Array.from(this.connectedUsers.keys())
    };
  }

  // Monitorar resultados para detectar ganhadores automaticamente
  async checkForNewWinners() {
    try {
      // Implementar lógica para verificar novos resultados e ganhadores
      // Esta função seria chamada periodicamente ou quando novos resultados são obtidos
      
      const lotteries = await storage.getAllLotteries();
      
      for (const lottery of lotteries) {
        // Verificar se há novos ganhadores nesta loteria
        // Por enquanto, simular ocasionalmente
        if (Math.random() < 0.05) { // 5% de chance
          this.simulateWinner(lottery.name);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar ganhadores:', error);
    }
  }

  // Iniciar monitoramento periódico
  startPeriodicChecks() {
    // Verificar ganhadores a cada 2 minutos
    setInterval(() => {
      this.checkForNewWinners();
    }, 2 * 60 * 1000);

    // Status log a cada 10 minutos
    setInterval(() => {
      const status = this.getStatus();
      console.log(`📊 Notificações: ${status.connectedUsers} usuários, ${status.activeTimers} timers ativos`);
    }, 10 * 60 * 1000);

    console.log('🔔 Sistema de notificações iniciado com verificações periódicas');
  }
}

export const notificationService = NotificationService.getInstance();