
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

    canvas.width = 800;
    canvas.height = 120;

    let frame = 0;

    const drawShark = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Gradient background with circuit patterns
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, 'rgba(0, 20, 40, 0.9)');
      bgGradient.addColorStop(0.5, 'rgba(15, 0, 30, 0.8)');
      bgGradient.addColorStop(1, 'rgba(0, 15, 25, 0.9)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Circuit board lines
      ctx.strokeStyle = 'rgba(0, 255, 150, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 80, 0);
        ctx.lineTo(i * 80 + Math.sin(frame * 0.02) * 10, canvas.height);
        ctx.stroke();
      }

      // Main shark silhouette
      ctx.save();
      ctx.translate(80, 60);
      ctx.scale(0.8, 0.8);

      // Shark body gradient
      const sharkGradient = ctx.createLinearGradient(-60, -30, 60, 30);
      sharkGradient.addColorStop(0, '#00ffaa');
      sharkGradient.addColorStop(0.3, '#0088ff');
      sharkGradient.addColorStop(0.7, '#0044aa');
      sharkGradient.addColorStop(1, '#002244');

      // Shark body
      ctx.beginPath();
      ctx.moveTo(-80, 0);
      ctx.quadraticCurveTo(-60, -25, -20, -30);
      ctx.quadraticCurveTo(20, -35, 70, -20);
      ctx.quadraticCurveTo(90, -10, 100, 0);
      ctx.quadraticCurveTo(90, 10, 70, 20);
      ctx.quadraticCurveTo(20, 35, -20, 30);
      ctx.quadraticCurveTo(-60, 25, -80, 0);
      ctx.closePath();
      
      ctx.fillStyle = sharkGradient;
      ctx.fill();

      // Neon glow effect
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 20;
      ctx.stroke();

      // Eye with glowing effect
      ctx.beginPath();
      ctx.arc(-45, -8, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.fill();

      // Teeth
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(-65 + i * 8, 8);
        ctx.lineTo(-62 + i * 8, 18);
        ctx.lineTo(-59 + i * 8, 8);
        ctx.closePath();
        ctx.fill();
      }

      // Fins with animation
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur = 10;
      
      // Dorsal fin
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.quadraticCurveTo(10 + Math.sin(frame * 0.1) * 3, -50, 20, -30);
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(100, 0);
      ctx.quadraticCurveTo(120 + Math.sin(frame * 0.08) * 5, -15, 130, 0);
      ctx.quadraticCurveTo(120 + Math.sin(frame * 0.08) * 5, 15, 100, 0);
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b-2 border-cyan-500">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse"></div>
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(0, 255, 150, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(0, 255, 150, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            animation: 'circuit-flow 20s linear infinite'
          }}
        ></div>
      </div>

      <div className="relative container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo section with animated shark */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <canvas 
                ref={canvasRef}
                className="w-48 h-16 rounded-lg border border-cyan-500/30 bg-black/50 backdrop-blur-sm"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-pulse rounded-lg"></div>
            </div>
            
            <div className="relative">
              <h1 
                className="text-5xl font-black tracking-wider transform hover:scale-105 transition-transform duration-300"
                style={{
                  background: 'linear-gradient(45deg, #00ffaa, #0088ff, #aa00ff, #ff0088)',
                  backgroundSize: '400% 400%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'gradient-shift 3s ease-in-out infinite, text-glow 2s ease-in-out infinite alternate',
                  fontFamily: 'Orbitron, monospace',
                  textShadow: '0 0 30px rgba(0, 255, 170, 0.5)'
                }}
              >
                SHARK LOTO
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-25 animate-pulse"></div>
            </div>
          </div>

          {/* Control panel */}
          <div className="flex items-center space-x-4">
            {/* Status indicator */}
            <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-black/40 border border-green-500/50 backdrop-blur-sm">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-green-400 font-mono text-sm tracking-wide">SISTEMA ATIVO</span>
            </div>

            {/* AI Status */}
            <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-black/40 border border-purple-500/50 backdrop-blur-sm">
              <span className="text-purple-400 font-mono text-sm">🧠 IA LEARNING</span>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold rounded-lg border border-red-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 backdrop-blur-sm"
              style={{
                fontFamily: 'Orbitron, monospace',
                textShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
              }}
            >
              SAIR
            </button>
          </div>
        </div>
      </div>

      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
    </header>
  );
}
