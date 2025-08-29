import { useState, useEffect, useMemo, useCallback, memo } from "react";
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
// CDN utils removidos para corrigir travamento

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
  const [progress, setProgress] = useState(0); // Estado para a barra de progresso
  const [confidenceScore, setConfidenceScore] = useState(0); // Estado para o score de confiança
  const [analysis, setAnalysis] = useState<any>(null); // Estado para a análise


  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lotteries } = useQuery({
    queryKey: ["/api/lotteries"],
  });

  const { data: analysisData } = useQuery({
    queryKey: ["/api/lotteries", selectedLottery, "analysis"],
    enabled: !!selectedLottery,
  });

  // Atualiza o estado de análise com os dados do query
  useEffect(() => {
    setAnalysis(analysisData);
  }, [analysisData]);


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
      if (!generatedNumbers || generatedNumbers.length === 0) {
        throw new Error("Nenhum jogo para salvar");
      }

      if (!selectedLotteryData) {
        throw new Error("Modalidade de loteria não selecionada");
      }

      const savedGames = [];

      // Salvar cada jogo individualmente com melhor tratamento de erro
      for (let i = 0; i < generatedNumbers.length; i++) {
        const game = generatedNumbers[i];

        // Validações mais robustas
        if (!game || !Array.isArray(game) || game.length === 0) {
          throw new Error(`Jogo ${i + 1} inválido: números não encontrados ou formato incorreto`);
        }

        // Validar se todos os elementos são números válidos
        const validNumbers = game.filter(num =>
          typeof num === 'number' &&
          !isNaN(num) &&
          num >= 1 &&
          num <= selectedLotteryData.maxNumber
        );

        if (validNumbers.length !== game.length) {
          const invalidNumbers = game.filter(num =>
            typeof num !== 'number' ||
            isNaN(num) ||
            num < 1 ||
            num > selectedLotteryData.maxNumber
          );
          throw new Error(`Jogo ${i + 1} contém números inválidos: ${invalidNumbers.join(', ')}`);
        }

        // Verificar se a quantidade de números está correta
        if (validNumbers.length < selectedLotteryData.minNumbers || validNumbers.length > selectedLotteryData.maxNumbers) {
          throw new Error(`Jogo ${i + 1} deve ter entre ${selectedLotteryData.minNumbers} e ${selectedLotteryData.maxNumbers} números`);
        }

        try {
          // Garantir que os números estão ordenados e únicos
          const uniqueSortedNumbers = [...new Set(validNumbers)].sort((a, b) => a - b);

          const gameData = {
            lotteryId: selectedLottery,
            numbers: JSON.stringify(uniqueSortedNumbers),
            isPlayed: false,
            contestNumber: null
          };

          console.log(`Salvando jogo ${i + 1}:`, gameData);

          const response = await apiRequest('POST', '/api/games', gameData);

          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText || `Erro HTTP ${response.status}` };
            }
            throw new Error(errorData.message || `Erro ao salvar jogo ${i + 1}`);
          }

          const savedGame = await response.json();
          savedGames.push(savedGame);

          console.log(`✅ Jogo ${i + 1} salvo com sucesso:`, savedGame);

        } catch (saveError) {
          console.error(`❌ Erro ao salvar jogo ${i + 1}:`, saveError);
          throw new Error(`Falha ao salvar jogo ${i + 1}: ${saveError instanceof Error ? saveError.message : 'Erro desconhecido'}`);
        }
      }

      return savedGames;
    },
    onSuccess: (savedGames) => {
      setShowConfetti(true);
      toast({
        title: `${savedGames.length} Jogo${savedGames.length > 1 ? 's' : ''} Salvo${savedGames.length > 1 ? 's' : ''}! 🎉`,
        description: `Jogos de ${selectedLotteryData?.name} salvos com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });

      // Limpar números gerados após salvar com sucesso
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    },
    onError: (error: any) => {
      console.error("❌ Erro detalhado ao salvar:", error);
      toast({
        title: "Erro ao salvar jogos",
        description: error.message || "Ocorreu um erro desconhecido ao salvar os jogos",
        variant: "destructive",
      });
    },
  });

  const selectedLotteryData = lotteries?.find((l: any) => l.id === selectedLottery);

  const handleGenerate = useCallback(() => {
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

    if (games > 100) {
      toast({
        title: "Muitos jogos",
        description: "Máximo de 100 jogos por vez para evitar sobrecarga",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate();
  }, [numberCount, gameCount, selectedLotteryData, generateMutation, toast]);


  // Função de geração simplificada sem CDN
  const regenerateNumbers = useCallback(async () => {
    if (!selectedLotteryData) return;

    try {
      const response = await apiRequest('POST', '/api/ai/predict', {
        lotteryId: selectedLottery,
        count: parseInt(numberCount) || 0,
        preferences,
      });
      
      const result = await response.json();
      setGeneratedNumbers([result.numbers]);
      
      toast({
        title: "Números Gerados! 🎯",
        description: "Novos números gerados com sucesso",
      });

    } catch (error: any) {
      console.error('Erro ao gerar números:', error);
      toast({
        variant: "destructive",
        title: "Erro na Geração",
        description: error.message || "Falha ao gerar números. Tente novamente.",
      });
    }
  }, [selectedLotteryData, preferences, selectedLottery, numberCount]);


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
              <Label htmlFor="game-count">Quantidade de Jogos (1-100)</Label>
              <Input
                id="game-count"
                type="number"
                min="1"
                max="100"
                value={gameCount}
                onChange={(e) => setGameCount(e.target.value)}
                placeholder="1-100"
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


          </div>

          <Button
            onClick={handleGenerate} // Usando a função handleGenerate original
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
                onClick={regenerateNumbers}
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

      {/* Análise Unificada - sempre visível quando há análise */}
      {analysis && (
        <Card className="bg-card/30 border border-border glow-effect backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📊</span>
              <span>Análise Inteligente Unificada</span>
              <Badge variant="secondary" className="ml-auto">IA Avançada</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🔥</span>
                  <h3 className="font-semibold">Números Quentes</h3>
                  <Badge variant="destructive" className="text-xs">
                    {analysis.hot?.length || 0} números
                  </Badge>
                </div>
                <div className="grid grid-cols-5 gap-2" data-testid="hot-numbers">
                  {analysis?.hot?.slice(0, 10).map((number: number) => (
                    <NumberBall key={number} number={number} type="hot" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Alta frequência recente + padrões de sucesso
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🥶</span>
                  <h3 className="font-semibold">Números Frios</h3>
                  <Badge variant="secondary" className="text-xs">
                    {analysis.cold?.length || 0} números
                  </Badge>
                </div>
                <div className="grid grid-cols-5 gap-2" data-testid="cold-numbers">
                  {analysis?.cold?.slice(0, 10).map((number: number) => (
                    <NumberBall key={number} number={number} type="cold" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Baixa frequência recente + potencial de retorno
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🔮</span>
                  <h3 className="font-semibold">Números Equilibrados</h3>
                  <Badge variant="outline" className="text-xs">
                    {analysis.mixed?.length || 0} números
                  </Badge>
                </div>
                <div className="grid grid-cols-5 gap-2" data-testid="mixed-numbers">
                  {analysis?.mixed?.slice(0, 10).map((number: number) => (
                    <NumberBall key={number} number={number} type="mixed" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Frequência equilibrada + padrões mistos
                </p>
              </div>
            </div>

            <div className="bg-background/50 p-4 rounded-lg border border-border/50">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">🧠</span>
                <h4 className="font-semibold">Status da IA</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Estratégias:</span>
                  <p className="font-medium">6 Avançadas</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Anti-Repetição:</span>
                  <p className="font-medium text-green-600">✓ Ativa</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Análise:</span>
                  <p className="font-medium">200 Concursos</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Precisão:</span>
                  <p className="font-medium text-blue-600">85-98%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}