import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import logoUrl from '../assets/cyberpunk-shark.png';

interface FuturisticHeaderProps {}

export default function FuturisticHeader({}: FuturisticHeaderProps) {
  // Estados para controlar os dados dinâmicos
  const [precision, setPrecision] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Buscar status da IA
  const { data: aiStatus } = useQuery({
    queryKey: ["/api/ai/status"],
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  // Usar precisão real calculada pelo backend baseada em dados dos usuários
  useEffect(() => {
    if (aiStatus) {
      const avgAccuracy = Object.values(aiStatus).reduce((acc: number, val: any) => acc + val, 0) / Object.keys(aiStatus).length;
      setPrecision(Math.round(avgAccuracy * 10) / 10);
      setLastUpdate(new Date());
    }
  }, [aiStatus]);

  // Buscar dados das loterias para detectar novos sorteios
  const { data: upcomingDraws } = useQuery({
    queryKey: ["/api/lotteries/upcoming"],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 15000, // Cache por 15 segundos
  });

  // Atualizar precisão baseado apenas em dados reais da API
  useEffect(() => {
    if (aiStatus && typeof aiStatus === 'object') {
      const validValues = Object.values(aiStatus).filter((val): val is number =>
        typeof val === 'number' && !isNaN(val) && val > 0
      );

      if (validValues.length > 0) {
        const avgAccuracy = validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
        const realPrecision = Math.round(avgAccuracy * 10) / 10; // Uma casa decimal
        setPrecision(realPrecision);
        setLastUpdate(new Date());
      }
    }
  }, [aiStatus]);

  const formatPrecision = (value: number): string => value.toFixed(1);

  return (
    <header
      className="relative overflow-hidden py-2 border-b border-cyan-400/30 shadow-lg"
      style={{
        background: `
          linear-gradient(135deg, rgba(2, 6, 23, 0.95), rgba(8, 15, 30, 0.95)),
          url('${logoUrl}'),
          radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.08) 1px, transparent 1px),
          radial-gradient(circle at 75% 75%, rgba(255, 0, 150, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: 'cover, 60vh, 60px 60px, 60px 60px',
        backgroundPosition: 'center, center, 25% 25%, 75% 75%',
        backgroundRepeat: 'no-repeat, no-repeat, repeat, repeat',
        backgroundAttachment: 'local',
      }}
    >
      {/* Efeitos overlay otimizados */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Efeito de scan lines */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 170, 0.08) 2px, rgba(0, 255, 170, 0.08) 4px)',
            animation: 'scan-lines 3s linear infinite'
          }}
        />

        {/* Circuitos animados */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(0, 255, 170, 0.06) 1px, transparent 1px),
              linear-gradient(rgba(255, 0, 150, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            animation: 'circuit-flow 25s linear infinite'
          }}
        />

        {/* Glow holográfico suavizado */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent animate-pulse" />
      </div>

      <div className="relative container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo e Nome */}
          <div className="flex items-center space-x-4">
            {/* Ícone logo */}
            <div className="relative w-10 h-10 rounded-xl bg-black/60 border border-cyan-400/40 backdrop-blur-md flex items-center justify-center overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url('${logoUrl}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/15 to-purple-400/15 animate-pulse" />
            </div>

            {/* Nome dinâmico */}
            <div className="relative">
              <h1
                className="text-xl md:text-2xl font-black tracking-wider transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(45deg, #00ffaa 0%, #0088ff 25%, #aa00ff 50%, #ff0088 75%, #00ffaa 100%)',
                  backgroundSize: '400% 400%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'gradient-shift 4s ease-in-out infinite, text-glow 2s ease-in-out infinite alternate',
                  fontFamily: 'Orbitron, monospace',
                  textShadow: '0 0 20px rgba(0, 255, 170, 0.4)',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 255, 170, 0.2))'
                }}
              >
                SHARK LOTERIAS
              </h1>

              {/* Efeito de profundidade */}
              <h1
                className="absolute inset-0 text-xl md:text-2xl font-black tracking-wider opacity-20 blur-sm"
                style={{
                  background: 'linear-gradient(45deg, #ff00aa, #00aaff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Orbitron, monospace',
                  transform: 'translateX(2px) translateY(2px)'
                }}
              >
                SHARK LOTERIAS
              </h1>

              {/* Partículas flutuantes otimizadas */}
              <div className="absolute -inset-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-cyan-400/60 rounded-full"
                    style={{
                      left: `${20 + i * 20}%`,
                      top: `${10 + (i % 2) * 80}%`,
                      animation: `float ${2.5 + i * 0.5}s ease-in-out infinite ${i * 0.4}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Controles do header */}
          <div className="flex items-center space-x-3">
            {/* Precisão Dinâmica - Translúcido sem borrão */}
            <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-black/40 border border-cyan-400/30 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <span className="text-cyan-300/90 font-mono text-xs uppercase tracking-wider mb-1 font-semibold">Precisão</span>
                <div className="flex items-center space-x-2">
                  <span
                    className="text-2xl font-black font-mono tracking-tight"
                    style={{
                      color: precision >= 90
                        ? '#00ffaa'
                        : precision >= 80
                        ? '#00bbff'
                        : '#ffaa00',
                      textShadow: precision >= 90
                        ? '0 0 8px rgba(0, 255, 170, 0.4)'
                        : precision >= 80
                        ? '0 0 8px rgba(0, 187, 255, 0.4)'
                        : '0 0 8px rgba(255, 170, 0, 0.4)'
                    }}
                  >
                    {formatPrecision(precision)}%
                  </span>
                  <div className="w-1 h-1 bg-cyan-400/80 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent" />
              <div className="flex flex-col text-xs">
                <span className="text-cyan-300/70 font-mono text-[10px] font-medium">Última atualização:</span>
                <span className="text-cyan-200/60 font-mono text-[10px]">
                  {lastUpdate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Status IA */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-2 rounded-lg bg-black/40 border border-green-400/30 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400/80 rounded-full animate-pulse" />
              <span className="text-green-300/90 font-mono text-sm font-semibold">IA ATIVA</span>
            </div>

            {/* Premium badge */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-2 rounded-lg bg-black/40 border border-yellow-400/30 backdrop-blur-sm">
              <span className="text-yellow-300/90 font-mono text-sm font-semibold">💰 PREMIUM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Linha inferior cyberpunk */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
    </header>
  );
}