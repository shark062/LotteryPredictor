import React, { useEffect, useRef } from 'react';

interface FuturisticHeaderProps {
  onLogout: () => void;
}

export default function FuturisticHeader({ onLogout }: FuturisticHeaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let frame = 0;

    const drawCyberpunkBackground = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, width, height);

      // Fundo cyberpunk gradiente
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, 'rgba(0, 10, 30, 0.95)');
      bgGradient.addColorStop(0.3, 'rgba(10, 0, 25, 0.9)');
      bgGradient.addColorStop(0.7, 'rgba(15, 5, 35, 0.9)');
      bgGradient.addColorStop(1, 'rgba(5, 15, 40, 0.95)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Circuitos animados no fundo
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const offset = Math.sin(frame * 0.02 + i * 0.6) * 15;
        ctx.beginPath();
        ctx.moveTo(i * (width / 12), 0);
        ctx.lineTo(i * (width / 12) + offset, height);
        ctx.stroke();
      }

      // Linhas horizontais de circuito
      ctx.strokeStyle = 'rgba(255, 0, 150, 0.15)';
      for (let i = 0; i < 6; i++) {
        const offset = Math.cos(frame * 0.015 + i * 0.8) * 8;
        ctx.beginPath();
        ctx.moveTo(0, i * (height / 6) + offset);
        ctx.lineTo(width, i * (height / 6) + offset);
        ctx.stroke();
      }

      // Efeito de matriz digital
      ctx.fillStyle = 'rgba(0, 255, 170, 0.1)';
      for (let i = 0; i < 20; i++) {
        const x = (i * width / 20) + Math.sin(frame * 0.01 + i) * 5;
        const y = ((frame * 2 + i * 10) % height);
        ctx.fillRect(x, y, 2, 8);
      }

      frame++;
    };

    const animate = () => {
      drawCyberpunkBackground();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 border-b-4 border-cyan-400 shadow-2xl shadow-cyan-500/30">
      {/* Canvas de fundo cyberpunk */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-60"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Efeitos de fundo adicionais */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(0, 255, 170, 0.2) 2px, transparent 2px),
              radial-gradient(circle at 80% 80%, rgba(255, 0, 150, 0.2) 2px, transparent 2px),
              linear-gradient(45deg, rgba(0, 255, 170, 0.1) 1px, transparent 1px),
              linear-gradient(-45deg, rgba(255, 0, 150, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px, 100px 100px, 40px 40px, 40px 40px',
            animation: 'ultra-circuit-flow 30s linear infinite'
          }}
        />

        {/* Streams de dados */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 bg-gradient-to-b from-transparent via-green-400 to-transparent opacity-25"
              style={{
                left: `${i * 12.5}%`,
                height: '100%',
                animation: `data-stream ${3 + i * 0.4}s linear infinite`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative container mx-auto px-6 py-6">
        {/* Logo Centralizada */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            {/* Container principal da logo */}
            <div className="relative p-8 rounded-2xl border-2 border-cyan-400/50 bg-black/70 backdrop-blur-md shadow-2xl shadow-cyan-500/30">
              {/* Efeito de glow interno */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-pink-400/10 rounded-2xl animate-pulse" />

              {/* Logo SHARK LOTERIAS */}
              <div className="relative text-center">
                <h1 
                  className="text-6xl md:text-7xl font-black tracking-wider transform transition-all duration-300 hover:scale-105 mb-2"
                  style={{
                    background: 'linear-gradient(45deg, #00ffaa 0%, #0088ff 20%, #aa00ff 40%, #ff0088 60%, #ffaa00 80%, #00ffaa 100%)',
                    backgroundSize: '600% 600%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'ultra-gradient-shift 5s ease-in-out infinite, text-4d-glow 4s ease-in-out infinite alternate',
                    fontFamily: '"Orbitron", monospace',
                    textShadow: '0 0 40px rgba(0, 255, 170, 0.8)',
                    transform: 'perspective(1000px) rotateX(15deg)',
                    filter: 'drop-shadow(0 10px 20px rgba(0, 255, 170, 0.3))'
                  }}
                >
                  SHARK
                </h1>

                <h2 
                  className="text-4xl md:text-5xl font-bold tracking-widest"
                  style={{
                    background: 'linear-gradient(45deg, #ff0088 0%, #aa00ff 25%, #0088ff 50%, #00ffaa 75%, #ff0088 100%)',
                    backgroundSize: '400% 400%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'ultra-gradient-shift 4s ease-in-out infinite reverse',
                    fontFamily: '"Orbitron", monospace',
                    textShadow: '0 0 30px rgba(255, 0, 136, 0.6)',
                    transform: 'perspective(1000px) rotateX(10deg)',
                    filter: 'drop-shadow(0 8px 16px rgba(255, 0, 136, 0.2))'
                  }}
                >
                  LOTERIAS
                </h2>
              </div>

              {/* Efeito de profundidade 4D */}
              <div 
                className="absolute inset-0 text-center opacity-15 pointer-events-none"
                style={{
                  transform: 'perspective(1000px) rotateX(15deg) translateZ(-20px) translateX(3px) translateY(3px)',
                  filter: 'blur(1px)'
                }}
              >
                <h1 className="text-6xl md:text-7xl font-black tracking-wider text-cyan-400 mb-2" style={{ fontFamily: '"Orbitron", monospace' }}>
                  SHARK
                </h1>
                <h2 className="text-4xl md:text-5xl font-bold tracking-widest text-purple-400" style={{ fontFamily: '"Orbitron", monospace' }}>
                  LOTERIAS
                </h2>
              </div>

              {/* Brackets decorativos */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-l-4 border-t-4 border-cyan-400 opacity-80" />
              <div className="absolute -top-4 -right-4 w-8 h-8 border-r-4 border-t-4 border-purple-400 opacity-80" />
              <div className="absolute -bottom-4 -left-4 w-8 h-8 border-l-4 border-b-4 border-purple-400 opacity-80" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-4 border-b-4 border-pink-400 opacity-80" />
            </div>
          </div>
        </div>

        {/* Barra de controles */}
        <div className="flex items-center justify-between">
          {/* Status à esquerda */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-black/60 border border-green-400/50 backdrop-blur-md shadow-lg shadow-green-400/10">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-md shadow-green-400/50" />
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-20" />
              </div>
              <span className="text-green-400 font-mono text-xs tracking-wide font-bold">SISTEMA ATIVO</span>
            </div>

            <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-black/60 border border-purple-400/50 backdrop-blur-md shadow-lg shadow-purple-400/10">
              <span className="text-purple-400 font-mono text-xs font-bold">🧠 IA ULTRA</span>
              <div className="flex space-x-1">
                <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          </div>

          {/* Controles à direita */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-black/60 border border-cyan-400/50 backdrop-blur-md shadow-lg shadow-cyan-400/10">
              <span className="text-cyan-400 font-mono text-xs font-bold">💰 PREMIUM</span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
            </div>

            <button
              onClick={onLogout}
              className="relative px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg border border-red-500/60 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/20 backdrop-blur-md"
              style={{
                fontFamily: '"Orbitron", monospace',
                fontSize: '0.75rem'
              }}
            >
              <span className="relative z-10">DESCONECTAR</span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-red-600/10 rounded-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Efeitos da base */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse" />

      {/* Linhas de scan */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 170, 0.1) 2px, rgba(0, 255, 170, 0.1) 4px)',
            animation: 'scan-lines 3s linear infinite'
          }}
        />
      </div>
    </header>
  );
}