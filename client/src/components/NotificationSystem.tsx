
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
      } catch (e) {}
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

  // Conectar ao WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('🔌 Conectado ao sistema de notificações em tempo real');
      setSocket(ws);
      
      // Registrar usuário para notificações
      ws.send(JSON.stringify({
        type: 'register',
        userId: userId || 'guest',
      }));
    };

    ws.onmessage = (event) => {
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

    ws.onclose = () => {
      console.log('❌ Desconectado do sistema de notificações');
      setSocket(null);
      
      // Tentar reconectar após 5 segundos
      setTimeout(() => {
        console.log('🔄 Tentando reconectar...');
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('Erro na conexão WebSocket:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [userId]);

  return (
    <div className="fixed top-4 right-4 z-50 hidden">
      {/* Sistema de notificações oculto - funciona em background */}
    </div>
  );
}
