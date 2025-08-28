import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LotteryCardProps {
  lottery: {
    id: number;
    name: string;
    minNumbers: number;
    maxNumbers: number;
    maxNumber: number;
    slug: string;
    description?: string;
    nextDrawDate?: string;
    estimatedPrize?: string;
    lastResult?: number[];
  };
  onSelect: () => void;
  index?: number;
}

export default function LotteryCard({ lottery, onSelect, index = 0 }: LotteryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Fetch data for upcoming draws
  const [upcomingData, setUpcomingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar dados dos próximos concursos
  useEffect(() => {
    const fetchUpcomingData = async () => {
      try {
        const response = await fetch('/api/lotteries/upcoming', {
          headers: { 'Cache-Control': 'max-age=30' }
        });

        if (response.ok) {
          const data = await response.json();
          setUpcomingData(data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados dos próximos concursos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingData();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUpcomingData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Animation for scaled entry
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 150);

    return () => clearTimeout(timer);
  }, [index]);

  const getLotteryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'mega-sena': return '💰';
      case 'lotofácil': return '🍀';
      case 'lotofácil-independência': return '🇧🇷';
      case 'quina': return '⭐';
      case 'lotomania': return '🎯';
      case 'timemania': return '⚽';
      case 'dupla-sena': return '🎲';
      case 'dia de sorte': return '🌟';
      case 'super sete': return '🔥';
      default: return '🎰';
    }
  };

  const formatPrize = (prize: string | undefined) => {
    if (!prize) return "A definir";
    return prize;
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "Data a definir";
    try {
      // Melhor formatação de data
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return date;

      return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  };

  // Get specific data for the current lottery
  const getCurrentLotteryData = () => {
    if (!upcomingData) return null;

    // Map lottery names
    const nameMapping: { [key: string]: string } = {
      'mega-sena': 'Mega-Sena',
      'lotofacil': 'Lotofácil',
      'quina': 'Quina',
      'lotomania': 'Lotomania',
      'timemania': 'Timemania',
      'dupla-sena': 'Dupla-Sena',
      'dia-de-sorte': 'Dia de Sorte',
      'super-sete': 'Super Sete'
    };

    const mappedName = nameMapping[lottery.slug] || lottery.name;
    return upcomingData[mappedName] || null;
  };

  const lotteryData = getCurrentLotteryData();


  return (
    <Card
      className={`
        group relative overflow-hidden cursor-pointer backdrop-blur-md
        transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${isHovered ? 'scale-105 shadow-2xl shadow-cyan-500/25' : 'scale-100'}
        bg-card/20
        border border-border/50 hover:border-cyan-400/50
        rounded-xl glow-effect
      `}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`lottery-card-${lottery.name.toLowerCase()}`}
    >
      {/* Animated glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute w-1 h-1 bg-cyan-400/60 rounded-full
              transition-all duration-1000
              ${isHovered ? 'opacity-100 animate-pulse' : 'opacity-30'}
            `}
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
              animationDelay: `${i * 200}ms`,
              transform: isHovered ? `translateY(-${i * 2}px)` : 'translateY(0)'
            }}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-2 right-2 z-20">
          <svg className="w-4 h-4 animate-spin text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 8.015v-4.704z"></path>
          </svg>
        </div>
      )}

      <CardContent className="relative z-10 p-6">
        {/* Header with animated icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`
                text-2xl transition-all duration-300
                ${isHovered ? 'scale-125 rotate-12' : 'scale-100 rotate-0'}
              `}
            >
              {getLotteryIcon(lottery.name)}
            </div>
            <h3
              className={`
                text-xl font-bold transition-all duration-300
                ${isHovered ? 'text-cyan-300' : 'text-foreground'}
              `}
            >
              {lottery.name}
            </h3>
          </div>
          <Badge
            className={`
              premium-badge transition-all duration-300
              ${isHovered ? 'scale-110 glow' : 'scale-100'}
            `}
          >
            PRO
          </Badge>
        </div>

        {/* Description with animation */}
        <p
          className={`
            text-muted-foreground mb-4 transition-all duration-300
            ${isHovered ? 'text-cyan-200/80' : ''}
          `}
        >
          {lottery.description || "Concorra aos maiores prêmios!"}
        </p>

        {/* Draw information */}
        <div className="space-y-3">
          {/* Next draw date and contest number */}
          <div className="flex items-center justify-between">
            <span
              className={`
                text-xl font-bold text-accent transition-all duration-300
                ${isHovered ? 'scale-105 text-cyan-300' : 'scale-100'}
              `}
            >
              {lotteryData?.nextDrawDate ? formatDate(lotteryData.nextDrawDate) : formatDate(lottery.nextDrawDate)}
            </span>
            <span
              className={`
                text-sm font-semibold text-primary transition-all duration-300
                ${isHovered ? 'text-cyan-300' : ''}
              `}
            >
              {lotteryData?.contest ? (
                `Concurso: ${lotteryData.contest}`
              ) : (
                lottery.nextDrawDate ? (
                  `Concurso: ---`
                ) : (
                  <span className="text-cyan-400/60">---</span>
                )
              )}
            </span>
          </div>

          {/* Estimated prize - DESTACADO */}
          <div
            className={`
              p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-yellow-500/20 
              border border-green-500/30 mb-3
              transition-all duration-500 ease-out
              ${isHovered ? 'scale-105 shadow-lg shadow-green-500/25 bg-gradient-to-r from-green-500/30 to-yellow-500/30' : 'scale-100'}
            `}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-300 uppercase tracking-wider">
                Prêmio Estimado
              </span>
              {lotteryData?.accumulated && (
                <span className="text-orange-400 font-bold text-xs px-2 py-1 bg-orange-500/20 rounded-full animate-pulse">
                  💰 ACUMULOU
                </span>
              )}
            </div>
            <div 
              className={`
                text-2xl font-bold text-white mt-1 tracking-tight
                transition-all duration-300
                ${isHovered ? 'text-green-300 scale-105' : 'text-green-200'}
              `}
            >
              {lotteryData?.prize || formatPrize(lottery.estimatedPrize)}
            </div>
            <div className="text-xs text-green-400/80 mt-1">
              Próximo sorteio • {lotteryData?.nextDrawDate ? formatDate(lotteryData.nextDrawDate) : formatDate(lottery.nextDrawDate)}
            </div>
          </div>

          {/* Last result */}
          {(lotteryData?.lastResult || lottery.lastResult) && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                <svg className="w-4 h-4 mr-1 text-purple-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="8" r="5"></circle><path d="M22 20c0-1.1.9-2 2-2v0a2 2 0 0 0 0-4 2 2 0 0 0-2-2v0a2 2 0 0 0-2 2"></path></svg>
                Último Resultado
                {lotteryData?.lastContest && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    #{lotteryData.lastContest}
                  </Badge>
                )}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {(lotteryData?.lastResult || lottery.lastResult || []).map((number: number, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium"
                  >
                    {number.toString().padStart(2, '0')}
                  </span>
                ))}
              </div>
            </div>
          )}


          {/* Animated progress bar */}
          <div className="mt-4">
            <div className="w-full bg-muted/30 rounded-full h-1 overflow-hidden">
              <div
                className={`
                  h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full
                  transition-all duration-1000 ease-out
                  ${isHovered ? 'w-full' : 'w-0'}
                `}
              />
            </div>
          </div>
        </div>

        {/* Collaborative Learning Indicator */}
        <div className="mt-4 pt-3 border-t border-cyan-800/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              IA Colaborativa Ativa
            </div>
            <span className="text-cyan-300">
              Dados oficiais Caixa
            </span>
          </div>
        </div>
      </CardContent>

      {/* Cyberpunk corner effect */}
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/30 transition-all duration-300 group-hover:border-cyan-400" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/30 transition-all duration-300 group-hover:border-cyan-400" />

      {/* Connectivity Status */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 flex items-center gap-1">
        <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"></path><path d="M12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path><path d="M12 14h.01"></path></svg>
        <span>Dados oficiais CEF</span>
        <div className={`w-2 h-2 rounded-full ${!isLoading ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
        <span>{!isLoading ? 'Conectado' : 'Atualizando...'}</span>
      </div>
    </Card>
  );
}