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
        {!gameResults || gameResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎲</div>
            <p className="text-muted-foreground">
              Nenhum resultado encontrado. Comece gerando alguns jogos!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {gameResults.map((result: any, index: number) => {
              const userGame = userGames?.find((g: any) => g.id === result.userGameId);
              const userNumbers = userGame ? JSON.parse(userGame.numbers) : [];
              
              // Simular números sorteados para demonstração
              const drawnNumbers = [3, 7, 12, 18, 25, 31]; // Exemplo de números sorteados
              const matchingNumbers = userNumbers.filter((num: number) => drawnNumbers.includes(num));
              
              // Se acertou todos os números, mostrar confetti
              if (result.hits === userNumbers.length && result.hits >= 5 && !showConfetti) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
              }
              
              return (
                <Card key={result.id} className="bg-background/50 border border-border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">
                          Jogo #{index + 1}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={result.hits >= 3 ? "default" : "secondary"}>
                          {result.hits} acertos
                        </Badge>
                        {result.prizeValue > 0 && (
                          <p className="text-sm text-accent font-semibold">
                            Prêmio: R$ {parseFloat(result.prizeValue).toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2 
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2">Seus números:</p>
                      <div className="flex flex-wrap gap-2" data-testid={`user-numbers-${result.id}`}>
                        {userNumbers.map((number: number) => {
                          const isWinning = matchingNumbers.includes(number);
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

                    {showDetailedAnalysis && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-2">Números sorteados:</p>
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

                    {result.hits > 0 && (
                      <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-semibold text-green-400">
                          🎯 Acertos: {matchingNumbers.join(', ')}
                        </p>
                        <p className="text-xs text-green-300 mt-1">
                          {result.hits === 3 && "Terno - R$ 25,00"}
                          {result.hits === 4 && "Quadra - R$ 325,00"}
                          {result.hits === 5 && "Quina - R$ 8.500,00"}
                          {result.hits >= 6 && "🏆 SENA! - GRANDE PRÊMIO! 🏆"}
                        </p>
                      </div>
                    )}

                    {result.hits > 0 && (
                      <div className="text-center mt-4">
                        <div className="text-2xl mb-2">🎉</div>
                        <p className="text-accent font-semibold">
                          Parabéns! Você acertou {result.hits} números!
                        </p>
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
