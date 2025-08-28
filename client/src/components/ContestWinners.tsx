
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Users, DollarSign, Calendar, Target } from 'lucide-react';

interface Winner {
  count: number;
  prize: string;
  accumulated?: string;
}

interface ContestData {
  lastContest: number;
  date: string;
  winners: { [key: string]: Winner };
}

interface ContestWinnersData {
  [lotteryName: string]: ContestData;
}

const ContestWinners: React.FC = () => {
  const { data: contestData, isLoading, error } = useQuery<ContestWinnersData>({
    queryKey: ['/api/lotteries/contest-winners'],
    staleTime: 30 * 60 * 1000, // Cache por 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Ganhadores dos Últimos Concursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-cyan-300">Carregando dados reais...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !contestData) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Ganhadores dos Últimos Concursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-300">Erro ao carregar dados dos concursos</div>
        </CardContent>
      </Card>
    );
  }

  const getPrizeIcon = (hits: string, lottery: string) => {
    const maxHits = {
      'Lotofácil': '15',
      'Mega-Sena': '6',
      'Quina': '5',
      'Lotomania': '20',
      'Timemania': '7',
      'Dupla-Sena': '6',
      'Dia de Sorte': '7',
      'Super Sete': '7',
      'Lotofácil-Independência': '15'
    }[lottery];

    if (hits === maxHits) return '🎯';
    if (parseInt(hits) >= parseInt(maxHits || '0') - 1) return '⭐';
    return '🔸';
  };

  const getPrizeLabel = (hits: string, lottery: string) => {
    const labels: { [key: string]: { [key: string]: string } } = {
      'Lotofácil': { '15': '15 pontos', '14': '14 pontos', '13': '13 pontos', '12': '12 pontos', '11': '11 pontos' },
      'Mega-Sena': { '6': 'Sena (6 números)', '5': 'Quina (5 números)', '4': 'Quadra (4 números)' },
      'Quina': { '5': 'Quina (5 números)', '4': 'Quadra (4 números)', '3': 'Terno (3 números)' },
      'Lotomania': { '20': '20 números', '19': '19 números', '18': '18 números', '17': '17 números', '16': '16 números' },
      'Timemania': { '7': '7 números', '6': '6 números', '5': '5 números', '4': '4 números', '3': '3 números' },
      'Dupla-Sena': { '6': 'Sena (6 números)', '5': 'Quina (5 números)', '4': 'Quadra (4 números)', '3': 'Terno (3 números)' },
      'Dia de Sorte': { '7': '7 números', '6': '6 números', '5': '5 números', '4': '4 números' },
      'Super Sete': { '7': '7 colunas', '6': '6 colunas', '5': '5 colunas', '4': '4 colunas' },
      'Lotofácil-Independência': { '15': '15 pontos', '14': '14 pontos', '13': '13 pontos', '12': '12 pontos', '11': '11 pontos' }
    };

    return labels[lottery]?.[hits] || `${hits} números`;
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
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Ganhadores dos Últimos Concursos
        </CardTitle>
        <div className="text-sm text-slate-400 flex items-center gap-2">
          <Target className="w-4 h-4" />
          🎲 Simular Sorteio (Teste de Precisão)
        </div>
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
        
        <div className="text-center pt-4 border-t border-slate-700/50">
          <div className="text-sm text-slate-400 flex items-center justify-center gap-2">
            <Target className="w-4 h-4" />
            💡 Dados baseados nos últimos concursos realizados
          </div>
          <Badge variant="outline" className="mt-2 border-cyan-500/30 text-cyan-400">
            Dados Oficiais CEF
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContestWinners;
