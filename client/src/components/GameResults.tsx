import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NumberBall from "./NumberBall";
import { Skeleton } from "@/components/ui/skeleton";
import { Confetti } from "@/components/ui/confetti";
import { useState } from "react";

interface GameResultsProps {
  showDetailedAnalysis?: boolean;
}

export default function GameResults({ showDetailedAnalysis = false }: GameResultsProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { data: gameResults, isLoading } = useQuery({
    queryKey: ["/api/games/results"],
  });

  const { data: userGames } = useQuery({
    queryKey: ["/api/games"],
  });

  const { data: latestResults } = useQuery({
    queryKey: ["/api/lotteries/results"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card/30 border border-border">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Confetti show={showConfetti} />
      <Card className="bg-card/30 border border-border glow-effect backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🏆</span>
          <span>Resultados dos Jogos</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!userGames || userGames.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎲</div>
            <p className="text-muted-foreground">
              Nenhum jogo salvo encontrado. Comece gerando alguns jogos!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userGames.map((game: any, index: number) => {
              const userNumbers = JSON.parse(game.numbers);
              
              // Buscar números sorteados mais recentes para esta loteria
              const latestDraw = latestResults?.find((r: any) => r.lotteryId === game.lotteryId);
              const drawnNumbers = latestDraw ? JSON.parse(latestDraw.numbers) : [];
              const matchingNumbers = userNumbers.filter((num: number) => drawnNumbers.includes(num));
              const hits = matchingNumbers.length;
              
              // Se acertou muitos números, mostrar confetti
              if (hits >= 5 && !showConfetti) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
              }
              
              return (
                <Card key={game.id} className="bg-background/50 border border-border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">
                          Jogo #{index + 1}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(game.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {userNumbers.length} dezenas jogadas
                        </Badge>
                      </div>
                      <div className="text-right">
                        {drawnNumbers.length > 0 ? (
                          <>
                            <Badge variant={hits >= 3 ? "default" : "secondary"}>
                              {hits} acertos
                            </Badge>
                            {hits >= 3 && (
                              <p className="text-sm text-accent font-semibold mt-1">
                                {hits === 3 && "Terno - R$ 25,00"}
                                {hits === 4 && "Quadra - R$ 325,00"}
                                {hits === 5 && "Quina - R$ 8.500,00"}
                                {hits >= 6 && "🏆 SENA! 🏆"}
                              </p>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline">
                            Aguardando sorteio
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2">Seus números:</p>
                      <div className="flex flex-wrap gap-2" data-testid={`user-numbers-${game.id}`}>
                        {userNumbers.map((number: number) => {
                          const isWinning = drawnNumbers.length > 0 && matchingNumbers.includes(number);
                          return (
                            <NumberBall 
                              key={number} 
                              number={number} 
                              type={isWinning ? "winning" : "user"} 
                              size="sm"
                              isHighlighted={isWinning}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {drawnNumbers.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Números sorteados:</p>
                          <Badge variant="outline" className="text-xs">
                            {drawnNumbers.length} dezenas sorteadas
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {drawnNumbers.map((number: number) => (
                            <NumberBall 
                              key={number} 
                              number={number} 
                              type="winning" 
                              size="sm"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {hits > 0 && drawnNumbers.length > 0 && (
                      <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-semibold text-green-400">
                          🎯 Acertos: {matchingNumbers.join(', ')}
                        </p>
                        <div className="text-center mt-2">
                          <div className="text-2xl mb-1">🎉</div>
                          <p className="text-accent font-semibold text-sm">
                            Parabéns! Você acertou {hits} números!
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
