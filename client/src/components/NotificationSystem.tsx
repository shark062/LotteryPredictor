import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface NotificationSystemProps {
  userId?: string;
}

interface Notification {
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

// Mock user interface for the sake of the example
interface User {
  id: string;
}

// Mock user state
const user: User | null = { id: 'mockUserId' }; // Replace with actual user state management

// Mock handleNotification function
const handleNotification = (notification: Notification) => {
  console.log('Handling notification:', notification);
  // Placeholder for actual notification handling logic
};

export default function NotificationSystem({ userId }: NotificationSystemProps) {
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Função para disparar celebração de vitória real
  const triggerRealWinnerCelebration = (notification: Notification) => {
    const isReal = notification.data?.isReal;
    const winnerCount = notification.data?.winnerCount || 1;

    // Confetti mais intenso para ganhadores reais
    const duration = isReal ? 5000 : 3000;
    const end = Date.now() + duration;

    const colors = isReal
      ? ['#FFD700', '#FFA500', '#FF6347', '#00FF00', '#1E90FF']
      : ['#FFD700', '#FFA500'];

    (function frame() {
      confetti({
        particleCount: isReal ? 5 : 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: isReal ? 5 : 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Explosão central mais intensa para ganhadores reais
    setTimeout(() => {
      confetti({
        particleCount: isReal ? 150 : 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors
      });
    }, 500);

    // Toast de celebração
    toast({
      title: isReal ? "🎉 GANHADOR CONFIRMADO! 🎉" : "🎉 POSSÍVEL GANHADOR! 🎉",
      description: `${notification.message}`,
      duration: isReal ? 20000 : 10000,
      className: isReal
        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400"
        : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-400",
    });

    // Som de celebração mais longo para ganhadores reais
    if (isReal) {
      try {
        // Múltiplos sons para celebração mais intensa
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAj');
            audio.play().catch(() => {});
          }, i * 500);
        }
      } catch (e) { }
    }
  };

  // Função para notificação de início de sorteio
  const triggerDrawStartingNotification = (notification: Notification) => {
    toast({
      title: "🎯 Sorteio Começando!",
      description: `${notification.message}`,
      duration: 8000,
      className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-400",
    });

    // Confetti azul
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#3B82F6', '#8B5CF6', '#06B6D4']
    });
  };

  // Conectar ao WebSocket com tratamento de erros e reconexão otimizado
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3; // Reduzido para 3 tentativas
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isComponentMounted = true;

    const connect = () => {
      // Não tentar conectar se o componente foi desmontado
      if (!isComponentMounted || reconnectAttempts >= maxReconnectAttempts) {
        return;
      }

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('🔌 Conectado ao sistema de notificações em tempo real');
          reconnectAttempts = 0;

          // Registrar usuário
          if (ws && isComponentMounted) {
            ws.send(JSON.stringify({
              type: 'register',
              userId: user?.id || 'guest'
            }));
          }
        };

        ws.onmessage = (event) => {
          if (!isComponentMounted) return;
          
          try {
            const notification: Notification = JSON.parse(event.data);
            setNotifications(prev => [notification, ...prev.slice(0, 49)]);

            switch (notification.type) {
              case 'winner':
                triggerRealWinnerCelebration(notification);
                break;

              case 'draw_starting':
                triggerDrawStartingNotification(notification);
                break;

              case 'prize_update':
                toast({
                  title: "💰 Prêmio Atualizado!",
                  description: `${notification.message}`,
                  duration: 8000,
                  className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-400",
                });
                break;

              case 'status':
                // Estatísticas recebidas mas não exibidas na UI
                break;

              case 'system':
                toast({
                  title: notification.title,
                  description: notification.message,
                  duration: 5000,
                  className: "bg-gradient-to-r from-slate-700 to-slate-600 text-white border-slate-500",
                });
                break;
            }
          } catch (error) {
            console.error('Erro ao processar notificação:', error);
          }
        };

        ws.onclose = (event) => {
          if (!isComponentMounted) return;
          
          console.log('❌ Desconectado do sistema de notificações');

          // Só tentar reconectar se não foi fechamento intencional e ainda há tentativas disponíveis
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts && isComponentMounted) {
            reconnectAttempts++;
            // Aumenta o tempo de espera progressivamente
            const delay = Math.min(5000 + (reconnectAttempts * 5000), 30000); // 5s, 10s, 15s, max 30s

            reconnectTimeout = setTimeout(() => {
              if (isComponentMounted) {
                console.log(`🔄 Tentativa de reconexão ${reconnectAttempts}/${maxReconnectAttempts}...`);
                connect();
              }
            }, delay);
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            console.log('⚠️ Máximo de tentativas de reconexão atingido. Notificações em tempo real desabilitadas.');
          }
        };

        ws.onerror = (error) => {
          if (!isComponentMounted) return;
          
          console.error('Erro WebSocket:', error);
          // Só incrementar tentativas se não excedermos o limite
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(5000 + (reconnectAttempts * 5000), 30000);
            reconnectTimeout = setTimeout(() => {
              if (isComponentMounted) {
                console.log(`🔄 Tentativa de reconexão após erro ${reconnectAttempts}/${maxReconnectAttempts}...`);
                connect();
              }
            }, delay);
          }
        };

      } catch (error) {
        console.error('Erro ao conectar WebSocket:', error);

        // Tentar reconectar em caso de erro na criação da instância WebSocket
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connect, 5000); // Tenta reconectar após 5 segundos
        }
      }
    };

    connect();

    return () => {
      isComponentMounted = false;
      // Limpa o timeout de reconexão se ele existir
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      // Fecha a conexão WebSocket se ela estiver aberta
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close(1000, 'Component unmounting'); // Código 1000 indica fechamento normal
      }
    };
  }, [user]); // Depende do estado do usuário para re-conectar se o usuário mudar

  return (
    <div className="fixed top-4 right-4 z-50 hidden">
      {/* Sistema de notificações oculto - funciona em background */}
    </div>
  );
}