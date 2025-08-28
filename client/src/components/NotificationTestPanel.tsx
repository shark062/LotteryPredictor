import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Trophy, Gift, Clock, DollarSign, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationTestPanelProps {
  className?: string;
}

export default function NotificationTestPanel({ className }: NotificationTestPanelProps) {
  const { toast } = useToast();

  const testNotification = async (type: string) => {
    try {
      const response = await fetch(`/api/notifications/test/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lottery: 'Mega-Sena',
          prize: 'R$ 150.000,00'
        })
      });

      if (response.ok) {
        toast({
          title: "✅ Teste Enviado",
          description: `Notificação de ${type} enviada com sucesso!`,
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao enviar notificação de teste",
        duration: 3000,
        variant: "destructive"
      });
    }
  };

  const getNotificationStatus = async () => {
    try {
      const response = await fetch('/api/notifications/status');
      const status = await response.json();
      
      toast({
        title: "📊 Status das Notificações",
        description: `${status.connectedUsers} usuários conectados, ${status.activeTimers} timers ativos`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao obter status das notificações",
        duration: 3000,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-blue-500/30 ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-400" />
          Teste de Notificações
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Teste o sistema de notificações em tempo real
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => testNotification('winner')}
            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white border-0"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Ganhador
          </Button>
          
          <Button
            onClick={() => testNotification('draw')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0"
          >
            <Clock className="w-4 h-4 mr-2" />
            Sorteio
          </Button>
          
          <Button
            onClick={() => testNotification('prize')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Prêmio
          </Button>
          
          <Button
            onClick={getNotificationStatus}
            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border-0"
          >
            <Users className="w-4 h-4 mr-2" />
            Status
          </Button>
        </div>
        
        <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded">
          <p className="mb-1">🎯 <strong>Ganhador:</strong> Confetti dourado + notificação de celebração</p>
          <p className="mb-1">⏰ <strong>Sorteio:</strong> Confetti azul + alerta de início</p>
          <p className="mb-1">💰 <strong>Prêmio:</strong> Notificação de atualização de valor</p>
          <p>📊 <strong>Status:</strong> Informações do sistema de notificações</p>
        </div>
      </CardContent>
    </Card>
  );
}