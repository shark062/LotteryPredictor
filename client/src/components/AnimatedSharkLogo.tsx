
import React, { useEffect, useRef } from 'react';

interface Shark {
  x: number;
  y: number;
  speed: number;
  scale: number;
  color: string;
  direction: number;
}

export default function AnimatedSharkLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const sharksRef = useRef<Shark[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    const textElement = textRef.current;
    if (!canvas || !textElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 120;

    // Initialize sharks
    const colors = ["#00f0ff", "#ff00ff", "#00ff88"];
    sharksRef.current = [];
    
    for (let i = 0; i < 3; i++) {
      sharksRef.current.push({
        x: Math.random() > 0.5 ? -100 : canvas.width + 100,
        y: 30 + i * 30,
        speed: 1.5 + Math.random() * 1.5,
        scale: 0.4 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        direction: Math.random() > 0.5 ? 1 : -1
      });
    }

    const drawShark = (shark: Shark) => {
      ctx.save();
      ctx.translate(shark.x, shark.y);
      ctx.scale(shark.scale * shark.direction, shark.scale);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(60, -10);
      ctx.lineTo(75, 0);
      ctx.lineTo(60, 10);
      ctx.closePath();
      ctx.fillStyle = shark.color;
      ctx.shadowColor = shark.color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.restore();
    };

    const updateShark = (shark: Shark) => {
      shark.x += shark.speed * shark.direction;
      if (shark.direction === 1 && shark.x > canvas.width + 100) {
        shark.x = -100;
      }
      if (shark.direction === -1 && shark.x < -100) {
        shark.x = canvas.width + 100;
      }
      drawShark(shark);
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sharksRef.current.forEach(updateShark);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Glitch effect on text
    const glitchInterval = setInterval(() => {
      if (textElement) {
        textElement.style.transform = `skew(${Math.random() * 10 - 5}deg)`;
        setTimeout(() => {
          textElement.style.transform = "skew(0deg)";
        }, 100);
      }
    }, 3000);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(glitchInterval);
    };
  }, []);

  return (
    <div className="relative w-80 h-20 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />
      <div
        ref={textRef}
        className="absolute inset-0 flex items-center justify-center text-2xl font-black text-center transition-transform duration-100"
        style={{
          color: '#00f0ff',
          textShadow: '0 0 20px #0ff, 0 0 40px #0ff',
          fontFamily: 'Orbitron, monospace'
        }}
      >
        SHARK<br />LOTO
      </div>
    </div>
  );
}
