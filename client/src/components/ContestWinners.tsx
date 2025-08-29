import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Users, DollarSign, Calendar, Target, RefreshCw, Wifi } from 'lucide-react';

interface Winner {
  count: number;
  prize: string;
  accumulated?: string;
}

interface ContestData {
  lastContest: number;
  date: string;
  winners: { [key: string]: Winner };
  accumulated?: string;
}

interface ContestWinnersData {
  [lotteryName: string]: ContestData;
}

const ContestWinners: React.FC = () => {
  const [contestData, setContestData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('');
  const [errorCount, setErrorCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para buscar dados oficiais com debounce
  const fetchOfficialData = useCallback(async (showUpdating = false) => {
    if (isUpdating && !showUpdating) return; // Evitar requests simultâneos
    if (showUpdating) setIsUpdating(true);

    try {
      // Primeiro tentar buscar dados oficiais em tempo real
      const response = await fetch('/api/lotteries/official-results');

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Converter dados oficiais para formato do frontend
          const formattedData: any = {};

          Object.entries(result.data).forEach(([lotteryName, lotteryData]: [string, any]) => {
            formattedData[lotteryName] = {
              lastContest: lotteryData.contest,
              date: lotteryData.date,
              winners: lotteryData.winners,
              accumulated: lotteryData.accumulated
            };
          });

          setContestData(formattedData);
          setDataSource(result.source || 'Caixa Econômica Federal');
          setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
          const lotteryCount = Object.keys(result.data || {}).length;
          console.log(`✅ Dados oficiais da Caixa carregados - ${lotteryCount} loterias atualizadas`);
          return;
        }
      }

      // Fallback para dados de contest-winners se a API oficial falhar
      const fallbackResponse = await fetch('/api/lotteries/contest-winners');
      const fallbackData = await fallbackResponse.json();

      if (fallbackData.success) {
        setContestData(fallbackData.data);
        setDataSource(fallbackData.source);
      } else {
        setContestData(fallbackData);
        setDataSource('Dados Fallback');
      }

      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));

    } catch (error) {
      console.error('Erro ao buscar dados oficiais:', error);
      setErrorCount(prev => prev + 1);

      // Circuit breaker: parar tentativas se muitos erros
      if (errorCount < 3) {
        try {
          const fallbackResponse = await fetch('/api/lotteries/contest-winners');
          const fallbackData = await fallbackResponse.json();
          setContestData(fallbackData.success ? fallbackData.data : fallbackData);
          setDataSource('Dados Fallback');
          setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
        } catch (fallbackError) {
          console.error('Erro também no fallback:', fallbackError);
        }
      } else {
        console.warn('Circuit breaker ativado - muitos erros consecutivos');
        // Parar auto-update temporariamente
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          setTimeout(() => {
            setErrorCount(0); // Reset após 2 minutos
            // Restart auto-update
            intervalRef.current = setInterval(() => {
              fetchOfficialData(false);
            }, 30000);
          }, 120000);
        }
      }
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, []);

  const forceUpdate = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch('/api/lotteries/update-official-data', {
        method: 'POST'
      });

      if (response.ok) {
        await fetchOfficialData(false);
        console.log('🔄 Atualização forçada concluída');
      }
    } catch (error) {
      console.error('Erro na atualização forçada:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    // Buscar dados inicial
    fetchOfficialData(true);

    // Configurar atualização automática a cada 30 segundos para reduzir carga
    intervalRef.current = setInterval(() => {
      fetchOfficialData(false);
    }, 30000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);


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
          <div className="text-cyan-300">Carregando dados reais...</div>
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
          <div className="text-red-300">Erro ao carregar dados dos concursos</div>
        </CardContent>
      </Card>
    );
  }

export default ContestWinners;t>
      </Card>
    );
  }

  const getPrizeIcon = (hits: string, lottery: string) => {
    const maxHits = {
      'Lotofácil': '15',
      'Mega-Sena': '6',
      'Quina': '5',
      'Lotomania': '50', // Lotomania has 50 numbers to guess from, but the prize is for matching a certain number of draws. The original code had 20, which is incorrect.
      'Timemania': '10', // Timemania has 10 numbers to choose from.
      'Dupla-Sena': '6',
      'Dia de Sorte': '7',
      'Super Sete': '7',
      'Lotofácil-Independência': '15'
    }[lottery];

    // Handle cases where maxHits might not be defined for a lottery
    if (!maxHits) return '🔸';

    const hitsInt = parseInt(hits);
    const maxHitsInt = parseInt(maxHits);

    if (isNaN(hitsInt) || isNaN(maxHitsInt)) return '🔸';

    if (hitsInt === maxHitsInt) return '🎯';
    // Adjusting logic for "near miss" prizes
    if (lottery === 'Lotofácil' && hitsInt >= 11) return '⭐';
    if (lottery === 'Mega-Sena' && hitsInt >= 4) return '⭐';
    if (lottery === 'Quina' && hitsInt >= 3) return '⭐';
    if (lottery === 'Lotomania' && hitsInt >= 16) return '⭐'; // Based on original structure
    if (lottery === 'Timemania' && hitsInt >= 3) return '⭐'; // Based on original structure
    if (lottery === 'Dupla-Sena' && hitsInt >= 3) return '⭐';
    if (lottery === 'Dia de Sorte' && hitsInt >= 4) return '⭐';
    if (lottery === 'Super Sete' && hitsInt >= 4) return '⭐';
    if (lottery === 'Lotofácil-Independência' && hitsInt >= 11) return '⭐';

    return '🔸';
  };

  const getPrizeLabel = (hits: string, lottery: string) => {
    const labels: { [key: string]: { [key: string]: string } } = {
      'Lotofácil': { '15': '15 pontos', '14': '14 pontos', '13': '13 pontos', '12': '12 pontos', '11': '11 pontos' },
      'Mega-Sena': { '6': 'Sena (6 números)', '5': 'Quina (5 números)', '4': 'Quadra (4 números)' },
      'Quina': { '5': 'Quina (5 números)', '4': 'Quadra (4 números)', '3': 'Terno (3 números)' },
      'Lotomania': { '50': '50 números', '49': '49 números', '48': '48 números', '47': '47 números', '46': '46 números', '45': '45 números', '44': '44 números', '43': '43 números', '42': '42 números', '41': '41 números', '40': '40 números', '39': '39 números', '38': '38 números', '37': '37 números', '36': '36 números', '35': '35 números', '34': '34 números', '33': '33 números', '32': '32 números', '31': '31 números', '30': '30 números', '29': '29 números', '28': '28 números', '27': '27 números', '26': '26 números', '25': '25 números', '24': '24 números', '23': '23 números', '22': '22 números', '21': '21 números', '20': '20 números', '19': '19 números', '18': '18 números', '17': '17 números', '16': '16 números' },
      'Timemania': { '10': '10 números', '9': '9 números', '8': '8 números', '7': '7 números', '6': '6 números', '5': '5 números', '4': '4 números', '3': '3 números' },
      'Dupla-Sena': { '6': 'Sena (6 números)', '5': 'Quina (5 números)', '4': 'Quadra (4 números)', '3': 'Terno (3 números)' },
      'Dia de Sorte': { '7': '7 números', '6': '6 números', '5': '5 números', '4': '4 números' },
      'Super Sete': { '7': '7 colunas', '6': '6 colunas', '5': '5 colunas', '4': '4 colunas' },
      'Lotofácil-Independência': { '15': '15 pontos', '14': '14 pontos', '13': '13 pontos', '12': '12 pontos', '11': '11 pontos' }
    };

    // Fallback for unexpected hit counts or lotteries
    if (labels[lottery] && labels[lottery][hits]) {
      return labels[lottery][hits];
    }

    // More generic fallback
    if (lottery === 'Lotomania' && parseInt(hits) >= 16) return `${hits} acertos`;
    if (lottery === 'Timemania' && parseInt(hits) >= 3) return `${hits} acertos`;
    if (lottery === 'Super Sete' && parseInt(hits) >= 4) return `${hits} colunas`;

    return `${hits} acertos`; // Default fallback
  };

  const getLotteryEmoji = (lottery: string) => {
    const emojis: { [key: string]: string } = {
      'Lotofácil': '🍀',
      'Mega-Sena': '💰',
      'Quina': '⭐',
      'Lotomania': '🎲',
      'Timemania': '⚽',
      'Dupla-Sena': '🎭',
      'Dia de Sorte': '🌟',
      'Super Sete': '🎯',
      'Lotofácil-Independência': '🇧🇷'
    };
    return emojis[lottery] || '🎲';
  };

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
      <CardContent className="space-y-6">
        {Object.entries(contestData).map(([lotteryName, data]) => (
          <div key={lotteryName} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {getLotteryEmoji(lotteryName)}
                {lotteryName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar className="w-4 h-4" />
                Concurso {data.lastContest} - {data.date}
              </div>
            </div>

            <div className="grid gap-2">
              {Object.entries(data.winners)
                .filter(([_, winner]) => winner.count > 0 || winner.accumulated)
                .slice(0, 3) // Mostrar apenas os 3 primeiros prêmios principais
                .map(([hits, winner]) => (
                <div
                  key={hits}
                  className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getPrizeIcon(hits, lotteryName)}</span>
                    <div>
                      <div className="text-white font-medium">
                        {getPrizeLabel(hits, lotteryName)}
                      </div>
                      {winner.accumulated && (
                        <div className="text-sm text-yellow-400">
                          Acumulou: {winner.accumulated}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-cyan-400 font-bold">
                        {winner.count.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {!winner.accumulated && winner.count > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">{winner.prize}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 pt-4 border-t border-slate-700/50 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
            💡 Dados Oficiais CEF - Atualizados em Tempo Real
          </p>
          <p className="text-xs text-green-400 mt-1">
            🔄 Atualização automática a cada 10 segundos
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContestWinners;