
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

    canvas.width = 1200;
    canvas.height = 200;

    let frame = 0;

    const drawUltraRealisticShark = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Ultra dark cyberpunk background with depth
      const bgGradient = ctx.createRadialGradient(600, 100, 0, 600, 100, 600);
      bgGradient.addColorStop(0, 'rgba(5, 15, 25, 0.95)');
      bgGradient.addColorStop(0.3, 'rgba(10, 5, 20, 0.9)');
      bgGradient.addColorStop(0.6, 'rgba(0, 10, 30, 0.85)');
      bgGradient.addColorStop(1, 'rgba(0, 0, 15, 0.9)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Advanced circuit board patterns with depth
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const offset = Math.sin(frame * 0.01 + i * 0.5) * 15;
        ctx.beginPath();
        ctx.moveTo(i * 60, 0);
        ctx.lineTo(i * 60 + offset, canvas.height);
        ctx.stroke();
        
        // Horizontal circuit lines
        ctx.beginPath();
        ctx.moveTo(0, i * 10);
        ctx.lineTo(canvas.width, i * 10 + Math.sin(frame * 0.008 + i) * 5);
        ctx.stroke();
      }

      // Neon grid overlay
      ctx.strokeStyle = 'rgba(255, 0, 150, 0.2)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 40) {
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.strokeRect(x, y, 40, 40);
        }
      }

      // Ultra realistic shark with 3D depth
      ctx.save();
      ctx.translate(150, 100);
      ctx.scale(1.2, 1.2);

      // Advanced shark body gradient with metallic effect
      const sharkGradient = ctx.createLinearGradient(-100, -40, 100, 40);
      sharkGradient.addColorStop(0, '#00ffcc');
      sharkGradient.addColorStop(0.2, '#00ccff');
      sharkGradient.addColorStop(0.4, '#0099ff');
      sharkGradient.addColorStop(0.6, '#0066cc');
      sharkGradient.addColorStop(0.8, '#003399');
      sharkGradient.addColorStop(1, '#001166');

      // Main shark body with ultra realistic curves
      ctx.beginPath();
      ctx.moveTo(-120, 0);
      ctx.bezierCurveTo(-100, -35, -40, -45, 20, -40);
      ctx.bezierCurveTo(60, -38, 100, -25, 140, -15);
      ctx.bezierCurveTo(160, -8, 180, 0, 160, 8);
      ctx.bezierCurveTo(140, 15, 100, 25, 60, 38);
      ctx.bezierCurveTo(20, 40, -40, 45, -100, 35);
      ctx.bezierCurveTo(-110, 20, -120, 0, -120, 0);
      ctx.closePath();
      
      ctx.fillStyle = sharkGradient;
      ctx.fill();

      // Ultra realistic glow effect
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 30;
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Menacing eye with realistic depth
      const eyeGradient = ctx.createRadialGradient(-75, -15, 0, -75, -15, 12);
      eyeGradient.addColorStop(0, '#ff0000');
      eyeGradient.addColorStop(0.3, '#cc0000');
      eyeGradient.addColorStop(0.7, '#990000');
      eyeGradient.addColorStop(1, '#000000');
      
      ctx.beginPath();
      ctx.ellipse(-75, -15, 12, 15, 0, 0, Math.PI * 2);
      ctx.fillStyle = eyeGradient;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 25;
      ctx.fill();

      // Eye reflection for realism
      ctx.beginPath();
      ctx.ellipse(-70, -20, 4, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fill();

      // Razor sharp teeth with depth
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      for (let i = 0; i < 12; i++) {
        const toothX = -110 + i * 12;
        const toothHeight = 15 + Math.sin(i * 0.5) * 5;
        ctx.beginPath();
        ctx.moveTo(toothX, 12);
        ctx.lineTo(toothX + 3, 12 + toothHeight);
        ctx.lineTo(toothX + 6, 12);
        ctx.closePath();
        ctx.fill();
      }

      // Animated fins with realistic movement
      const finMovement = Math.sin(frame * 0.12) * 8;
      
      // Dorsal fin
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.moveTo(20, -40);
      ctx.bezierCurveTo(30 + finMovement, -70, 50 + finMovement, -65, 60, -40);
      ctx.stroke();

      // Tail with dynamic animation
      const tailMovement = Math.sin(frame * 0.15) * 12;
      ctx.beginPath();
      ctx.moveTo(160, 0);
      ctx.bezierCurveTo(180 + tailMovement, -25, 200 + tailMovement, -20, 220, 0);
      ctx.bezierCurveTo(200 + tailMovement, 20, 180 + tailMovement, 25, 160, 0);
      ctx.stroke();

      // Pectoral fins
      ctx.beginPath();
      ctx.moveTo(-20, 25);
      ctx.bezierCurveTo(-15, 45, 10, 50, 25, 30);
      ctx.stroke();

      ctx.restore();

      frame++;
    };

    const animate = () => {
      drawUltraRealisticShark();
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
    <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 border-b-4 border-cyan-400 shadow-2xl shadow-cyan-500/20">
      {/* Ultra advanced background effects */}
      <div className="absolute inset-0">
        {/* Animated circuit overlay */}
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
        
        {/* Holographic sweep effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse opacity-60" />
        
        {/* Data streams */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 bg-gradient-to-b from-transparent via-green-400 to-transparent opacity-30"
              style={{
                left: `${i * 12.5}%`,
                height: '100%',
                animation: `data-stream ${2 + i * 0.3}s linear infinite`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative container mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Ultra realistic shark logo section */}
          <div className="flex items-center space-x-8">
            <div className="relative group">
              <canvas 
                ref={canvasRef}
                className="w-80 h-24 rounded-xl border-2 border-cyan-400/40 bg-black/60 backdrop-blur-lg shadow-2xl shadow-cyan-500/30"
              />
              {/* Holographic overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-pulse rounded-xl" />
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400 rounded-br-xl" />
            </div>
            
            {/* 4D SHARK LOTO Title */}
            <div className="relative">
              <h1 
                className="text-7xl font-black tracking-wider transform transition-all duration-500 hover:scale-110 hover:rotate-y-12"
                style={{
                  background: 'linear-gradient(45deg, #00ffaa 0%, #0088ff 25%, #aa00ff 50%, #ff0088 75%, #00ffaa 100%)',
                  backgroundSize: '400% 400%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'ultra-gradient-shift 4s ease-in-out infinite, text-4d-glow 3s ease-in-out infinite alternate',
                  fontFamily: 'Orbitron, monospace',
                  textShadow: '0 0 40px rgba(0, 255, 170, 0.8), 0 20px 40px rgba(0, 255, 170, 0.4)',
                  transform: 'perspective(1000px) rotateX(15deg) rotateY(-5deg)',
                  filter: 'drop-shadow(0 10px 20px rgba(0, 255, 170, 0.3))'
                }}
              >
                SHARK LOTO
              </h1>
              
              {/* 4D depth layers */}
              <h1 
                className="absolute inset-0 text-7xl font-black tracking-wider opacity-30"
                style={{
                  background: 'linear-gradient(45deg, #ff00aa, #00aaff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Orbitron, monospace',
                  transform: 'perspective(1000px) rotateX(15deg) rotateY(-5deg) translateZ(-20px) translateX(3px) translateY(3px)',
                  filter: 'blur(1px)'
                }}
              >
                SHARK LOTO
              </h1>
              
              {/* Holographic frame */}
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-40 animate-pulse" />
              
              {/* Corner brackets for 4D effect */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-l-4 border-t-4 border-cyan-400 opacity-80" />
              <div className="absolute -top-4 -right-4 w-8 h-8 border-r-4 border-t-4 border-purple-400 opacity-80" />
              <div className="absolute -bottom-4 -left-4 w-8 h-8 border-l-4 border-b-4 border-purple-400 opacity-80" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-4 border-b-4 border-pink-400 opacity-80" />
            </div>
          </div>

          {/* Advanced control panel */}
          <div className="flex items-center space-x-6">
            {/* AI Status with enhanced design */}
            <div className="flex items-center space-x-4 px-6 py-3 rounded-xl bg-black/50 border border-green-400/60 backdrop-blur-xl shadow-2xl shadow-green-400/20">
              <div className="relative">
                <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-30" />
              </div>
              <span className="text-green-400 font-mono text-sm tracking-wide font-bold">SISTEMA ATIVO</span>
              <div className="w-px h-6 bg-green-400/30" />
              <span className="text-green-300 font-mono text-xs">ONLINE</span>
            </div>

            {/* Enhanced AI Learning Status */}
            <div className="flex items-center space-x-3 px-6 py-3 rounded-xl bg-black/50 border border-purple-400/60 backdrop-blur-xl shadow-2xl shadow-purple-400/20">
              <span className="text-purple-400 font-mono text-sm font-bold">🧠 IA ULTRA</span>
              <div className="flex space-x-1">
                <div className="w-1 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-1 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>

            {/* Market Overview Panel */}
            <div className="flex items-center space-x-3 px-6 py-3 rounded-xl bg-black/50 border border-cyan-400/60 backdrop-blur-xl shadow-2xl shadow-cyan-400/20">
              <span className="text-cyan-400 font-mono text-sm font-bold">💰 PREMIUM</span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
            </div>

            {/* Ultra futuristic logout button */}
            <button
              onClick={onLogout}
              className="group relative px-8 py-3 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white font-bold rounded-xl border-2 border-red-500/60 transition-all duration-500 transform hover:scale-110 hover:rotate-1 shadow-2xl shadow-red-500/30 backdrop-blur-xl overflow-hidden"
              style={{
                fontFamily: 'Orbitron, monospace',
                textShadow: '0 0 15px rgba(255, 0, 0, 0.8)'
              }}
            >
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-600/20 group-hover:opacity-80 transition-opacity duration-300" />
              
              {/* Button text */}
              <span className="relative z-10">DESCONECTAR</span>
              
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-red-300 opacity-60" />
              <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-red-300 opacity-60" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-red-300 opacity-60" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-red-300 opacity-60" />
            </button>
          </div>
        </div>
      </div>

      {/* Ultra advanced bottom effects */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse" />
      
      {/* Scan lines effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 170, 0.1) 2px, rgba(0, 255, 170, 0.1) 4px)',
            animation: 'scan-lines 2s linear infinite'
          }}
        />
      </div>
    </header>
  );
}
