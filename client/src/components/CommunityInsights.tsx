
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Lightbulb, Target } from 'lucide-react';

interface CommunityInsightsProps {
  lotterySlug: string;
}

interface Strategy {
  pattern: string;
  frequency: number;
  successRate: number;
  recommendation: string;
  lastSeen: number;
}

interface InsightsData {
  totalUsers: number;
  strategies: Strategy[];
  communityTips: string[];
  lastUpdated?: string;
}

export const CommunityInsights: React.FC<CommunityInsightsProps> = ({ lotterySlug }) => {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch(`/api/lotteries/${lotterySlug}/community-insights`);
        if (response.ok) {
          const data = await response.json();
          setInsights(data);
        }
      } catch (error) {
        console.error('Erro ao buscar insights da comunidade:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchInsights, 300000);
    
    return () => clearInterval(interval);
  }, [lotterySlug]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-cyan-700/30">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-cyan-700/30 rounded w-3/4"></div>
            <div className="h-4 bg-cyan-700/30 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-cyan-700/30">
        <CardContent className="p-6">
          <p className="text-cyan-300">Insights da comunidade não disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-cyan-700/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-cyan-300 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Inteligência da Comunidade
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estatísticas da Comunidade */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{insights.totalUsers}</div>
            <div className="text-xs text-cyan-300">Usuários Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{insights.strategies.length}</div>
            <div className="text-xs text-cyan-300">Padrões Descobertos</div>
          </div>
        </div>

        {/* Estratégias Mais Eficazes */}
        {insights.strategies.length > 0 && (
          <div>
            <h4 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Estratégias Mais Eficazes
            </h4>
            <div className="space-y-3">
              {insights.strategies.slice(0, 3).map((strategy, index) => (
                <div key={index} className="bg-cyan-900/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {strategy.successRate.toFixed(1)}% eficácia
                    </Badge>
                    <span className="text-xs text-cyan-400">
                      {strategy.frequency} usuários
                    </span>
                  </div>
                  <p className="text-sm text-cyan-200">
                    {strategy.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dicas da Comunidade */}
        <div>
          <h4 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Dicas da Comunidade
          </h4>
          <div className="space-y-2">
            {insights.communityTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <Target className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-cyan-200">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        {insights.lastUpdated && (
          <div className="pt-3 border-t border-cyan-800/30">
            <p className="text-xs text-cyan-400 text-center">
              Última atualização: {insights.lastUpdated}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityInsights;
