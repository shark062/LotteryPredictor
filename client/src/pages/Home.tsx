import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import logoUrl from '../assets/cyberpunk-shark.png';
import { Button } from "@/components/ui/button";
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

  const { data: lotteries, isLoading: lotteriesLoading, refetch: refetchLotteries } = useQuery({
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

  const { data: userStats, refetch: refetchUserStats } = useQuery({
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
      {/* Header */}
      <header className="border-b border-border backdrop-blur-md sticky top-0 z-40 overflow-hidden relative">
        {/* Swimming Sharks Animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="shark-swim-left absolute top-2 left-0 opacity-80">
            ⚡🦈⚡💎
          </div>
          <div className="shark-swim-right absolute top-2 right-0 opacity-80">
            💎⚡🦈⚡
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center glow-effect overflow-hidden animate-pulse shark-logo">
              <img 
                src={logoUrl} 
                alt="Shark Loto Logo" 
                className="w-full h-full object-cover rounded-xl animate-float"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent shark-brand animate-glow text-3d">
                🦈 SHARK LOTO 💵
              </h1>
              <p className="text-xs text-accent font-semibold shark-brand animate-pulse subtitle-3d">
                FOME DE DINHEIRO! 🤑
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-accent text-sm animate-pulse">
              <span>🔄</span>
              <span className="shark-brand">AUTO-SYNC ATIVO</span>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              size="sm"
              className="border-accent/50 hover:bg-accent/20 text-accent hover:text-accent-foreground transition-all duration-300"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-8">
          {/* Navigation */}
          <TabsList className="grid grid-cols-6 w-full max-w-4xl mx-auto bg-card/40 backdrop-blur-md">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2" data-testid="tab-dashboard">
              <span>📊</span>
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center space-x-2" data-testid="tab-generator">
              <span>🎲</span>
              <span className="hidden sm:inline">Gerador</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2" data-testid="tab-analysis">
              <span>🔥</span>
              <span className="hidden sm:inline">Análise</span>
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="flex items-center space-x-2" data-testid="tab-heatmap">
              <span>🗺️</span>
              <span className="hidden sm:inline">Mapa</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center space-x-2" data-testid="tab-results">
              <span>🏆</span>
              <span className="hidden sm:inline">Resultados</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2" data-testid="tab-history">
              <span>📈</span>
              <span className="hidden sm:inline">Meus Jogos</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {lotteries?.map((lottery: any, index: number) => (
                <LotteryCard
                  key={lottery.id}
                  lottery={lottery}
                  upcomingDraw={upcomingDraws?.[lottery.name]}
                  onSelect={() => setSelectedLottery(lottery.id)}
                />
              ))}
            </div>

            {/* User Stats */}
            {userStats && (
              <Card className="bg-card/30 border border-border glow-effect backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>📊</span>
                    <span>Suas Estatísticas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{userStats.totalGames}</div>
                      <p className="text-sm text-muted-foreground">Jogos Realizados</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{userStats.totalWins}</div>
                      <p className="text-sm text-muted-foreground">Jogos Premiados</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">{userStats.winRate.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">
                        R$ {userStats.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Ganho</p>
                    </div>
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