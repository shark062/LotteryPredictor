import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import logoUrl from '../assets/cyberpunk-shark.png';
import { Button } from "@/components/ui/button";
import FuturisticHeader from "@/components/FuturisticHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LotteryCard from "@/components/LotteryCard";
import NumberGenerator from "@/components/NumberGenerator";
import HeatMap from "@/components/HeatMap";
import GameResults from "@/components/GameResults";
import AILearningStatus from "@/components/AILearningStatus";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [selectedLottery, setSelectedLottery] = useState<number>(1);

  const { data: lotteries, isLoading: lotteriesLoading, refetch: refetchLotteries } = useQuery<Array<{
    id: number;
    name: string;
    minNumbers: number;
    maxNumbers: number;
    maxNumber: number;
  }>>({
    queryKey: ["/api/lotteries"],
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: upcomingDraws, refetch: refetchUpcomingDraws } = useQuery({
    queryKey: ["/api/lotteries/upcoming"],
    staleTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: userStats, refetch: refetchUserStats } = useQuery<{
    totalGames: number;
    totalWins: number;
    totalEarnings: number;
    winRate: number;
  }>({
    queryKey: ["/api/users/stats"],
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });

  const { mutate: updateLotteryData } = useMutation({
    mutationFn: async () => {
      await fetch('/api/lotteries/update', { method: 'POST' });
    },
    onSuccess: () => {
      refetchLotteries();
      refetchUpcomingDraws();
      refetchUserStats();
    },
  });

  // Auto-refresh a cada 5 minutos
  React.useEffect(() => {
    const interval = setInterval(() => {
      updateLotteryData();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [updateLotteryData]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading || lotteriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Futuristic Header */}
      <FuturisticHeader onLogout={handleLogout} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
        <Tabs defaultValue="dashboard" className="space-y-8">
          {/* Navigation */}
          <TabsList className="grid grid-cols-6 w-full max-w-4xl mx-auto bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-1 animate-[slideInLeft_0.6s_ease-out_0.1s_both]">
            {[
              { value: 'dashboard', icon: '📊', label: 'Dashboard' },
              { value: 'generator', icon: '🎲', label: 'Gerador' },
              { value: 'analysis', icon: '🔥', label: 'Análise' },
              { value: 'heatmap', icon: '🗺️', label: 'Mapa' },
              { value: 'results', icon: '🏆', label: 'Resultados' },
              { value: 'history', icon: '📈', label: 'Meus Jogos' }
            ].map((tab, index) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="group flex items-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:border-cyan-400/50"
                data-testid={`tab-${tab.value}`}
              >
                <span className="text-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                  {tab.icon}
                </span>
                <span className="hidden sm:inline group-hover:text-cyan-300 transition-colors duration-300">
                  {tab.label}
                </span>
                {/* Indicador ativo animado */}
                <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-cyan-400 group-data-[state=active]:w-full group-data-[state=active]:left-0 transition-all duration-300 rounded-full" />
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-8 animate-[scaleIn_0.6s_ease-out_0.3s_both]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {lotteries?.map((lottery: any, index: number) => (
                <LotteryCard
                  key={lottery.id}
                  lottery={lottery}
                  upcomingDraw={upcomingDraws?.[lottery.name]}
                  onSelect={() => setSelectedLottery(lottery.id)}
                  index={index}
                />
              ))}
            </div>

            {/* User Stats */}
            {userStats && (
              <Card className="group bg-card/20 border border-border glow-effect backdrop-blur-md hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 overflow-hidden">
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <CardHeader className="relative">
                  <CardTitle className="flex items-center space-x-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">📊</span>
                    <span className="group-hover:text-cyan-300 transition-colors duration-300">Suas Estatísticas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { 
                        value: userStats.totalGames, 
                        label: 'Jogos Realizados',
                        icon: '🎲',
                        color: 'text-primary',
                        bg: 'bg-primary/10'
                      },
                      { 
                        value: userStats.totalWins, 
                        label: 'Jogos Premiados',
                        icon: '🏆',
                        color: 'text-accent',
                        bg: 'bg-accent/10'
                      },
                      { 
                        value: `${userStats.winRate.toFixed(1)}%`, 
                        label: 'Taxa de Acerto',
                        icon: '📈',
                        color: 'text-secondary',
                        bg: 'bg-secondary/10'
                      },
                      { 
                        value: `R$ ${userStats.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                        label: 'Total Ganho',
                        icon: '💰',
                        color: 'text-accent',
                        bg: 'bg-green-500/10'
                      }
                    ].map((stat, index) => (
                      <div 
                        key={stat.label}
                        className={`
                          group/stat text-center p-4 rounded-xl border border-border/30 backdrop-blur-sm
                          hover:scale-105 hover:shadow-lg transition-all duration-300
                          hover:border-cyan-400/40 cursor-pointer ${stat.bg}
                          opacity-0 animate-[fadeInUp_0.6s_ease-out_${index * 150}ms_forwards]
                        `}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className="text-2xl group-hover/stat:scale-125 group-hover/stat:rotate-12 transition-all duration-300">
                            {stat.icon}
                          </div>
                          <div className={`text-2xl font-bold transition-all duration-300 group-hover/stat:scale-110 ${stat.color}`}>
                            {stat.value}
                          </div>
                          <p className="text-sm text-muted-foreground group-hover/stat:text-cyan-200/80 transition-colors duration-300">
                            {stat.label}
                          </p>
                        </div>
                        
                        {/* Barra de progresso inferior */}
                        <div className="mt-3 w-full bg-muted/20 rounded-full h-1 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-1000 w-0 group-hover/stat:w-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Generator */}
          <TabsContent value="generator">
            <NumberGenerator 
              selectedLottery={selectedLottery} 
              onLotteryChange={setSelectedLottery}
            />
          </TabsContent>

          {/* Analysis */}
          <TabsContent value="analysis">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <span>🔥</span>
                <span>Análise de Frequência</span>
              </h2>
              {/* Analysis content will be implemented in NumberGenerator component */}
              <NumberGenerator 
                selectedLottery={selectedLottery} 
                onLotteryChange={setSelectedLottery}
                showAnalysis={true}
              />
            </div>
          </TabsContent>

          {/* Heat Map */}
          <TabsContent value="heatmap">
            <HeatMap selectedLottery={selectedLottery} onLotteryChange={setSelectedLottery} />
          </TabsContent>

          {/* Results */}
          <TabsContent value="results">
            <GameResults />
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <GameResults showDetailedAnalysis={true} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-md py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              🚀 Experiência Única e Exclusiva
            </h3>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              O Shark Loto utiliza inteligência artificial avançada para analisar padrões históricos, identificar números quentes e frios, 
              e gerar combinações otimizadas que maximizam suas chances de sucesso. Nossa IA aprende continuamente com cada concurso, 
              evoluindo para oferecer previsões cada vez mais precisas e personalizadas para seu perfil de jogo.
            </p>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>© 2025 Shark Loto. Análise inteligente de loterias com tecnologia de ponta.</p>
            <p>🔒 Seus dados são privados e seguros. Nenhuma informação é compartilhada com outros usuários.</p>
            <p className="text-accent shark-brand font-semibold">powered by Shark062</p>
          </div>
        </div>
      </footer>
    </div>
  );
}