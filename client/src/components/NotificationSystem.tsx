
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Bell, Trophy, Gift, Clock, DollarSign, BarChart3, Users, Award, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [winnerStats, setWinnerStats] = useState<WinnerStats | null>(null);
  const [showStats, setShowStats] = useState(false);

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
            // Atualizar estatísticas localmente
            if (notification.data?.stats) {
              setWinnerStats(notification.data.stats);
            }
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
    <div className="fixed top-4 right-4 z-50">
      <div className="flex flex-col gap-2 pointer-events-auto">
        {/* Status da conexão */}
        {socket ? (
          <div 
            className="flex items-center gap-2 bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-green-500/30 cursor-pointer hover:bg-green-600/30 transition-colors"
            onClick={() => setShowStats(!showStats)}
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Notificações Ativas
            {winnerStats && (
              <span className="bg-green-500/20 px-2 py-0.5 rounded-full">
                {winnerStats.totalWinners} ganhadores
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-orange-600/20 text-orange-400 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-orange-500/30">
            <Clock className="w-3 h-3" />
            Reconectando...
          </div>
        )}

        {/* Estatísticas detalhadas */}
        {showStats && winnerStats && (
          <Card className="w-80 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md border-cyan-500/30 pointer-events-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Estatísticas de Ganhadores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Estatísticas gerais */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 p-3 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-yellow-200">Total</span>
                  </div>
                  <div className="text-lg font-bold text-white">{winnerStats.totalWinners}</div>
                  <div className="text-xs text-yellow-300">{winnerStats.totalPrizes}</div>
                </div>

                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-3 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-200">Hoje</span>
                  </div>
                  <div className="text-lg font-bold text-white">{winnerStats.todayWinners}</div>
                  <div className="text-xs text-green-300">ganhadores</div>
                </div>

                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-3 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-blue-200">Maior</span>
                  </div>
                  <div className="text-sm font-bold text-white">{winnerStats.biggestPrize}</div>
                </div>

                <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-3 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-200">Média</span>
                  </div>
                  <div className="text-sm font-bold text-white">{winnerStats.averagePrize}</div>
                </div>
              </div>

              {/* Estatísticas por loteria */}
              {Object.keys(winnerStats.lotteryStats).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Por Loteria:</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Object.entries(winnerStats.lotteryStats).map(([lottery, stats]) => (
                      <div key={lottery} className="bg-slate-800/50 p-2 rounded border border-slate-600/30">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white font-medium">{lottery}</span>
                          <span className="text-xs text-cyan-400">{stats.winners} ganhadores</span>
                        </div>
                        <div className="text-xs text-green-400">{stats.totalPrize}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
