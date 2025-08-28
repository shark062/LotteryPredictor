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
  };
  upcomingDraw?: {
    prize: string;
    date: string;
    contestNumber: number;
  };
  onSelect: () => void;
  index?: number;
}

export default function LotteryCard({ lottery, upcomingDraw, onSelect, index = 0 }: LotteryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animação de entrada escalonada
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

  const getLotteryGradient = (name: string) => {
    switch (name.toLowerCase()) {
      case 'mega-sena': return 'from-green-500/20 via-green-600/20 to-emerald-500/20';
      case 'lotofácil': return 'from-purple-500/20 via-purple-600/20 to-violet-500/20';
      case 'quina': return 'from-blue-500/20 via-blue-600/20 to-cyan-500/20';
      case 'lotomania': return 'from-red-500/20 via-red-600/20 to-pink-500/20';
      case 'timemania': return 'from-orange-500/20 via-orange-600/20 to-amber-500/20';
      case 'dupla-sena': return 'from-indigo-500/20 via-indigo-600/20 to-purple-500/20';
      case 'dia de sorte': return 'from-yellow-500/20 via-yellow-600/20 to-orange-500/20';
      case 'super sete': return 'from-teal-500/20 via-teal-600/20 to-cyan-500/20';
      default: return 'from-gray-500/20 via-gray-600/20 to-slate-500/20';
    }
  };

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
      {/* Efeito de brilho animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      {/* Partículas flutuantes */}
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

      <CardContent className="relative p-6 z-10">
        {/* Header com ícone animado */}
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

        {/* Descrição com animação */}
        <p
          className={`
            text-muted-foreground mb-4 transition-all duration-300
            ${isHovered ? 'text-cyan-200/80' : ''}
          `}
        >
          {lottery.minNumbers}-{lottery.maxNumbers} números de 1 a {lottery.maxNumber}
        </p>

        {/* Informações do sorteio */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span
              className={`
                text-2xl font-bold text-accent transition-all duration-300
                ${isHovered ? 'scale-105 text-cyan-300' : 'scale-100'}
              `}
            >
              {upcomingDraw?.prize || (
                <span className="text-lg text-muted-foreground animate-pulse">
                  Carregando...
                </span>
              )}
            </span>
            <span
              className={`
                text-sm font-semibold text-primary transition-all duration-300
                ${isHovered ? 'text-cyan-300' : ''}
              `}
            >
              Concurso: {upcomingDraw?.contestNumber || '---'}
            </span>
          </div>

          <div
            className={`
              text-sm text-muted-foreground transition-all duration-300
              ${isHovered ? 'text-cyan-200/70' : ''}
            `}
          >
            Próximo sorteio: {upcomingDraw?.date || '--/-- - --:--h'}
          </div>

          {/* Barra de progresso animada */}
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

        {/* Indicador de Aprendizado Colaborativo */}
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

      {/* Efeito de canto cyberpunk */}
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/30 transition-all duration-300 group-hover:border-cyan-400" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/30 transition-all duration-300 group-hover:border-cyan-400" />
    </Card>
  );
}