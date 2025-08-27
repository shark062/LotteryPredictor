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

    // Definir dimensões do canvas
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let frame = 0;

    const drawShark = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, width, height);

      // Fundo cyberpunk
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, 'rgba(0, 10, 20, 0.9)');
      bgGradient.addColorStop(0.5, 'rgba(5, 0, 15, 0.8)');
      bgGradient.addColorStop(1, 'rgba(0, 5, 25, 0.9)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Circuitos animados
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const offset = Math.sin(frame * 0.02 + i * 0.8) * 10;
        ctx.beginPath();
        ctx.moveTo(i * (width / 10), 0);
        ctx.lineTo(i * (width / 10) + offset, height);
        ctx.stroke();
      }

      // Tubarão principal
      ctx.save();
      ctx.translate(width * 0.15, height * 0.5);

      // Corpo do tubarão com gradiente
      const sharkGradient = ctx.createLinearGradient(-60, -20, 80, 20);
      sharkGradient.addColorStop(0, '#00ffcc');
      sharkGradient.addColorStop(0.3, '#0099ff');
      sharkGradient.addColorStop(0.7, '#0066cc');
      sharkGradient.addColorStop(1, '#003399');

      ctx.beginPath();
      ctx.moveTo(-60, 0);
      ctx.bezierCurveTo(-50, -25, -20, -30, 20, -25);
      ctx.bezierCurveTo(50, -20, 80, -10, 90, 0);
      ctx.bezierCurveTo(80, 10, 50, 20, 20, 25);
      ctx.bezierCurveTo(-20, 30, -50, 25, -60, 0);
      ctx.closePath();

      ctx.fillStyle = sharkGradient;
      ctx.fill();

      // Glow effect
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Olho vermelho brilhante
      const eyeGradient = ctx.createRadialGradient(-35, -8, 0, -35, -8, 8);
      eyeGradient.addColorStop(0, '#ff0000');
      eyeGradient.addColorStop(0.5, '#cc0000');
      eyeGradient.addColorStop(1, '#660000');

      ctx.beginPath();
      ctx.arc(-35, -8, 8, 0, Math.PI * 2);
      ctx.fillStyle = eyeGradient;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.fill();

      // Reflexo no olho
      ctx.beginPath();
      ctx.arc(-32, -11, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 5;
      ctx.fill();

      // Dentes afiados
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5;
      for (let i = 0; i < 8; i++) {
        const toothX = -55 + i * 8;
        ctx.beginPath();
        ctx.moveTo(toothX, 8);
        ctx.lineTo(toothX + 2, 18);
        ctx.lineTo(toothX + 4, 8);
        ctx.closePath();
        ctx.fill();
      }

      // Barbatanas animadas
      const finMovement = Math.sin(frame * 0.1) * 5;

      // Barbatana dorsal
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(10, -25);
      ctx.bezierCurveTo(15 + finMovement, -45, 35 + finMovement, -40, 40, -25);
      ctx.stroke();

      // Cauda
      const tailMovement = Math.sin(frame * 0.12) * 8;
      ctx.beginPath();
      ctx.moveTo(90, 0);
      ctx.bezierCurveTo(110 + tailMovement, -15, 120 + tailMovement, -10, 130, 0);
      ctx.bezierCurveTo(120 + tailMovement, 10, 110 + tailMovement, 15, 90, 0);
      ctx.stroke();

      ctx.restore();
      frame++;
    };

    const animate = () => {
      drawShark();
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
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(0, 255, 170, 0.15) 2px, transparent 2px),
              radial-gradient(circle at 80% 80%, rgba(255, 0, 150, 0.15) 2px, transparent 2px),
              linear-gradient(90deg, rgba(0, 255, 170, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(255, 0, 150, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px, 80px 80px, 30px 30px, 30px 30px',
            animation: 'ultra-circuit-flow 25s linear infinite'
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-pulse" />

        {/* Data streams */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 bg-gradient-to-b from-transparent via-green-400 to-transparent opacity-20"
              style={{
                left: `${i * 16.66}%`,
                height: '100%',
                animation: `data-stream ${2 + i * 0.3}s linear infinite`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <canvas 
                ref={canvasRef}
                className="w-64 h-20 rounded-lg border-2 border-cyan-400/50 bg-black/70 backdrop-blur-sm shadow-xl shadow-cyan-500/20"
                style={{ width: '256px', height: '80px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent animate-pulse rounded-lg" />
            </div>

            {/* 4D SHARK LOTO Title */}
            <div className="relative">
              <h1 
                className="text-5xl md:text-6xl font-black tracking-wider transform transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(45deg, #00ffaa 0%, #0088ff 25%, #aa00ff 50%, #ff0088 75%, #00ffaa 100%)',
                  backgroundSize: '400% 400%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'ultra-gradient-shift 4s ease-in-out infinite, text-4d-glow 3s ease-in-out infinite alternate',
                  fontFamily: '"Orbitron", monospace',
                  textShadow: '0 0 30px rgba(0, 255, 170, 0.6)',
                  transform: 'perspective(800px) rotateX(10deg)',
                  filter: 'drop-shadow(0 8px 16px rgba(0, 255, 170, 0.2))'
                }}
              >
                SHARK LOTO
              </h1>

              {/* 4D depth layer */}
              <h1 
                className="absolute inset-0 text-5xl md:text-6xl font-black tracking-wider opacity-20"
                style={{
                  background: 'linear-gradient(45deg, #ff00aa, #00aaff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: '"Orbitron", monospace',
                  transform: 'perspective(800px) rotateX(10deg) translateZ(-15px) translateX(2px) translateY(2px)',
                  filter: 'blur(0.5px)'
                }}
              >
                SHARK LOTO
              </h1>

              {/* Corner brackets */}
              <div className="absolute -top-3 -left-3 w-6 h-6 border-l-3 border-t-3 border-cyan-400 opacity-60" />
              <div className="absolute -top-3 -right-3 w-6 h-6 border-r-3 border-t-3 border-purple-400 opacity-60" />
              <div className="absolute -bottom-3 -left-3 w-6 h-6 border-l-3 border-b-3 border-purple-400 opacity-60" />
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-r-3 border-b-3 border-pink-400 opacity-60" />
            </div>
          </div>

          {/* Control Panel */}
          <div className="flex items-center space-x-4">
            {/* AI Status */}
            <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-black/60 border border-green-400/50 backdrop-blur-md shadow-lg shadow-green-400/10">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-md shadow-green-400/50" />
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-20" />
              </div>
              <span className="text-green-400 font-mono text-xs tracking-wide font-bold">SISTEMA ATIVO</span>
            </div>

            {/* IA Ultra */}
            <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-black/60 border border-purple-400/50 backdrop-blur-md shadow-lg shadow-purple-400/10">
              <span className="text-purple-400 font-mono text-xs font-bold">🧠 IA ULTRA</span>
              <div className="flex space-x-1">
                <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>

            {/* Premium Status */}
            <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-black/60 border border-cyan-400/50 backdrop-blur-md shadow-lg shadow-cyan-400/10">
              <span className="text-cyan-400 font-mono text-xs font-bold">💰 PREMIUM</span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
            </div>

            {/* Logout Button */}
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

      {/* Bottom Effects */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse" />

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 170, 0.1) 2px, rgba(0, 255, 170, 0.1) 4px)',
            animation: 'scan-lines 2s linear infinite'
          }}
        />
      </div>
    </header>
  );
}