import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LotteryCardProps {
  lottery: {
    id: number;
    name: string;
    minNumbers: number;
    maxNumbers: number;
    maxNumber: number;
  };
  upcomingDraw?: {
    prize: string;
    date: string;
  };
  onSelect: () => void;
}

export default function LotteryCard({ lottery, upcomingDraw, onSelect }: LotteryCardProps) {
  return (
    <Card 
      className="bg-card/15 border border-border rounded-xl glow-effect hover:scale-105 transition-transform cursor-pointer backdrop-blur-sm"
      onClick={onSelect}
      data-testid={`lottery-card-${lottery.name.toLowerCase()}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{lottery.name}</h3>
          <Badge className="premium-badge">PRO</Badge>
        </div>
        <p className="text-muted-foreground mb-4">
          {lottery.minNumbers}-{lottery.maxNumbers} números de 1 a {lottery.maxNumber}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-accent">
            {upcomingDraw?.prize || 'Carregando...'}
          </span>
          <span className="text-sm text-muted-foreground">
            Próximo: {upcomingDraw?.date || '--/--'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
