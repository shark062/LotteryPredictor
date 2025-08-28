import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Bell, Trophy, Gift, Clock, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NotificationSystemProps {
  userId?: string;
}

interface Notification {
  id: string;
  type: 'winner' | 'draw_starting' | 'prize_update' | 'system';
  title: string;
  message: string;
  lottery?: string;
  prize?: string;
  timestamp: Date;
  data?: any;
}

export default function NotificationSystem({ userId }: NotificationSystemProps) {
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Função para disparar celebração de vitória
  const triggerWinnerCelebration = (notification: Notification) => {
    // Confetti dourado para ganhadores
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#FFD700', '#FFA500', '#FF6347', '#00FF00', '#1E90FF'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Explosão central
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors
      });
    }, 500);

    // Toast de celebração - personalizado baseado se é pessoal ou público
    const isPersonalWin = notification.data?.isPersonal;
    const toastTitle = isPersonalWin 
      ? "🎉 PARABÉNS! VOCÊ GANHOU! 🎉" 
      : "🎉 TEMOS UM GANHADOR! 🎉";
    
    toast({
      title: toastTitle,
      description: `${notification.message}`,
      duration: isPersonalWin ? 15000 : 8000, // Mais tempo para vitória pessoal
      className: isPersonalWin 
        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400"
        : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-400",
    });

    // Som de celebração (se disponível)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAjmV2/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceAj');
      audio.play().catch(() => {
        // Silenciosamente ignora se não conseguir tocar o som
      });
    } catch (e) {
      // Ignora erros de áudio
    }
  };

  // Função para notificação de início de sorteio
  const triggerDrawStartingNotification = (notification: Notification) => {
    toast({
      title: "🎯 Sorteio Começando!",
      description: `${notification.lottery} - ${notification.message}`,
      duration: 8000,
      className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-400",
    });

    // Pequeno confetti azul
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
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Manter últimas 50
        
        switch (notification.type) {
          case 'winner':
            triggerWinnerCelebration(notification);
            break;
            
          case 'draw_starting':
            triggerDrawStartingNotification(notification);
            break;
            
          case 'prize_update':
            toast({
              title: "💰 Prêmio Atualizado!",
              description: `${notification.lottery} - Novo prêmio: ${notification.prize}`,
              duration: 5000,
              className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-400",
            });
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
        // Recurisvo para tentar reconectar
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

  // Simular algumas notificações para teste (apenas em desenvolvimento)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const testNotifications = () => {
        setTimeout(() => {
          triggerDrawStartingNotification({
            id: 'test-1',
            type: 'draw_starting',
            title: 'Sorteio Começando',
            message: 'O sorteio está prestes a começar em 5 minutos!',
            lottery: 'Mega-Sena',
            timestamp: new Date()
          });
        }, 3000);

        setTimeout(() => {
          triggerWinnerCelebration({
            id: 'test-2',
            type: 'winner',
            title: 'Ganhador!',
            message: 'João Silva ganhou R$ 50.000,00 na Quina!',
            lottery: 'Quina',
            prize: 'R$ 50.000,00',
            timestamp: new Date()
          });
        }, 8000);
      };

      // Descomente a linha abaixo para testar as notificações
      // testNotifications();
    }
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      {socket ? (
        <div className="flex items-center gap-2 bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-green-500/30">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Notificações Ativas
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-orange-600/20 text-orange-400 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-orange-500/30">
          <Clock className="w-3 h-3" />
          Reconectando...
        </div>
      )}
    </div>
  );
}