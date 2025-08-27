import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AILearningStatus() {
  const { data: aiStatus } = useQuery({
    queryKey: ["/api/ai/status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!aiStatus) {
    return (
      <Badge className="ai-learning flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span>IA Carregando</span>
      </Badge>
    );
  }

  const averageAccuracy = Math.round(
    (aiStatus.lotofacil + aiStatus.megasena + aiStatus.quina) / 3
  );

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge className="ai-learning flex items-center space-x-2" data-testid="ai-learning-status">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>IA Aprendendo {averageAccuracy}%</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-2">
          <p className="font-semibold">Precisão por Modalidade:</p>
          <p>Lotofácil: {aiStatus.lotofacil}%</p>
          <p>Mega-Sena: {aiStatus.megasena}%</p>
          <p>Quina: {aiStatus.quina}%</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
