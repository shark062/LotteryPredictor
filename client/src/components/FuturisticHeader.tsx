import React from 'react';
import logoUrl from '../assets/cyberpunk-shark.png';

interface FuturisticHeaderProps {
  onLogout: () => void;
}

export default function FuturisticHeader({ onLogout }: FuturisticHeaderProps) {
  return (
    <header 
      className="relative overflow-hidden py-4 border-b border-cyan-400/30 shadow-lg"
      style={{
        background: `
          url('${logoUrl}'),
          radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.1) 1px, transparent 1px),
          radial-gradient(circle at 75% 75%, rgba(255, 0, 150, 0.1) 1px, transparent 1px),
          linear-gradient(135deg, rgba(2, 6, 23, 0.95), rgba(8, 15, 30, 0.95))
        `,
        backgroundSize: '50vh, 50px 50px, 50px 50px, cover',
        backgroundPosition: 'center, 25% 25%, 75% 75%, center',
        backgroundRepeat: 'no-repeat, repeat, repeat, no-repeat',
        backgroundAttachment: 'fixed, local, local, local'
      }}
    >
      {/* Efeitos overlay */}
      <div className="absolute inset-0">
        {/* Efeito de scan lines */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 170, 0.1) 2px, rgba(0, 255, 170, 0.1) 4px)',
            animation: 'scan-lines 2s linear infinite'
          }}
        />
        
        {/* Circuitos animados */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(0, 255, 170, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(255, 0, 150, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
            animation: 'circuit-flow 20s linear infinite'
          }}
        />
        
        {/* Glow holográfico */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-pulse" />
      </div>

      <div className="relative container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo e Nome */}
          <div className="flex items-center space-x-4">
            {/* Ícone logo */}
            <div className="relative w-12 h-12 rounded-xl bg-black/60 border border-cyan-400/40 backdrop-blur-md flex items-center justify-center overflow-hidden">
              <div 
                className="w-full h-full bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url('${logoUrl}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 animate-pulse" />
            </div>
            
            {/* Nome dinâmico */}
            <div className="relative">
              <h1 
                className="text-3xl md:text-4xl font-black tracking-wider transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(45deg, #00ffaa 0%, #0088ff 25%, #aa00ff 50%, #ff0088 75%, #00ffaa 100%)',
                  backgroundSize: '400% 400%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'gradient-shift 4s ease-in-out infinite, text-glow 2s ease-in-out infinite alternate',
                  fontFamily: 'Orbitron, monospace',
                  textShadow: '0 0 20px rgba(0, 255, 170, 0.6)',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 255, 170, 0.3))'
                }}
              >
                SHARK LOTERIAS
              </h1>
              
              {/* Efeito de profundidade */}
              <h1 
                className="absolute inset-0 text-3xl md:text-4xl font-black tracking-wider opacity-30 blur-sm"
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
              
              {/* Partículas flutuantes */}
              <div className="absolute -inset-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${10 + (i % 2) * 80}%`,
                      animation: `float ${2 + i * 0.5}s ease-in-out infinite`,
                      animationDelay: `${i * 0.3}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Controles do header */}
          <div className="flex items-center space-x-4">
            {/* Status IA */}
            <div className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg bg-black/50 border border-green-400/40 backdrop-blur-md">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-mono text-sm font-semibold">IA ATIVA</span>
            </div>

            {/* Premium badge */}
            <div className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg bg-black/50 border border-yellow-400/40 backdrop-blur-md">
              <span className="text-yellow-400 font-mono text-sm font-semibold">💰 PREMIUM</span>
            </div>

            {/* Botão logout */}
            <button
              onClick={onLogout}
              className="group relative px-6 py-2 bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg border border-red-500/40 transition-all duration-300 transform hover:scale-105 backdrop-blur-md"
              style={{
                fontFamily: 'Orbitron, monospace',
                textShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
              }}
            >
              <span className="relative z-10">SAIR</span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-600/20 group-hover:opacity-80 transition-opacity duration-300 rounded-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Linha inferior cyberpunk */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
    </header>
  );
}