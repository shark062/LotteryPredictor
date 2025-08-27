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
    enabled: !!selectedLottery,
  });

  const selectedLotteryData = lotteries?.find((l: any) => l.id === selectedLottery);

  const getHeatLevel = (frequency: number, maxFreq: number): number => {
    if (maxFreq === 0) return 0;
    const ratio = frequency / maxFreq;
    return Math.min(5, Math.floor(ratio * 6));
  };

  const maxFrequency = frequencies ? Math.max(...frequencies.map((f: any) => f.frequency)) : 0;

  return (
    <Card className="bg-card/30 border border-border glow-effect">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>🗺️</span>
            <span>Mapa de Calor - Frequência dos Números</span>
          </div>
          <Select 
            value={selectedLottery.toString()} 
            onValueChange={(value) => onLotteryChange(parseInt(value))}
          >
            <SelectTrigger className="w-48" data-testid="select-lottery-heatmap">
              <SelectValue placeholder="Selecione a modalidade" />
            </SelectTrigger>
            <SelectContent>
              {lotteries?.map((lottery: any) => (
                <SelectItem key={lottery.id} value={lottery.id.toString()}>
                  {lottery.name} (1-{lottery.maxNumber})
                </SelectItem>
              ))}
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
                gridTemplateColumns: `repeat(${Math.min(10, Math.ceil(Math.sqrt(selectedLotteryData?.maxNumber || 60)))}, minmax(0, 1fr))` 
              }}
              data-testid="heatmap-grid"
            >
              {Array.from({ length: selectedLotteryData?.maxNumber || 60 }, (_, i) => {
                const number = i + 1;
                const frequency = frequencies?.find((f: any) => f.number === number)?.frequency || 0;
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
            <div className="flex items-center justify-center space-x-6 text-sm">
              <span className="text-muted-foreground">Frequência:</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 heat-0 rounded"></div>
                <span>Baixa</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 heat-2 rounded"></div>
                <span>Média</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 heat-5 rounded"></div>
                <span>Alta</span>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {frequencies?.filter((f: any) => f.frequency >= maxFrequency * 0.7).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Números Quentes</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {frequencies?.filter((f: any) => f.frequency <= maxFrequency * 0.3).length || 0}
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
