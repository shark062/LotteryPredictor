import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Wifi, RefreshCw, Users, Calendar, TrendingUp, Award, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface WinnerDetail {
  hits: number;
  winnerCount: number;
  prizeValue: string;
}

interface ContestData {
  [key: string]: {
    lottery?: string;
    contest?: number;
    date?: string;
    drawnNumbers?: number[];
    accumulated?: boolean | string;
    nextEstimate?: string;
    winners?: WinnerDetail[];
    totalPrize?: string;
    nextDraw?: string;
  };
}

export default function ContestWinners() {
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('Caixa Econômica Federal - Dados Oficiais');
  const [isUpdating, setIsUpdating] = useState(false);

  // Query para buscar dados dos últimos concursos
  const { data: apiResponse, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['/api/lotteries/contest-winners'],
    queryFn: async () => {
      const response = await fetch('/api/lotteries/contest-winners');
      if (!response.ok) {
        throw new Error('Falha ao buscar dados dos concursos');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    retryDelay: 2000,
    refetchOnWindowFocus: false,
  });

  const contestData = apiResponse?.data || {};

  // Função para forçar atualização
  const forceUpdate = async () => {
    setIsUpdating(true);
    try {
      await refetch();
      setLastUpdate(new Date().toLocaleString('pt-BR'));
      setDataSource('Caixa Econômica Federal - Dados Oficiais');
    } catch (error) {
      console.error('Erro ao atualizar dados dos concursos:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Atualizar timestamp quando dados mudarem
  useEffect(() => {
    if (Object.keys(contestData).length > 0) {
      setLastUpdate(new Date().toLocaleString('pt-BR'));
    }
  }, [contestData]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Ganhadores dos Últimos Concursos
            </div>
            <div className="flex items-center gap-2 text-sm font-normal">
              <button
                onClick={forceUpdate}
                disabled={isUpdating}
                className="flex items-center gap-1 px-2 py-1 bg-green-600/20 hover:bg-green-600/40 rounded text-green-400 transition-all duration-200"
              >
                <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Atualizando...' : 'Atualizar'}
              </button>
              <div className="flex items-center gap-1 text-green-400">
                <Wifi className="w-3 h-3" />
                <span className="text-xs">Tempo Real</span>
              </div>
            </div>
          </CardTitle>
          {lastUpdate && (
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Última atualização: {lastUpdate}</span>
              <span className="text-green-400">{dataSource}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-slate-700/50 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-red-500/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Ganhadores dos Últimos Concursos
            </div>
            <div className="flex items-center gap-2 text-sm font-normal">
              <button
                onClick={forceUpdate}
                disabled={isUpdating}
                className="flex items-center gap-1 px-2 py-1 bg-green-600/20 hover:bg-green-600/40 rounded text-green-400 transition-all duration-200"
              >
                <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Atualizando...' : 'Atualizar'}
              </button>
              <div className="flex items-center gap-1 text-green-400">
                <Wifi className="w-3 h-3" />
                <span className="text-xs">Tempo Real</span>
              </div>
            </div>
          </CardTitle>
          {lastUpdate && (
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Última atualização: {lastUpdate}</span>
              <span className="text-green-400">{dataSource}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-300 mb-4">Erro ao carregar dados dos concursos</div>
            <button
              onClick={forceUpdate}
              disabled={isUpdating}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 rounded text-red-400 transition-all duration-200"
            >
              {isUpdating ? 'Carregando...' : 'Tentar Novamente'}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (Object.keys(contestData).length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Ganhadores dos Últimos Concursos
            </div>
            <div className="flex items-center gap-2 text-sm font-normal">
              <button
                onClick={forceUpdate}
                disabled={isUpdating}
                className="flex items-center gap-1 px-2 py-1 bg-green-600/20 hover:bg-green-600/40 rounded text-green-400 transition-all duration-200"
              >
                <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Atualizando...' : 'Atualizar'}
              </button>
              <div className="flex items-center gap-1 text-green-400">
                <Wifi className="w-3 h-3" />
                <span className="text-xs">Tempo Real</span>
              </div>
            </div>
          </CardTitle>
          {lastUpdate && (
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Última atualização: {lastUpdate}</span>
              <span className="text-green-400">{dataSource}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-4">Carregando dados dos concursos...</p>
            <p className="text-slate-500 text-sm mb-6">Buscando informações oficiais da Caixa Econômica Federal</p>
            <button
              onClick={forceUpdate}
              disabled={isUpdating}
              className="px-6 py-3 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-400 transition-all duration-200 font-medium"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Carregar Dados
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Ganhadores dos Últimos Concursos
          </div>
          <div className="flex items-center gap-2 text-sm font-normal">
            <button
              onClick={forceUpdate}
              disabled={isUpdating}
              className="flex items-center gap-1 px-2 py-1 bg-green-600/20 hover:bg-green-600/40 rounded text-green-400 transition-all duration-200"
            >
              <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Atualizando...' : 'Atualizar'}
            </button>
            <div className="flex items-center gap-1 text-green-400">
              <Wifi className="w-3 h-3" />
              <span className="text-xs">Tempo Real</span>
            </div>
          </div>
        </CardTitle>
        {lastUpdate && (
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Última atualização: {lastUpdate}</span>
            <span className="text-green-400">{dataSource}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(contestData).map(([key, contest]) => {
            const lotteryName = contest.lottery || key;
            const contestNumber = contest.contest || 'N/A';
            const contestDate = contest.date || 'Data não disponível';
            const numbersToShow = contest.drawnNumbers || [];
            const isAccumulated = contest.accumulated === true || contest.accumulated === 'true';
            const nextEstimate = contest.nextEstimate || '';
            const winners = contest.winners || [];
            const totalPrize = contest.totalPrize || '';
            const nextDraw = contest.nextDraw || '';

            return (
              <div
                key={key}
                className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                {/* Header com nome da loteria e status */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-cyan-300">{lotteryName}</h3>
                  {isAccumulated && (
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                      Acumulou
                    </Badge>
                  )}
                </div>

                {/* Informações do concurso */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">Concurso {contestNumber}</span>
                    <span className="text-slate-400">• {contestDate}</span>
                  </div>

                  {totalPrize && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-green-300 font-semibold">Total: {totalPrize}</span>
                    </div>
                  )}

                  {nextDraw && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300">Próximo: {nextDraw}</span>
                    </div>
                  )}
                </div>

                {/* Números sorteados */}
                {numbersToShow && numbersToShow.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2">Números sorteados:</div>
                    <div className="flex flex-wrap gap-1">
                      {numbersToShow.map((number, index) => (
                        <span
                          key={index}
                          className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                        >
                          {String(number).padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ganhadores detalhados */}
                {winners && winners.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Ganhadores por faixa:
                    </div>
                    <div className="space-y-2">
                      {winners.map((winner, index) => (
                        <div key={index} className="bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-yellow-300">
                              {winner.hits} acertos
                            </span>
                            <span className="text-xs text-slate-400">
                              {winner.winnerCount} ganhador{winner.winnerCount !== 1 ? 'es' : ''}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-green-300">
                            {winner.prizeValue || 'Prêmio não divulgado'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Próximo prêmio estimado */}
                {nextEstimate && (
                  <div className="mt-4 pt-3 border-t border-slate-600/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Próximo concurso:</span>
                      <span className="text-sm font-bold text-cyan-300">{nextEstimate}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}