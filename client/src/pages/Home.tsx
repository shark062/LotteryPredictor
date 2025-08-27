import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LotteryCard from "@/components/LotteryCard";
import NumberGenerator from "@/components/NumberGenerator";
import HeatMap from "@/components/HeatMap";
import GameResults from "@/components/GameResults";
import AILearningStatus from "@/components/AILearningStatus";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [selectedLottery, setSelectedLottery] = useState<number>(1);

  const { data: lotteries, isLoading: lotteriesLoading } = useQuery({
    queryKey: ["/api/lotteries"],
  });

  const { data: upcomingDraws } = useQuery({
    queryKey: ["/api/lotteries/upcoming"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/users/stats"],
  });

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
      <header className="border-b border-border bg-card/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-effect">
              <span className="text-xl">🦈</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent shark-brand">
              Shark Loto 💵
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <AILearningStatus />
            <div className="flex items-center space-x-2">
              <img 
                src={user?.profileImageUrl || '/placeholder-avatar.png'} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm">{user?.firstName || 'Usuário'}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
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
          <TabsList className="grid grid-cols-6 w-full max-w-4xl mx-auto bg-card/50 backdrop-blur-sm">
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
              <span className="hidden sm:inline">Histórico</span>
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
              <Card className="bg-card/30 border border-border glow-effect">
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
            <Card className="bg-card/30 border border-border glow-effect">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📈</span>
                  <span>Histórico de Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-muted-foreground">
                    Gráficos detalhados de performance em desenvolvimento
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/20 backdrop-blur-sm py-8 mt-16">
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
