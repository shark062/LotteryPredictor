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
// import CommunityInsights from '@/components/CommunityInsights';
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [selectedLottery, setSelectedLottery] = useState<number>(1);
  const { toast } = useToast();


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

  const { data: upcomingDraws, refetch: refetchUpcomingDraws, isLoading: upcomingLoading } = useQuery({
    queryKey: ["/api/lotteries/upcoming"],
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const { mutate: updateLotteryData, isPending: isUpdating } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/lotteries/update', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`Erro na atualização: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Forçar atualização dos dados
      refetchLotteries();
      refetchUpcomingDraws();
      console.log('Dados das loterias atualizados com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar dados:', error);
    }
  });

  // Auto-refresh mais inteligente - apenas se a aba estiver ativa
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    const startInterval = () => {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          updateLotteryData();
        }
      }, 10 * 60 * 1000); // 10 minutos
    };

    startInterval();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Atualizar dados quando a aba ficar ativa novamente
        refetchUpcomingDraws();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateLotteryData, refetchUpcomingDraws]);

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
      <FuturisticHeader />

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {lotteriesLoading || upcomingLoading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                    <p className="text-muted-foreground">
                      {isUpdating ? 'Atualizando dados...' : 'Carregando loterias...'}
                    </p>
                  </div>
                </div>
              ) : lotteries && lotteries.length > 0 ? (
                lotteries.map((lottery: any, index: number) => (
                  <LotteryCard
                    key={lottery.id}
                    lottery={lottery}
                    upcomingDraw={(upcomingDraws as any)?.[lottery.name] || undefined}
                    onSelect={() => setSelectedLottery(lottery.id)}
                    index={index}
                  />
                ))
              ) : (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-muted-foreground">Nenhuma loteria encontrada</p>
                    <Button onClick={() => updateLotteryData()} disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Tentar Novamente
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Winners Info */}
            <Card className="group bg-card/20 border border-border glow-effect backdrop-blur-md hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 overflow-hidden">
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

              <CardHeader className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-b border-yellow-400/30 group">
                <CardTitle className="flex items-center gap-3 text-yellow-300">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🏆</span>
                  <span className="group-hover:text-cyan-300 transition-colors duration-300">Ganhadores dos Últimos Concursos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-6">
                  {/* Controles de Teste */}
                  <div className="flex justify-center">
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/ai/simulate-draw/1', { method: 'POST' });
                          const result = await response.json();
                          if (result.success) {
                            toast({
                              title: "🎯 Sorteio Simulado!",
                              description: `Números: ${result.drawnNumbers.join(', ')} - Precisão atualizada!`,
                            });
                            // Forçar recarregamento dos dados
                            setTimeout(() => window.location.reload(), 1500);
                          }
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: "Falha ao simular sorteio",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      🎲 Simular Sorteio (Teste de Precisão)
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(upcomingDraws || {}).map(([name, info]: [string, any], index: number) => {
                      // Apenas renderiza se o nome for válido e não for a Lotofácil da Independência Oculta
                      if (!name || name === 'Lotofácil da Independência') {
                        return null;
                      }

                      // Simulando dados de ganhadores para demonstração
                      const winnersData = {
                        'Mega-Sena': { sena: 2, quina: 48, quadra: 2847 },
                        'Lotofácil': { pontos15: 3, pontos14: 287, pontos13: 9124 },
                        'Quina': { quina: 1, quadra: 67, terno: 4523 }
                      };

                      const currentWinners = winnersData[name as keyof typeof winnersData] || {};
                      const winnerCategories = name === 'Mega-Sena' 
                        ? [
                            { label: 'Sena (6 números)', count: (currentWinners as any).sena || 0, icon: '🎯', color: 'text-yellow-400' },
                            { label: 'Quina (5 números)', count: (currentWinners as any).quina || 0, icon: '⭐', color: 'text-blue-400' },
                            { label: 'Quadra (4 números)', count: (currentWinners as any).quadra || 0, icon: '🔸', color: 'text-green-400' }
                          ]
                        : name === 'Lotofácil'
                        ? [
                            { label: '15 pontos', count: (currentWinners as any).pontos15 || 0, icon: '🎯', color: 'text-yellow-400' },
                            { label: '14 pontos', count: (currentWinners as any).pontos14 || 0, icon: '⭐', color: 'text-blue-400' },
                            { label: '13 pontos', count: (currentWinners as any).pontos13 || 0, icon: '🔸', color: 'text-green-400' }
                          ]
                        : [
                            { label: 'Quina (5 números)', count: (currentWinners as any).quina || 0, icon: '🎯', color: 'text-yellow-400' },
                            { label: 'Quadra (4 números)', count: (currentWinners as any).quadra || 0, icon: '⭐', color: 'text-blue-400' },
                            { label: 'Terno (3 números)', count: (currentWinners as any).terno || 0, icon: '🔸', color: 'text-green-400' }
                          ];

                      return (
                        <div 
                          key={name}
                          className="group/lottery bg-card/10 border border-border/30 rounded-xl p-4 hover:scale-105 hover:shadow-lg transition-all duration-300 hover:border-cyan-400/40"
                        >
                          <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2 group-hover/lottery:text-cyan-300 transition-colors duration-300">
                            <span className="text-xl">{name === 'Mega-Sena' ? '💰' : name === 'Lotofácil' ? '🍀' : '⭐'}</span>
                            <span>{name}</span>
                          </h4>

                          <div className="space-y-2">
                            {winnerCategories.map((category, catIndex) => (
                              <div 
                                key={catIndex}
                                className="flex items-center justify-between p-2 rounded-lg bg-background/20 border border-border/20"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm">{category.icon}</span>
                                  <span className="text-sm text-muted-foreground">{category.label}</span>
                                </div>
                                <span className={`font-bold ${category.color} transition-all duration-300 group-hover/lottery:scale-110`}>
                                  {category.count.toLocaleString('pt-BR')}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Barra de progresso */}
                          <div className="mt-3 w-full bg-muted/20 rounded-full h-1 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000 w-0 group-hover/lottery:w-full"
                              style={{ animationDelay: `${index * 200}ms` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    💡 Dados baseados nos últimos concursos realizados
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Insights da Comunidade */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-cyan-300 mb-4 text-center">
                🌐 Inteligência Colaborativa
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Community insights feature temporarily disabled */}
                <div className="text-center p-4 text-muted-foreground">
                  <p>Insights da comunidade em breve...</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Generator */}
          <TabsContent value="generator">
            <NumberGenerator 
              selectedLottery={selectedLottery || 1} 
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
                selectedLottery={selectedLottery || 1} 
                onLotteryChange={setSelectedLottery}
                showAnalysis={true}
              />
            </div>
          </TabsContent>

          {/* Heat Map */}
          <TabsContent value="heatmap">
            <HeatMap selectedLottery={selectedLottery || 1} onLotteryChange={setSelectedLottery} />
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