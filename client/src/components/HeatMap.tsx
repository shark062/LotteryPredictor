import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, Activity, BarChart3, RefreshCw } from "lucide-react";
import React, { useState, useEffect } from "react";

interface HeatMapProps {
  selectedLottery: number;
  onLotteryChange: (lotteryId: number) => void;
}

interface FrequencyData {
  number: number;
  frequency: number;
  percentage?: number;
  lastSeen?: string;
}

export default function HeatMap({ selectedLottery, onLotteryChange }: HeatMapProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisUpdate, setLastAnalysisUpdate] = useState<string>('');

  // Buscar lista de loterias
  const { data: lotteries, isLoading: lotteriesLoading } = useQuery({
    queryKey: ["/api/lotteries"],
    queryFn: async () => {
      const response = await fetch('/api/lotteries');
      if (!response.ok) throw new Error('Falha ao buscar loterias');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Buscar dados de frequência
  const { data: frequencies, isLoading: frequenciesLoading, isError, error, refetch } = useQuery({
    queryKey: ["/api/lotteries", selectedLottery, "frequencies"],
    queryFn: async () => {
      const response = await fetch(`/api/lotteries/${selectedLottery}/frequencies`);
      if (!response.ok) throw new Error('Falha ao buscar frequências');
      return response.json();
    },
    enabled: selectedLottery > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  // Função para disparar análise histórica
  const triggerHistoricalAnalysis = async () => {
    if (!selectedLottery || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analysis/historical", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lotteryId: selectedLottery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao iniciar análise histórica");
      }

      toast({
        title: "🔥 Análise Histórica Iniciada!",
        description: "Os dados estão sendo processados. O mapa será atualizado automaticamente.",
        duration: 6000,
        className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-400",
      });

      setLastAnalysisUpdate(new Date().toLocaleString('pt-BR'));
      
      // Aguardar 3 segundos e atualizar dados
      setTimeout(() => {
        refetch();
      }, 3000);

    } catch (err: any) {
      toast({
        title: "❌ Erro na Análise",
        description: err.message || "Não foi possível iniciar a análise histórica.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedLotteryData = Array.isArray(lotteries) ? lotteries.find((l: any) => l.id === selectedLottery) : null;

  // Calcular nível de calor baseado na frequência
  const getHeatLevel = (frequency: number, maxFreq: number): number => {
    if (maxFreq === 0) return 0;
    const ratio = frequency / maxFreq;
    if (ratio >= 0.9) return 5; // Máximo (vermelho intenso)
    if (ratio >= 0.7) return 4; // Muito quente (vermelho)
    if (ratio >= 0.5) return 3; // Quente (laranja)
    if (ratio >= 0.3) return 2; // Morno (roxo)
    if (ratio >= 0.1) return 1; // Frio (azul)
    return 0; // Muito frio (azul escuro)
  };

  // Validar e processar dados de frequência
  const validFrequencies: FrequencyData[] = Array.isArray(frequencies) 
    ? frequencies.filter((f: any) => f && typeof f.frequency === 'number' && f.number > 0) 
    : [];

  const maxFrequency = validFrequencies.length > 0 
    ? Math.max(...validFrequencies.map(f => f.frequency)) 
    : 0;

  // Atualizar timestamp quando frequências mudarem
  useEffect(() => {
    if (validFrequencies.length > 0) {
      setLastAnalysisUpdate(new Date().toLocaleString('pt-BR'));
    }
  }, [validFrequencies.length]);

  // Tratar erros
  if (isError && selectedLottery > 0) {
    console.error("Erro ao carregar frequências:", error);
  }

  const isLoading = lotteriesLoading || frequenciesLoading;

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-purple-500/30 shadow-xl">
      <CardHeader className="pb-4">
        <div className="text-center space-y-4">
          {/* Título principal */}
          <div className="flex items-center justify-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Mapa de Calor - Frequência dos Números</h3>
          </div>

          {/* Descrição */}
          <p className="text-sm text-slate-400">Análise detalhada baseada em dados históricos da Caixa</p>

          {/* Botão e Seletor */}
          <div className="flex items-center justify-center space-x-3">
            {selectedLottery > 0 && (
              <button 
                onClick={triggerHistoricalAnalysis}
                disabled={isAnalyzing}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-md transition-all duration-200 flex items-center gap-1.5 text-sm font-medium shadow-md"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    Analisar Histórico
                  </>
                )}
              </button>
            )}
            <Select 
              value={selectedLottery === 0 ? "" : selectedLottery.toString()} 
              onValueChange={(value) => onLotteryChange(parseInt(value))}
            >
              <SelectTrigger className="w-56 bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Selecione a modalidade" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {Array.isArray(lotteries) ? lotteries.map((lottery: any) => (
                  <SelectItem key={lottery.id} value={lottery.id.toString()} className="text-white hover:bg-slate-700">
                    {lottery.name} (1-{lottery.maxNumber})
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </div>

          {/* Nome da loteria e range - só aparece após seleção */}
          {selectedLottery > 0 && selectedLotteryData && (
            <div className="text-center">
              <h4 className="text-lg font-semibold text-cyan-300">{selectedLotteryData.name}</h4>
              <p className="text-sm text-slate-400">(1-{selectedLotteryData.maxNumber})</p>
            </div>
          )}

          {/* Informações de análise */}
          {lastAnalysisUpdate && (
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-400">Última análise: {lastAnalysisUpdate}</p>
              <p className="text-xs text-purple-400">Dados da Caixa Econômica Federal</p>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {selectedLottery === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Selecione uma Modalidade</h3>
            <p className="text-slate-400">Escolha uma loteria acima para visualizar o mapa de calor dos números</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-6">
            {/* Loading skeleton para o grid */}
            <div 
              className="grid gap-2" 
              style={{ 
                gridTemplateColumns: selectedLotteryData?.maxNumber <= 25 
                  ? 'repeat(5, minmax(0, 1fr))' 
                  : selectedLotteryData?.maxNumber <= 60 
                  ? 'repeat(10, minmax(0, 1fr))' 
                  : 'repeat(10, minmax(0, 1fr))'
              }}
            >
              {Array.from({ length: selectedLotteryData?.maxNumber || 60 }, (_, i) => (
                <Skeleton key={i} className="w-12 h-12 rounded-lg" />
              ))}
            </div>
            {/* Loading skeleton para estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>
        ) : validFrequencies.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Dados Não Disponíveis</h3>
            <p className="text-slate-400 mb-4">Nenhum dado de frequência encontrado para esta modalidade.</p>
            <p className="text-slate-500 text-sm mb-6">Os dados serão gerados após o processamento dos concursos históricos.</p>
            <button
              onClick={triggerHistoricalAnalysis}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2 font-medium mx-auto"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  Iniciar Análise
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Mapa de Calor Principal */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Mapa de Frequência
                </h4>
                <div className="text-sm text-slate-400">
                  Total: {selectedLotteryData?.maxNumber} números
                </div>
              </div>
              
              <div className="heat-map-grid">
                {Array.from({ length: selectedLotteryData?.maxNumber || 60 }, (_, i) => {
                  const number = i + 1;
                  const frequencyData = validFrequencies.find(f => f.number === number);
                  const frequency = frequencyData?.frequency || 0;
                  const heatLevel = getHeatLevel(frequency, maxFrequency);
                  const percentage = maxFrequency > 0 ? ((frequency / maxFrequency) * 100).toFixed(1) : '0';

                  return (
                    <div
                      key={number}
                      className={cn("heat-number", `heat-${heatLevel}`)}
                      title={`Número ${number}\nFrequência: ${frequency} vezes\nPercentual: ${percentage}% do máximo`}
                    >
                      <span className="heat-number-main">
                        {number.toString().padStart(2, '0')}
                      </span>
                      <span className="heat-number-freq">
                        {frequency}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legenda do Mapa de Calor */}
            <div className="bg-slate-800/30 rounded-xl p-3">
              <h5 className="text-sm font-semibold text-white mb-2">Legenda de Intensidade</h5>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="heat-legend">
                  <div className="heat-legend-item heat-0"></div>
                  <span className="text-slate-300">Muito Frio</span>
                </div>
                <div className="heat-legend">
                  <div className="heat-legend-item heat-1"></div>
                  <span className="text-slate-300">Frio</span>
                </div>
                <div className="heat-legend">
                  <div className="heat-legend-item heat-2"></div>
                  <span className="text-slate-300">Morno</span>
                </div>
                <div className="heat-legend">
                  <div className="heat-legend-item heat-3"></div>
                  <span className="text-slate-300">Quente</span>
                </div>
                <div className="heat-legend">
                  <div className="heat-legend-item heat-4"></div>
                  <span className="text-slate-300">Muito Quente</span>
                </div>
                <div className="heat-legend">
                  <div className="heat-legend-item heat-5"></div>
                  <span className="text-slate-300">Máximo</span>
                </div>
              </div>
            </div>

            {/* Estatísticas Detalhadas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl p-4 border border-red-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400 mb-1">
                    {maxFrequency > 0 ? validFrequencies.filter(f => f.frequency >= maxFrequency * 0.7).length : 0}
                  </div>
                  <p className="text-sm text-red-300 font-medium">Números Quentes</p>
                  <p className="text-xs text-red-400/70">≥70% da freq. máxima</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {maxFrequency > 0 ? validFrequencies.filter(f => f.frequency <= maxFrequency * 0.3).length : 0}
                  </div>
                  <p className="text-sm text-blue-300 font-medium">Números Frios</p>
                  <p className="text-xs text-blue-400/70">≤30% da freq. máxima</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">{maxFrequency || 0}</div>
                  <p className="text-sm text-purple-300 font-medium">Maior Frequência</p>
                  <p className="text-xs text-purple-400/70">Número mais sorteado</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {validFrequencies.length > 0 ? Math.round(validFrequencies.reduce((acc, f) => acc + f.frequency, 0) / validFrequencies.length) : 0}
                  </div>
                  <p className="text-sm text-green-300 font-medium">Frequência Média</p>
                  <p className="text-xs text-green-400/70">Média geral</p>
                </div>
              </div>
            </div>

            {/* Top 10 Números Mais e Menos Sorteados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mais Sorteados */}
              <div className="bg-slate-800/30 rounded-xl p-4">
                <h5 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Top 10 - Mais Sorteados
                </h5>
                <div className="space-y-2">
                  {validFrequencies
                    .sort((a, b) => b.frequency - a.frequency)
                    .slice(0, 10)
                    .map((item, index) => (
                      <div key={item.number} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">#{index + 1}</span>
                          <span className={cn(
                            "w-6 h-6 rounded flex items-center justify-center font-bold text-[10px]",
                            `heat-${getHeatLevel(item.frequency, maxFrequency)}`
                          )}>
                            {item.number.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <span className="text-red-400 font-medium">{item.frequency}x</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Menos Sorteados */}
              <div className="bg-slate-800/30 rounded-xl p-4">
                <h5 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 rotate-180" />
                  Top 10 - Menos Sorteados
                </h5>
                <div className="space-y-2">
                  {validFrequencies
                    .sort((a, b) => a.frequency - b.frequency)
                    .slice(0, 10)
                    .map((item, index) => (
                      <div key={item.number} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">#{index + 1}</span>
                          <span className={cn(
                            "w-6 h-6 rounded flex items-center justify-center font-bold text-[10px]",
                            `heat-${getHeatLevel(item.frequency, maxFrequency)}`
                          )}>
                            {item.number.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <span className="text-blue-400 font-medium">{item.frequency}x</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}