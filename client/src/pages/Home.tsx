import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import logoUrl from '../assets/cyberpunk-shark.png';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import N8nControlPanel from "@/components/N8nControlPanel"; // Importa o novo componente

export default function Home() {
  const { user, isLoading } = useAuth();
  const [selectedLottery, setSelectedLottery] = useState<number>(0); // Iniciar sem seleção
  const { toast } = useToast();

  const { data: lotteries, isLoading: lotteriesLoading, refetch: refetchLotteries, error } = useQuery<Array<{
    id: number;
    name: string;
    minNumbers: number;
    maxNumbers: number;
    maxNumber: number;
    slug: string; // Assuming slug is added here for CommunityInsights
  }>>({
    queryKey: ["/api/lotteries"],
    queryFn: async () => {
      const response = await fetch('/api/lotteries');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });


  const { data: upcomingDraws, refetch: refetchUpcomingDraws, isLoading: upcomingLoading } = useQuery({
    queryKey: ["/api/lotteries/upcoming"],
    staleTime: 15 * 60 * 1000, // 15 minutos - dados não mudam frequentemente
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 1, // Reduzir tentativas para 1
    retryDelay: 5000, // 5 segundos fixos
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Não refetch no mount para reduzir requests
    refetchInterval: false,
    networkMode: 'online', // Só buscar quando online
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

  // Auto-refresh otimizado - reduzir frequência drasticamente para melhorar performance
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    const startInterval = () => {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible' && !isUpdating) {
          // Apenas atualizar dados dos próximos sorteios - intervalo de 10 minutos
          refetchUpcomingDraws();
        }
      }, 10 * 60 * 1000); // 10 minutos para reduzir carga no servidor
    };

    // Aguardar 30 segundos antes de iniciar o interval
    const initialDelay = setTimeout(() => {
      startInterval();
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Delay maior para evitar múltiplas requisições
        setTimeout(() => {
          refetchUpcomingDraws();
        }, 3000);
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
      case '+Milionária': return '💎';
      case 'Loteria Federal': return '🎫';
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
      {/* Partículas flutuantes aquáticas animadas */}
      <div className="floating-particles">
        {/* Bolhas principais */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`main-${i}`}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${3 + Math.random() * 5}px`,
              height: `${3 + Math.random() * 5}px`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${20 + Math.random() * 15}s`,
              animation: `particle-float ${20 + Math.random() * 15}s ${Math.random() * 15}s infinite linear, particle-drift ${12 + Math.random() * 8}s ease-in-out infinite`
            }}
          />
        ))}

        {/* Microbolhas */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`micro-${i}`}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              width: '1px',
              height: '1px',
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${8 + Math.random() * 12}s`,
              animation: `bubble-rise ${8 + Math.random() * 12}s ${Math.random() * 20}s infinite linear`,
              opacity: 0.4
            }}
          />
        ))}

        {/* Partículas de plâncton luminoso */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`plankton-${i}`}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              animationDelay: `${Math.random() * 25}s`,
              animationDuration: `${25 + Math.random() * 20}s`,
              animation: `particle-float ${25 + Math.random() * 20}s ${Math.random() * 25}s infinite ease-in-out, particle-drift ${15 + Math.random() * 10}s ease-in-out infinite`,
              background: `rgba(${Math.random() * 100 + 155}, ${Math.random() * 100 + 155}, 255, ${0.3 + Math.random() * 0.4})`,
              filter: `blur(${Math.random() * 2}px)`
            }}
          />
        ))}
      </div>

      {/* Futuristic Header */}
      <FuturisticHeader />

      {/* Main Content */}
      <main className="responsive-container py-4 sm:py-6 lg:py-8 dashboard-content">
        <Tabs defaultValue="dashboard" className="space-y-6 sm:space-y-8">
          {/* Navigation */}
          <TabsList className="grid grid-cols-5 w-full max-w-6xl mx-auto bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-1">
            {[
              { value: 'dashboard', icon: '📊', label: 'Dashboard', description: 'Aqui você vê todas as loterias com dados atualizados em tempo real' },
              { value: 'generator', icon: '🎲', label: 'Gerador', description: 'Aqui a IA gera os números com as melhores probabilidades' },
              { value: 'heatmap', icon: '🗺️', label: 'Mapa', description: 'Aqui você visualiza quais números saem mais frequentemente' },
              { value: 'results', icon: '🏆', label: 'Resultados', description: 'Aqui você acompanha todos os concursos e histórico' },
              { value: 'loterias-info', icon: '📋', label: 'Info', description: 'Guia completo com todas as informações das loterias brasileiras' }
            ].map((tab, index) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="group relative flex items-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:border-cyan-400/50"
                data-testid={`tab-${tab.value}`}
                title={tab.description}
              >
                <span className="text-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                  {tab.icon}
                </span>
                <span className="hidden sm:inline group-hover:text-cyan-300 transition-colors duration-300">
                  {tab.label}
                </span>

                {/* Tooltip com descrição */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50 pointer-events-none border border-cyan-400/50">
                  {tab.description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                </div>

                {/* Indicador ativo animado */}
                <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-cyan-400 group-data-[state=active]:w-full group-data-[state=active]:left-0 transition-all duration-300 rounded-full" />
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6 sm:space-y-8">
            {/* Descrição da seção */}
            <div className="feature-description rounded-xl p-4 text-center mb-6">
              <h2 className="text-xl font-bold text-cyan-300 mb-2">🎯 Dashboard Principal - Visão Geral Completa</h2>
              <p className="text-muted-foreground">
                Aqui você encontra todas as loterias com dados oficiais da Caixa Econômica Federal atualizados em tempo real.
                Veja prêmios, próximos sorteios e estatísticas de cada modalidade.
              </p>
            </div>
            <div className="responsive-grid-4">
              {lotteriesLoading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                    <p className="text-muted-foreground">
                      {isUpdating ? 'Atualizando dados...' : 'Carregando loterias...'}
                    </p>
                  </div>
                </div>
              ) : Array.isArray(lotteries) && lotteries.length > 0 ? (
                lotteries.map((lottery: any, index: number) => (
                  <LotteryCard
                    key={lottery.id}
                    lottery={lottery}
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
            <div className="responsive-grid-3">
              {lotteries?.slice(0, 3).map((lottery) => (
                <CommunityInsights
                  key={lottery.id}
                  lotterySlug={lottery.slug}
                />
              ))}
            </div>

            {/* Botão PIX de Doação - Final da Dashboard */}
            <div>
              <PixDonationButton />
            </div>
          </TabsContent>

          {/* Generator */}
          <TabsContent value="generator" className="space-y-6 sm:space-y-8">
            {/* Descrição da seção */}
            <div className="feature-description rounded-xl p-4 text-center mb-6">
              <h2 className="text-xl font-bold text-cyan-300 mb-2">🤖 Gerador IA - Criação Inteligente de Jogos</h2>
              <p className="text-muted-foreground">
                Nossa IA analisa milhares de resultados históricos para gerar seus números com base em estratégias avançadas.
                Escolha entre números quentes, frios ou use análise mista para maximizar suas chances.
              </p>
            </div>
            <NumberGenerator
              selectedLottery={selectedLottery}
              onLotteryChange={setSelectedLottery}
            />
          </TabsContent>



          {/* Heat Map */}
          <TabsContent value="heatmap" className="space-y-6 sm:space-y-8">
            {/* Descrição da seção */}
            <div className="feature-description rounded-xl p-4 text-center mb-6">
              <h2 className="text-xl font-bold text-cyan-300 mb-2">🔥 Mapa de Calor - Análise Visual de Frequências</h2>
              <p className="text-muted-foreground">
                Visualize quais números saem com mais frequência através de cores. Números em azul são frios (raros),
                em amarelo/vermelho são quentes (frequentes). Use essa informação para suas estratégias.
              </p>
            </div>
            <HeatMap selectedLottery={selectedLottery || 1} onLotteryChange={setSelectedLottery} />
          </TabsContent>

          {/* Results */}
          <TabsContent value="results" className="space-y-6 sm:space-y-8">
            {/* Descrição da seção */}
            <div className="feature-description rounded-xl p-4 text-center mb-6">
              <h2 className="text-xl font-bold text-cyan-300 mb-2">🏆 Resultados - Histórico Completo dos Concursos</h2>
              <p className="text-muted-foreground">
                Consulte todos os resultados oficiais dos concursos, veja estatísticas detalhadas e
                acompanhe a evolução dos prêmios. Dados sempre atualizados da Caixa Econômica Federal.
              </p>
            </div>
            <GameResults />
          </TabsContent>

          {/* Loterias Info - Guia Completo */}
          <TabsContent value="loterias-info" className="space-y-6 sm:space-y-8">
            {/* Descrição da seção */}
            <div className="feature-description rounded-xl p-4 text-center mb-6">
              <h2 className="text-xl font-bold text-cyan-300 mb-2">📋 Guia Completo das Loterias - Informações Oficiais</h2>
              <p className="text-muted-foreground">
                Tabela completa com todas as loterias da Caixa Econômica Federal, incluindo como jogar,
                valores das apostas, probabilidades e faixas de premiação de cada modalidade.
              </p>
            </div>

            {/* Tabela Completa das Loterias */}
            <div className="grid gap-6">
              {/* Cards das Loterias Principais */}
              <div className="responsive-grid-2">
                {/* Mega-Sena */}
                <Card className="bg-gradient-to-br from-green-500/10 to-yellow-500/10 border-green-500/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <span className="text-3xl">💰</span>
                      <span className="text-green-300">Mega-Sena</span>
                      <Badge className="bg-green-500/20 text-green-300">Principal</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-cyan-300 mb-2">Como Jogar</h4>
                        <p className="text-sm text-muted-foreground">Escolha 6 a 15 números entre 1 e 60</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-cyan-300 mb-2">Aposta Mínima</h4>
                        <p className="text-sm font-bold text-green-300">R$ 6,00</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-2">Probabilidade (6 acertos)</h4>
                      <p className="text-sm text-orange-300">1 em 50.063.860</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-2">Faixas de Prêmios</h4>
                      <div className="flex flex-wrap gap-2">
                        {['6 acertos', '5 acertos (Quina)', '4 acertos (Quadra)'].map((faixa, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{faixa}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                      <p className="text-xs text-green-300">
                        <strong>Sorteios:</strong> Quartas e Sábados às 20h
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* +Milionária */}
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">💰</span>
                      <span className="text-yellow-300">+Milionária</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Como Jogar</h4>
                      <p className="text-xs text-muted-foreground">6 números (1-50) + 2 trevos da sorte 🍀 (1-6)</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Aposta</h4>
                      <p className="text-xs font-bold text-yellow-300">R$ 10,00</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Prêmio Mínimo</h4>
                      <p className="text-xs text-orange-300">R$ 10 milhões</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Faixas</h4>
                      <p className="text-xs text-muted-foreground">10 faixas de premiação</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Lotofácil */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <span className="text-3xl">🍀</span>
                      <span className="text-blue-300">Lotofácil</span>
                      <Badge className="bg-blue-500/20 text-blue-300">Fácil</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-cyan-300 mb-2">Como Jogar</h4>
                        <p className="text-sm text-muted-foreground">Escolha 15 a 20 números entre 1 e 25</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-cyan-300 mb-2">Aposta Mínima</h4>
                        <p className="text-sm font-bold text-blue-300">R$ 3,50</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-2">Probabilidade (15 acertos)</h4>
                      <p className="text-sm text-orange-300">1 em 3.268.760</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-2">Faixas de Prêmios</h4>
                      <div className="flex flex-wrap gap-2">
                        {['15 acertos', '14 acertos', '13 acertos', '12 acertos', '11 acertos'].map((faixa, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{faixa}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                      <p className="text-xs text-blue-300">
                        <strong>Sorteios:</strong> Segunda a Sábado às 20h
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quina */}
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <span className="text-3xl">⭐</span>
                      <span className="text-yellow-300">Quina</span>
                      <Badge className="bg-yellow-500/20 text-yellow-300">Diária</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-cyan-300 mb-2">Como Jogar</h4>
                        <p className="text-sm text-muted-foreground">Escolha 5 a 15 números entre 1 e 80</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-cyan-300 mb-2">Aposta Mínima</h4>
                        <p className="text-sm font-bold text-yellow-300">R$ 3,00</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-2">Probabilidade (5 acertos)</h4>
                      <p className="text-sm text-orange-300">1 em 24.040.016</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-2">Faixas de Prêmios</h4>
                      <div className="flex flex-wrap gap-2">
                        {['5 acertos (Quina)', '4 acertos (Quadra)', '3 acertos (Terno)', '2 acertos (Duque)'].map((faixa, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{faixa}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                      <p className="text-xs text-yellow-300">
                        <strong>Sorteios:</strong> Segunda a Sábado às 20h
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cards das Loterias Especiais */}
              <div className="responsive-grid-3">
                {/* Lotomania */}
                <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">🎯</span>
                      <span className="text-red-300">Lotomania</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Como Jogar</h4>
                      <p className="text-xs text-muted-foreground">50 números entre 0 e 99</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Aposta</h4>
                      <p className="text-xs font-bold text-red-300">R$ 2,50</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Probabilidade</h4>
                      <p className="text-xs text-orange-300">1 em 11.372.635</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Prêmios</h4>
                      <p className="text-xs text-muted-foreground">20, 19, 18, 17, 16, 15, 0 acertos</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Timemania */}
                <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">⚽</span>
                      <span className="text-green-300">Timemania</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Como Jogar</h4>
                      <p className="text-xs text-muted-foreground">10 números + time do coração</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Aposta</h4>
                      <p className="text-xs font-bold text-green-300">R$ 3,00</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Probabilidade</h4>
                      <p className="text-xs text-orange-300">1 em 26.472.637</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Prêmios</h4>
                      <p className="text-xs text-muted-foreground">7, 6, 5, 4, 3 acertos + time</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Dupla Sena */}
                <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">🎲</span>
                      <span className="text-purple-300">Dupla Sena</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Como Jogar</h4>
                      <p className="text-xs text-muted-foreground">6 a 15 números (2 sorteios)</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Aposta</h4>
                      <p className="text-xs font-bold text-purple-300">R$ 3,00</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Probabilidade</h4>
                      <p className="text-xs text-orange-300">1 em 15.890.700</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Prêmios</h4>
                      <p className="text-xs text-muted-foreground">6, 5, 4, 3 acertos (cada sorteio)</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Dia de Sorte */}
                <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">🌟</span>
                      <span className="text-orange-300">Dia de Sorte</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Como Jogar</h4>
                      <p className="text-xs text-muted-foreground">7 a 15 números + mês</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Aposta</h4>
                      <p className="text-xs font-bold text-orange-300">R$ 2,00</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Probabilidade</h4>
                      <p className="text-xs text-orange-300">1 em 2.629.375</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Prêmios</h4>
                      <p className="text-xs text-muted-foreground">7, 6, 5, 4, 3 acertos + mês</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Super Sete */}
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">🔥</span>
                      <span className="text-indigo-300">Super Sete</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Como Jogar</h4>
                      <p className="text-xs text-muted-foreground">7 colunas (0 a 9 cada)</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Aposta</h4>
                      <p className="text-xs font-bold text-indigo-300">R$ 2,50</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Probabilidade</h4>
                      <p className="text-xs text-orange-300">1 em 10.000.000</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Prêmios</h4>
                      <p className="text-xs text-muted-foreground">7, 6, 5, 4, 3 acertos</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Loteria Federal */}
                <Card className="bg-gradient-to-br from-teal-500/10 to-green-500/10 border-teal-500/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">🎫</span>
                      <span className="text-teal-300">Loteria Federal</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Como Jogar</h4>
                      <p className="text-xs text-muted-foreground">Bilhetes numerados 00000-99999</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Aposta</h4>
                      <p className="text-xs font-bold text-teal-300">R$ 5,00</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Sistema</h4>
                      <p className="text-xs text-orange-300">Bilhete físico tradicional</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-300 mb-1">Prêmios</h4>
                      <p className="text-xs text-muted-foreground">Principal + aproximações</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resumo e Dicas */}
              <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <span className="text-3xl">💡</span>
                    <span className="text-cyan-300">Dicas e Informações Importantes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-yellow-300">🎯 Estratégias Inteligentes</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• <strong>Lotofácil:</strong> Maior chance de ganhar, ideal para iniciantes</li>
                        <li>• <strong>Quina:</strong> Sorteios diários aumentam as oportunidades</li>
                        <li>• <strong>Mega-Sena:</strong> Maiores prêmios, mas menor probabilidade</li>
                        <li>• <strong>+Milionária:</strong> Prêmio mínimo garantido de R$ 10 milhões</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-green-300">💰 Investimento vs Retorno</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• <strong>Menor investimento:</strong> Dia de Sorte (R$ 2,00)</li>
                        <li>• <strong>Melhor custo-benefício:</strong> Lotofácil (R$ 3,50)</li>
                        <li>• <strong>Maiores prêmios:</strong> Mega-Sena e +Milionária</li>
                        <li>• <strong>Mais sorteios:</strong> Lotofácil e Quina (diárias)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-300 mb-2 flex items-center gap-2">
                      <span>⚠️</span> Aviso Importante
                    </h4>
                    <p className="text-sm text-yellow-200">
                      Todas as loterias são jogos de azar baseados em probabilidade e sorte. O Shark Loteria oferece
                      análises estatísticas para otimizar suas chances, mas não garantimos premiação.
                      Jogue com responsabilidade e apenas o que pode permitir-se perder.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          

        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-md py-6 sm:py-8 mt-8 sm:mt-16">
        <div className="responsive-container text-center">
          <div className="mb-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              🚀 Experiência Única e Exclusiva
            </h3>
            <p className="text-muted-foreground max-w-3xl mx-auto mb-4">
              O Shark Loteria utiliza inteligência artificial avançada para analisar padrões históricos, identificar números quentes e frios,
              e gerar combinações otimizadas que maximizam suas chances de sucesso. Nossa IA aprende continuamente com cada concurso,
              evoluindo para oferecer previsões cada vez mais precisas e personalizadas para seu perfil de jogo.
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-4xl mx-auto">
              <p className="text-sm text-yellow-200 text-center">
                ⚠️ <strong>IMPORTANTE:</strong> O Shark Loteria é uma ferramenta educacional baseada em estudos estatísticos dos números que mais saem e menos saem com frequência nas loterias.
                Desenvolvemos estratégias para maximizar o número de acertos e aumentar as chances de êxito nos jogos.
                <strong> Não garantimos premiação</strong> - os jogos de loteria são baseados em sorte e probabilidade.
                Jogue com responsabilidade e apenas o que pode permitir-se perder.
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>© 2025 Shark Loteria. Análise inteligente de loterias com tecnologia de ponta.</p>
            <p>🔒 Seus dados são privados e seguros. Nenhuma informação é compartilhada com outros usuários.</p>
            <p className="text-accent shark-brand font-semibold">POWERED BY SHARK062</p>
          </div>
        </div>
      </footer>

      {/* Notification System - Real-time notifications and celebrations */}
      <NotificationSystem userId={user?.id || 'guest'} />
    </div>
  );
}