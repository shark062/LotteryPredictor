import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface HeatMapProps {
  selectedLottery: number;
  onLotteryChange: (lotteryId: number) => void;
}

export default function HeatMap({ selectedLottery, onLotteryChange }: HeatMapProps) {
  const { data: lotteries } = useQuery({
    queryKey: ["/api/lotteries"],
  });

  const { data: frequencies, isLoading } = useQuery({
    queryKey: ["/api/lotteries", selectedLottery, "frequencies"],
    enabled: selectedLottery > 0,
  });

  const selectedLotteryData = Array.isArray(lotteries) ? lotteries.find((l: any) => l.id === selectedLottery) : null;

  const getHeatLevel = (frequency: number, maxFreq: number): number => {
    if (maxFreq === 0) return 0;
    const ratio = frequency / maxFreq;
    if (ratio === 1) return 5; // Máximo
    if (ratio >= 0.8) return 4; // Muito quente
    if (ratio >= 0.6) return 3; // Quente
    if (ratio >= 0.4) return 2; // Morno
    if (ratio >= 0.2) return 1; // Frio
    return 0; // Muito frio
  };

  // Garantir que frequencies seja um array válido e calcular frequência máxima
  const validFrequencies = Array.isArray(frequencies) ? frequencies : [];
  const maxFrequency = validFrequencies.length > 0 ? Math.max(...validFrequencies.map((f: any) => f.frequency || 0)) : 0;

  return (
    <Card className="bg-card/30 border border-border glow-effect backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>🗺️</span>
            <span>Mapa de Calor - Frequência dos Números</span>
          </div>
          <Select 
            value={selectedLottery === 0 ? "" : selectedLottery.toString()} 
            onValueChange={(value) => onLotteryChange(parseInt(value))}
          >
            <SelectTrigger className="w-48" data-testid="select-lottery-heatmap">
              <SelectValue placeholder="Selecione a modalidade" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(lotteries) ? lotteries.map((lottery: any) => (
                <SelectItem key={lottery.id} value={lottery.id.toString()}>
                  {lottery.name} (1-{lottery.maxNumber})
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 60 }, (_, i) => (
              <Skeleton key={i} className="w-10 h-10 rounded" />
            ))}
          </div>
        ) : (
          <>
            {/* Heat Map Grid */}
            <div 
              className="grid gap-1" 
              style={{ 
                gridTemplateColumns: selectedLotteryData?.maxNumber <= 25 
                  ? 'repeat(5, minmax(0, 1fr))' 
                  : selectedLotteryData?.maxNumber <= 60 
                  ? 'repeat(10, minmax(0, 1fr))' 
                  : 'repeat(10, minmax(0, 1fr))'
              }}
              data-testid="heatmap-grid"
            >
              {Array.from({ length: selectedLotteryData?.maxNumber || 60 }, (_, i) => {
                const number = i + 1;
                const frequencyData = validFrequencies.find((f: any) => f.number === number);
                const frequency = frequencyData?.frequency || 0;
                const heatLevel = getHeatLevel(frequency, maxFrequency);
                
                return (
                  <div
                    key={number}
                    className={cn(
                      "w-10 h-10 rounded flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:scale-110 transition-transform",
                      `heat-${heatLevel}`
                    )}
                    title={`Número ${number} - Frequência: ${frequency}`}
                    data-testid={`heat-cell-${number}`}
                  >
                    {number.toString().padStart(2, '0')}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 heat-0 rounded"></div>
                <span>Muito Frio</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 heat-1 rounded"></div>
                <span>Frio</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 heat-2 rounded"></div>
                <span>Morno</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 heat-3 rounded"></div>
                <span>Quente</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 heat-4 rounded"></div>
                <span>Muito Quente</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 heat-5 rounded"></div>
                <span>Máximo</span>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {validFrequencies.filter((f: any) => (f.frequency || 0) >= maxFrequency * 0.7).length}
                </div>
                <p className="text-sm text-muted-foreground">Números Quentes</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {validFrequencies.filter((f: any) => (f.frequency || 0) <= maxFrequency * 0.3).length}
                </div>
                <p className="text-sm text-muted-foreground">Números Frios</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{maxFrequency}</div>
                <p className="text-sm text-muted-foreground">Maior Frequência</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
