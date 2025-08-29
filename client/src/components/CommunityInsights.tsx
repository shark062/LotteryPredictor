
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Users, TrendingUp, Star, Clock, Zap, Target, Award, Activity, Flame, Snowflake } from 'lucide-react';

interface CommunityInsightsProps {
  lotterySlug: string;
}

interface InsightData {
  totalUsers: number;
  activeUsers: number;
  successRate: number;
  topStrategies: Array<{
    name: string;
    successRate: number;
    usageCount: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  hotNumbers: number[];
  coldNumbers: number[];
  patterns: Array<{
    pattern: string;
    confidence: number;
    frequency: number;
  }>;
  communityPredictions: Array<{
    numbers: number[];
    confidence: number;
    votes: number;
  }>;
  recentWins: Array<{
    user: string;
    numbers: number[];
    prize: string;
    date: string;
  }>;
  liveStats: {
    gamesPlayedToday: number;
    averageHitRate: number;
    mostUsedStrategy: string;
  };
}

export default function CommunityInsights({ lotterySlug }: CommunityInsightsProps) {
  const [animatedValues, setAnimatedValues] = useState({
    totalUsers: 0,
    activeUsers: 0,
    successRate: 0
  });

  const { data: insights, isLoading } = useQuery<InsightData>({
    queryKey: [`/api/lotteries/${lotterySlug}/community-insights`],
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 2,
  });

  const getLotteryDisplayName = (slug: string) => {
    const names: { [key: string]: string } = {
      'mega-sena': 'Mega-Sena',
      'lotofacil': 'Lotofácil', 
      'quina': 'Quina',
      'lotomania': 'Lotomania',
      'timemania': 'Timemania',
      'dupla-sena': 'Dupla-Sena',
      'dia-de-sorte': 'Dia de Sorte',
      'super-sete': 'Super Sete',
      'lotofacil-independencia': 'Lotofácil-Independência'
    };
    return names[slug] || slug;
  };

  const getLotteryIcon = (slug: string) => {
    const icons: { [key: string]: string } = {
      'mega-sena': '💰',
      'lotofacil': '🍀',
      'quina': '⭐',
      'lotomania': '🎯',
      'timemania': '⚽',
      'dupla-sena': '🎲',
      'dia-de-sorte': '🌟',
      'super-sete': '🔥',
      'lotofacil-independencia': '🇧🇷'
    };
    return icons[slug] || '🎰';
  };

  // Animação dos valores
  useEffect(() => {
    if (insights) {
      const duration = 1500;
      const steps = 60;
      const interval = duration / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        const easeOut = 1 - Math.pow(1 - progress, 3);

        setAnimatedValues({
          totalUsers: Math.floor(insights.totalUsers * easeOut),
          activeUsers: Math.floor(insights.activeUsers * easeOut),
          successRate: Math.floor(insights.successRate * easeOut)
        });

        if (step >= steps) {
          clearInterval(timer);
          setAnimatedValues({
            totalUsers: insights.totalUsers,
            activeUsers: insights.activeUsers,
            successRate: insights.successRate
          });
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [insights]);

  if (isLoading) {
    return (
      <Card className="bg-card/20 border-border/50 backdrop-blur-md h-96" data-testid="community-insights-loading">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">Analisando inteligência colaborativa...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="bg-card/20 border-border/50 backdrop-blur-md" data-testid="community-insights-empty">
        <CardContent className="p-6 text-center">
          <Brain className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Coletando dados da comunidade...</p>
        </CardContent>
      </Card>
    );
  }

  // Verificar se não há dados ainda
  if (insights.totalUsers === 0) {
    return (
      <Card className="bg-card/20 border-border/50 backdrop-blur-md" data-testid={`community-insights-${lotterySlug}-empty`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <span className="text-2xl">{getLotteryIcon(lotterySlug)}</span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {getLotteryDisplayName(lotterySlug)}
            </span>
            <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
              <Clock className="w-3 h-3 mr-1" />
              AGUARDANDO
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              Primeira vez aqui?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Seja o primeiro a usar nossa IA para {getLotteryDisplayName(lotterySlug)}!
            </p>
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/20">
              <p className="text-xs text-cyan-300">
                💡 Os dados da comunidade aparecerão aqui conforme os usuários utilizarem o aplicativo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/20 border-border/50 backdrop-blur-md hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500" data-testid={`community-insights-${lotterySlug}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3 text-xl">
          <span className="text-2xl animate-pulse">{getLotteryIcon(lotterySlug)}</span>
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {getLotteryDisplayName(lotterySlug)}
          </span>
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white animate-pulse">
            <Activity className="w-3 h-3 mr-1" />
            ATIVO
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Métricas principais animadas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20 hover:scale-105 transition-transform" data-testid="total-users-stat">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2 animate-bounce" />
            <div className="text-2xl font-bold text-blue-400 mb-1 tabular-nums">
              {animatedValues.totalUsers.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Usuários Total</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg border border-emerald-500/20 hover:scale-105 transition-transform" data-testid="active-users-stat">
            <Zap className="w-6 h-6 text-emerald-400 mx-auto mb-2 animate-pulse" />
            <div className="text-2xl font-bold text-emerald-400 mb-1 tabular-nums">
              {animatedValues.activeUsers.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Ativos Agora</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20 hover:scale-105 transition-transform" data-testid="success-rate-stat">
            <Target className="w-6 h-6 text-yellow-400 mx-auto mb-2 animate-spin" />
            <div className="text-2xl font-bold text-yellow-400 mb-1 tabular-nums">
              {animatedValues.successRate}%
            </div>
            <div className="text-xs text-muted-foreground">Taxa Sucesso</div>
          </div>
        </div>

        <Tabs defaultValue="strategies" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card/40 backdrop-blur-md">
            <TabsTrigger value="strategies" className="text-xs" data-testid="tab-strategies">Estratégias</TabsTrigger>
            <TabsTrigger value="numbers" className="text-xs" data-testid="tab-numbers">Números</TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs" data-testid="tab-predictions">Previsões</TabsTrigger>
            <TabsTrigger value="wins" className="text-xs" data-testid="tab-wins">Vitórias</TabsTrigger>
          </TabsList>

          <TabsContent value="strategies" className="space-y-4 mt-4">
            <h4 className="font-semibold text-cyan-300 flex items-center">
              <Star className="w-4 h-4 mr-2 animate-pulse" />
              Top Estratégias da Comunidade
            </h4>
            <div className="space-y-3">
              {insights.topStrategies?.map((strategy, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card/30 rounded-lg border border-border/30 hover:bg-card/40 transition-all" data-testid={`strategy-${index}`}>
                  <div className="flex items-center space-x-3">
                    <Badge variant={strategy.trend === 'up' ? 'default' : 'secondary'} className="text-xs">
                      #{index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">{strategy.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {strategy.usageCount.toLocaleString()} usuários
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-emerald-400">
                      {strategy.successRate}%
                    </div>
                    <TrendingUp className={`w-4 h-4 ${
                      strategy.trend === 'up' ? 'text-emerald-400' : 
                      strategy.trend === 'down' ? 'text-red-400' : 'text-yellow-400'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="numbers" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div data-testid="hot-numbers-section">
                <h4 className="font-semibold text-red-400 mb-3 flex items-center">
                  <Flame className="w-4 h-4 mr-2 animate-pulse" />
                  Números Quentes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {insights.hotNumbers?.map((num, index) => (
                    <Badge key={index} className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:scale-110 transition-transform cursor-pointer" data-testid={`hot-number-${num}`}>
                      {num.toString().padStart(2, '0')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div data-testid="cold-numbers-section">
                <h4 className="font-semibold text-blue-400 mb-3 flex items-center">
                  <Snowflake className="w-4 h-4 mr-2 animate-pulse" />
                  Números Frios
                </h4>
                <div className="flex flex-wrap gap-2">
                  {insights.coldNumbers?.map((num, index) => (
                    <Badge key={index} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:scale-110 transition-transform cursor-pointer" data-testid={`cold-number-${num}`}>
                      {num.toString().padStart(2, '0')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div data-testid="patterns-section">
              <h4 className="font-semibold text-purple-400 mb-3 flex items-center">
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Padrões Identificados
              </h4>
              <div className="space-y-2">
                {insights.patterns?.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-card/20 rounded hover:bg-card/30 transition-all" data-testid={`pattern-${index}`}>
                    <span className="text-sm">{pattern.pattern}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={pattern.confidence} className="w-16 h-2" />
                      <span className="text-xs text-cyan-400 tabular-nums">{pattern.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4 mt-4">
            <h4 className="font-semibold text-yellow-400 flex items-center mb-3">
              <Brain className="w-4 h-4 mr-2 animate-pulse" />
              Previsões da Comunidade
            </h4>
            <div className="space-y-3">
              {insights.communityPredictions?.map((prediction, index) => (
                <div key={index} className="p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-all" data-testid={`prediction-${index}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex space-x-1">
                      {prediction.numbers?.map((num, numIndex) => (
                        <Badge key={numIndex} className="bg-yellow-500 text-black text-xs hover:scale-110 transition-transform" data-testid={`prediction-number-${num}`}>
                          {num.toString().padStart(2, '0')}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-yellow-400 font-semibold tabular-nums">{prediction.confidence}% confiança</div>
                      <div className="text-muted-foreground">{prediction.votes} votos</div>
                    </div>
                  </div>
                  <Progress value={prediction.confidence} className="h-1" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="wins" className="space-y-4 mt-4">
            <h4 className="font-semibold text-emerald-400 flex items-center mb-3">
              <Award className="w-4 h-4 mr-2 animate-bounce" />
              Vitórias Recentes
            </h4>
            <div className="space-y-3">
              {insights.recentWins?.map((win, index) => (
                <div key={index} className="p-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-all" data-testid={`win-${index}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-emerald-400 flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      {win.user}
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold">{win.prize}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {win.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {win.numbers?.map((num, numIndex) => (
                      <Badge key={numIndex} className="bg-emerald-500 text-black text-xs hover:scale-110 transition-transform" data-testid={`win-number-${num}`}>
                        {num.toString().padStart(2, '0')}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Estatísticas ao vivo */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/20" data-testid="live-stats">
          <h4 className="font-semibold text-cyan-300 mb-3 flex items-center">
            <Activity className="w-4 h-4 mr-2 animate-pulse" />
            Estatísticas ao Vivo
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-cyan-400 tabular-nums">{insights.liveStats?.gamesPlayedToday || 0}</div>
              <div className="text-xs text-muted-foreground">Jogos Hoje</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400 tabular-nums">{insights.liveStats?.averageHitRate || 0}%</div>
              <div className="text-xs text-muted-foreground">Taxa Média</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">{insights.liveStats?.mostUsedStrategy || 'IA Pura'}</div>
              <div className="text-xs text-muted-foreground">Estratégia Top</div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/30">
          <div className="text-center text-xs text-muted-foreground animate-pulse">
            💡 Dados atualizados em tempo real pela comunidade Shark Loteria
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
