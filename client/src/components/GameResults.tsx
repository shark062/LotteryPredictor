import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NumberBall from "./NumberBall";
import { Skeleton } from "@/components/ui/skeleton";

export default function GameResults() {
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
    <Card className="bg-card/30 border border-border glow-effect">
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
                        {userNumbers.map((number: number) => (
                          <NumberBall 
                            key={number} 
                            number={number} 
                            type="user" 
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>

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
  );
}
