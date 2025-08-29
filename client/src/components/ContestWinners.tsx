
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Wifi, RefreshCw, Users, Calendar, TrendingUp, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface ContestData {
  [key: string]: {
    lottery?: string;
    contest?: number;
    date?: string;
    winners?: number | string;
    prize?: string;
    numbers?: number[];
    accumulated?: boolean | string;
    drawnNumbers?: number[];
    contestNumber?: number;
  };
}

export default function ContestWinners() {
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('Caixa Oficial');
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
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: 3000,
    refetchOnWindowFocus: false,
  });

  const contestData = apiResponse?.data || {};

  // Função para forçar atualização
  const forceUpdate = async () => {
    setIsUpdating(true);
    try {
      await refetch();
      setLastUpdate(new Date().toLocaleString('pt-BR'));
      setDataSource('Caixa Oficial');
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-700/50 rounded-lg"></div>
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
          <div className="text-red-300">Erro ao carregar dados dos concursos</div>
        </CardContent>
      </Card>
    );
  }

  if (Object.keys(contestData).length === 0) {
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
            <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum dado de concurso disponível</p>
            <button
              onClick={forceUpdate}
              disabled={isUpdating}
              className="mt-4 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 rounded text-blue-400 transition-all duration-200"
            >
              {isUpdating ? 'Carregando...' : 'Tentar Carregar'}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(contestData).map(([key, contest]) => {
            const lotteryName = contest.lottery || key;
            const contestNumber = contest.contest || contest.contestNumber || 'N/A';
            const contestDate = contest.date || 'Data não disponível';
            const numbersToShow = contest.numbers || contest.drawnNumbers || [];
            const isAccumulated = contest.accumulated === true || contest.accumulated === 'true';
            
            // Extrair informações dos ganhadores se disponível
            let winnersInfo = 'Dados não disponíveis';
            let prizeInfo = contest.prize || 'Prêmio não disponível';
            
            if (typeof contest.winners === 'number') {
              winnersInfo = `${contest.winners} ganhador(es)`;
            } else if (typeof contest.winners === 'string') {
              winnersInfo = contest.winners;
            }

            return (
              <div
                key={key}
                className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 border border-slate-600/50 hover:border-cyan-400/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-cyan-300">{lotteryName}</h3>
                  {isAccumulated && (
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                      Acumulou
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">Concurso {contestNumber}</span>
                    <span className="text-slate-400">• {contestDate}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-green-300">{winnersInfo}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-300 font-semibold">{prizeInfo}</span>
                  </div>
                  
                  {numbersToShow && numbersToShow.length > 0 && (
                    <div className="mt-3">
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
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
