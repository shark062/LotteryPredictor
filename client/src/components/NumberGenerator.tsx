import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [numberCount, setNumberCount] = useState(15);
  const [preferences, setPreferences] = useState({
    useHot: true,
    useCold: false,
    useMixed: true,
  });
  const [generatedNumbers, setGeneratedNumbers] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

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
      const response = await apiRequest('POST', '/api/ai/predict', {
        lotteryId: selectedLottery,
        count: numberCount,
        preferences,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedNumbers(data.numbers);
      toast({
        title: "Jogo Gerado! 🎲",
        description: `${data.numbers.length} números foram gerados com IA`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar números",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveGameMutation = useMutation({
    mutationFn: async () => {
      if (generatedNumbers.length === 0) return;
      
      await apiRequest('POST', '/api/games', {
        lotteryId: selectedLottery,
        numbers: JSON.stringify(generatedNumbers),
        isPlayed: false,
      });
    },
    onSuccess: () => {
      setShowConfetti(true);
      toast({
        title: "Jogo Salvo! 🎉",
        description: "Seu jogo foi salvo com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar jogo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedLotteryData = lotteries?.find((l: any) => l.id === selectedLottery);

  const handleGenerate = () => {
    if (numberCount === 0) {
      setGeneratedNumbers([]);
      return;
    }
    
    if (!selectedLotteryData) return;
    
    if (numberCount > selectedLotteryData.maxNumbers) {
      toast({
        title: "Quantidade inválida",
        description: `Máximo de ${selectedLotteryData.maxNumbers} números para ${selectedLotteryData.name}`,
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Confetti show={showConfetti} />
      
      <Card className="bg-card/15 border border-border glow-effect backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🎲</span>
            <span>Gerador Inteligente</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                onChange={(e) => setNumberCount(parseInt(e.target.value) || 0)}
                placeholder="0-60"
                data-testid="input-number-count"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-hot"
                checked={preferences.useHot}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, useHot: !!checked }))
                }
                data-testid="checkbox-use-hot"
              />
              <Label htmlFor="use-hot" className="cursor-pointer">🔥 Números Quentes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-cold"
                checked={preferences.useCold}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, useCold: !!checked }))
                }
                data-testid="checkbox-use-cold"
              />
              <Label htmlFor="use-cold" className="cursor-pointer">🥶 Números Frios</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-mixed"
                checked={preferences.useMixed}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, useMixed: !!checked }))
                }
                data-testid="checkbox-use-mixed"
              />
              <Label htmlFor="use-mixed" className="cursor-pointer">🔮 Números Mistos</Label>
            </div>
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground py-3 rounded-lg font-semibold glow-effect hover:scale-105 transition-transform"
            data-testid="button-generate"
          >
            {generateMutation.isPending ? "Gerando..." : "Gerar Jogo Inteligente"}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Numbers */}
      {generatedNumbers.length > 0 && (
        <Card className="bg-card/15 border border-border glow-effect backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Jogo Gerado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3" data-testid="generated-numbers">
              {generatedNumbers.map((number) => (
                <NumberBall key={number} number={number} size="lg" />
              ))}
            </div>
            <div className="flex space-x-4">
              <Button 
                onClick={() => saveGameMutation.mutate()}
                disabled={saveGameMutation.isPending}
                className="bg-accent text-accent-foreground hover:scale-105 transition-transform"
                data-testid="button-save-game"
              >
                {saveGameMutation.isPending ? "Salvando..." : "Salvar Jogo"}
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
          <Card className="bg-card/15 border border-border glow-effect backdrop-blur-sm">
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

          <Card className="bg-card/15 border border-border glow-effect backdrop-blur-sm">
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

          <Card className="bg-card/15 border border-border glow-effect backdrop-blur-sm">
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
