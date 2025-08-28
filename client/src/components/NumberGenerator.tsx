import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import NumberBall from "./NumberBall";
import { Confetti } from "@/components/ui/confetti";

interface NumberGeneratorProps {
  selectedLottery: number;
  onLotteryChange: (lotteryId: number) => void;
  showAnalysis?: boolean;
}

export default function NumberGenerator({
  selectedLottery,
  onLotteryChange,
  showAnalysis = false
}: NumberGeneratorProps) {
  const [numberCount, setNumberCount] = useState('');
  const [gameCount, setGameCount] = useState('1');
  const [preferences, setPreferences] = useState({
    useHot: false,
    useCold: false,
    useMixed: false,
  });
  const [generatedNumbers, setGeneratedNumbers] = useState<number[][]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lotteries } = useQuery({
    queryKey: ["/api/lotteries"],
  });

  const { data: analysis } = useQuery({
    queryKey: ["/api/lotteries", selectedLottery, "analysis"],
    enabled: !!selectedLottery,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const gamesCount = parseInt(gameCount) || 1;
      const numbersPerGame = parseInt(numberCount) || 0;

      if (numbersPerGame === 0) {
        setGeneratedNumbers([]);
        return { games: [], total: 0, numbersPerGame: 0 };
      }

      const allGames = [];
      for (let i = 0; i < gamesCount; i++) {
        const response = await apiRequest('POST', '/api/ai/predict', {
          lotteryId: selectedLottery,
          count: numbersPerGame,
          preferences,
        });
        const gameData = await response.json();
        allGames.push(gameData.numbers);
      }

      return { games: allGames, total: gamesCount, numbersPerGame };
    },
    onSuccess: (data) => {
      setGeneratedNumbers(data.games);
      if (data.total > 0) {
        toast({
          title: "Jogos Gerados! 🎲",
          description: `${data.total} jogo${data.total > 1 ? 's' : ''} com ${data.numbersPerGame} números cada`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar números",
        description: error.message || "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
      setGeneratedNumbers([]); // Limpa os números gerados em caso de erro
    },
  });

  const saveGameMutation = useMutation({
    mutationFn: async () => {
      if (generatedNumbers.length === 0) return;

      // Salvar cada jogo individualmente
      for (const game of generatedNumbers) {
        await apiRequest('POST', '/api/games', {
          lotteryId: selectedLottery,
          numbers: JSON.stringify(game),
          isPlayed: false,
        });
      }
    },
    onSuccess: () => {
      setShowConfetti(true);
      toast({
        title: `${generatedNumbers.length} Jogo${generatedNumbers.length > 1 ? 's' : ''} Salvo${generatedNumbers.length > 1 ? 's' : ''}! 🎉`,
        description: "Seus jogos foram salvos com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar jogo",
        description: error.message || "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const selectedLotteryData = lotteries?.find((l: any) => l.id === selectedLottery);

  const handleGenerate = () => {
    const count = parseInt(numberCount) || 0;
    const games = parseInt(gameCount) || 1;

    if (!selectedLotteryData) {
      toast({
        title: "Seleção inválida",
        description: "Por favor, selecione uma modalidade de loteria primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (count === 0 || numberCount === '') {
      setGeneratedNumbers([]);
      toast({
        title: "Aviso",
        description: "Por favor, insira a quantidade de dezenas para gerar os jogos.",
        variant: "default",
      });
      return;
    }

    if (count > selectedLotteryData.maxNumbers) {
      toast({
        title: "Quantidade inválida",
        description: `Máximo de ${selectedLotteryData.maxNumbers} números para ${selectedLotteryData.name}`,
        variant: "destructive",
      });
      return;
    }

    if (games > 10) {
      toast({
        title: "Muitos jogos",
        description: "Máximo de 10 jogos por vez",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Confetti show={showConfetti} />

      <Card className="bg-card/30 border border-border glow-effect backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🎲</span>
            <span>Gerador Inteligente</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="lottery-select">Modalidade</Label>
              <Select
                value={selectedLottery.toString()}
                onValueChange={(value) => onLotteryChange(parseInt(value))}
              >
                <SelectTrigger data-testid="select-lottery-generator">
                  <SelectValue placeholder="Selecione a modalidade" />
                </SelectTrigger>
                <SelectContent>
                  {lotteries?.map((lottery: any) => (
                    <SelectItem key={lottery.id} value={lottery.id.toString()}>
                      {lottery.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="number-count">Quantidade de Dezenas (0-{selectedLotteryData?.maxNumbers || 60})</Label>
              <Input
                id="number-count"
                type="number"
                min="0"
                max={selectedLotteryData?.maxNumbers || 60}
                value={numberCount}
                onChange={(e) => setNumberCount(e.target.value)}
                placeholder="0-60"
                data-testid="input-number-count"
                disabled={!selectedLotteryData}
              />
            </div>
            <div>
              <Label htmlFor="game-count">Quantidade de Jogos (1-10)</Label>
              <Input
                id="game-count"
                type="number"
                min="1"
                max="10"
                value={gameCount}
                onChange={(e) => setGameCount(e.target.value)}
                placeholder="1-10"
                data-testid="input-game-count"
                disabled={!selectedLotteryData}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg border">
              <p className="mb-2 font-medium">Estratégias de Seleção:</p>
              <p>Escolha como a IA deve selecionar seus números baseado em análise estatística dos concursos passados.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <Checkbox
                  id="use-hot"
                  checked={preferences.useHot}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, useHot: !!checked }))
                  }
                  data-testid="checkbox-use-hot"
                  disabled={!selectedLotteryData}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="use-hot" className="cursor-pointer text-sm font-medium">🔥 Números Quentes</Label>
                  <p className="text-xs text-muted-foreground mt-1">Prioriza números que saíram com mais frequência recentemente</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <Checkbox
                  id="use-cold"
                  checked={preferences.useCold}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, useCold: !!checked }))
                  }
                  data-testid="checkbox-use-cold"
                  disabled={!selectedLotteryData}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="use-cold" className="cursor-pointer text-sm font-medium">🥶 Números Frios</Label>
                  <p className="text-xs text-muted-foreground mt-1">Foca em números que não saem há muito tempo</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <Checkbox
                  id="use-mixed"
                  checked={preferences.useMixed}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, useMixed: !!checked }))
                  }
                  data-testid="checkbox-use-mixed"
                  disabled={!selectedLotteryData}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="use-mixed" className="cursor-pointer text-sm font-medium">🔮 Números Mistos</Label>
                  <p className="text-xs text-muted-foreground mt-1">Combina estratégias balanceando quentes e frios</p>
                </div>
              </div>
            </div>
            
            {!preferences.useHot && !preferences.useCold && !preferences.useMixed && (
              <div className="text-sm text-amber-600 bg-amber-50/50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="font-medium mb-1">🎲 Modo Aleatório Ativado</p>
                <p>Como nenhuma estratégia foi selecionada, a IA gerará números de forma totalmente aleatória.</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !selectedLotteryData || numberCount === ''}
            className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground py-3 rounded-lg font-semibold glow-effect hover:scale-105 transition-transform"
            data-testid="button-generate"
          >
            {generateMutation.isPending ? "Gerando..." : "Gerar Jogo Inteligente"}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Numbers */}
      {generatedNumbers.length > 0 && (
        <Card className="bg-card/30 border border-border glow-effect backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Jogos Gerados</span>
              <Badge variant="secondary" data-testid="generated-count">
                {generatedNumbers.length} jogo{generatedNumbers.length > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {generatedNumbers.map((game, gameIndex) => (
                <div key={gameIndex} className="p-4 border border-border rounded-lg bg-background/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Jogo {gameIndex + 1}</h4>
                    <Badge variant="outline" className="text-xs">
                      {game.length} números
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3" data-testid={`generated-numbers-${gameIndex}`}>
                    {game.map((number: number, numberIndex: number) => (
                      <NumberBall key={numberIndex} number={number} size="lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => saveGameMutation.mutate()}
                disabled={saveGameMutation.isPending || generatedNumbers.length === 0}
                className="bg-accent text-accent-foreground hover:scale-105 transition-transform"
                data-testid="button-save-game"
              >
                {saveGameMutation.isPending ? "Salvando..." : `Salvar ${generatedNumbers.length} Jogo${generatedNumbers.length > 1 ? 's' : ''}`}
              </Button>
              <Button
                onClick={handleGenerate}
                variant="secondary"
                className="hover:scale-105 transition-transform"
                data-testid="button-regenerate"
              >
                Gerar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Number Analysis */}
      {(showAnalysis || analysis) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-card/30 border border-border glow-effect backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔥</span>
                <span>Números Quentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 mb-4" data-testid="hot-numbers">
                {analysis?.hot?.slice(0, 10).map((number: number) => (
                  <NumberBall key={number} number={number} type="hot" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Números que mais saíram nos últimos 20 concursos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border border-border glow-effect backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🥶</span>
                <span>Números Frios</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 mb-4" data-testid="cold-numbers">
                {analysis?.cold?.slice(0, 10).map((number: number) => (
                  <NumberBall key={number} number={number} type="cold" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Números que menos saíram nos últimos 20 concursos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border border-border glow-effect backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔮</span>
                <span>Números Mistos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 mb-4" data-testid="mixed-numbers">
                {analysis?.mixed?.slice(0, 10).map((number: number) => (
                  <NumberBall key={number} number={number} type="mixed" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Números com frequência equilibrada
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}