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
import CommunityInsights from '@/components/CommunityInsights';
import { useToast } from "@/hooks/use-toast";
import ContestWinners from "@/components/ContestWinners";
import NotificationSystem from "@/components/NotificationSystem";
import PixDonationButton from "@/components/PixDonationButton";

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
    slug: string; // Assuming slug is added here for CommunityInsights
  }>>({
    queryKey: ["/api/lotteries"],
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: upcomingDraws, refetch: refetchUpcomingDraws, isLoading: upcomingLoading } = useQuery({
    queryKey: ["/api/lotteries/upcoming"],
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2, // Reduzir tentativas
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 15000), // Delays menores
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false, // Desabilitar refetch automático
    networkMode: 'always', // Sempre tentar buscar dados
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

  // Auto-refresh otimizado - reduzir frequência para evitar travamentos
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    const startInterval = () => {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible' && !isUpdating) {
          // Apenas atualizar dados dos próximos sorteios
          refetchUpcomingDraws();
        }
      }, 2 * 60 * 1000); // 2 minutos ao invés de 10
    };

    // Aguardar 10 segundos antes de iniciar o interval
    const initialDelay = setTimeout(() => {
      startInterval();
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Pequeno delay para evitar múltiplas requisições
        setTimeout(() => {
          refetchUpcomingDraws();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchUpcomingDraws, isUpdating]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Helper function to get emoji based on lottery name
  const getLotteryEmoji = (name: string) => {
    switch (name) {
      case 'Lotofácil': return '🍀';
      case 'Mega-Sena': return '💰';
      case 'Quina': return '⭐';
      case 'Lotomania': return '💸';
      case 'Timemania': return '⚽';
      case 'Dupla-Sena': return '✌️';
      case 'Dia de Sorte': return '🗓️';
      case 'Super Sete': return '7️⃣';
      case 'Lotofácil da Independência': return '🎉';
      default: return '🎲';
    }
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

            {/* Contest Winners - Estatísticas reais dos últimos concursos */}
            <ContestWinners />

            {/* Community Insights para todas as loterias */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {lotteries?.slice(0, 3).map((lottery) => (
                <CommunityInsights
                  key={lottery.id}
                  lotterySlug={lottery.slug}
                  lotteryName={lottery.name}
                  lotteryEmoji={getLotteryEmoji(lottery.name)}
                />
              ))}
            </div>

            {/* Botão PIX de Doação - Final da Dashboard */}
            <div className="animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
              <PixDonationButton />
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
            <p className="text-muted-foreground max-w-3xl mx-auto mb-4">
              O Shark Loto utiliza inteligência artificial avançada para analisar padrões históricos, identificar números quentes e frios,
              e gerar combinações otimizadas que maximizam suas chances de sucesso. Nossa IA aprende continuamente com cada concurso,
              evoluindo para oferecer previsões cada vez mais precisas e personalizadas para seu perfil de jogo.
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-4xl mx-auto">
              <p className="text-sm text-yellow-200 text-center">
                ⚠️ <strong>IMPORTANTE:</strong> O Shark Loto é uma ferramenta educacional baseada em estudos estatísticos dos números que mais saem e menos saem com frequência nas loterias.
                Desenvolvemos estratégias para maximizar o número de acertos e aumentar as chances de êxito nos jogos.
                <strong> Não garantimos premiação</strong> - os jogos de loteria são baseados em sorte e probabilidade.
                Jogue com responsabilidade e apenas o que pode permitir-se perder.
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>© 2025 Shark Loto. Análise inteligente de loterias com tecnologia de ponta.</p>
            <p>🔒 Seus dados são privados e seguros. Nenhuma informação é compartilhada com outros usuários.</p>
            <p className="text-accent shark-brand font-semibold">powered by Shark062</p>
          </div>
        </div>
      </footer>

      {/* Notification System - Real-time notifications and celebrations */}
      <NotificationSystem userId={user?.id || 'guest'} />
    </div>
  );
}