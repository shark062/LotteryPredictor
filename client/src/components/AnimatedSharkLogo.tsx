
import React, { useEffect, useRef } from 'react';

interface Shark {
  x: number;
  y: number;
  speed: number;
  scale: number;
  rotation: number;
  rotationSpeed: number;
  direction: number;
  depth: number;
  tailOffset: number;
  finOffset: number;
}

export default function AnimatedSharkLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const sharksRef = useRef<Shark[]>([]);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const textElement = textRef.current;
    if (!canvas || !textElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for ultra wide realistic effect
    canvas.width = 600;
    canvas.height = 150;

    // Initialize realistic sharks with different species characteristics
    sharksRef.current = [
      {
        x: -150,
        y: 40,
        speed: 2.5,
        scale: 0.8,
        rotation: 0,
        rotationSpeed: 0.02,
        direction: 1,
        depth: 0.9,
        tailOffset: 0,
        finOffset: 0
      },
      {
        x: canvas.width + 100,
        y: 70,
        speed: 2.0,
        scale: 0.6,
        rotation: 0,
        rotationSpeed: -0.015,
        direction: -1,
        depth: 0.7,
        tailOffset: Math.PI / 3,
        finOffset: Math.PI / 2
      },
      {
        x: -200,
        y: 100,
        speed: 1.8,
        scale: 0.5,
        rotation: 0,
        rotationSpeed: 0.01,
        direction: 1,
        depth: 0.5,
        tailOffset: Math.PI,
        finOffset: Math.PI
      }
    ];

    const drawRealisticShark = (shark: Shark, time: number) => {
      ctx.save();
      ctx.translate(shark.x, shark.y);
      ctx.scale(shark.scale * shark.direction, shark.scale);
      ctx.rotate(Math.sin(time * 0.01 + shark.tailOffset) * 0.05);

      // Set realistic shark colors based on depth
      const baseColor = shark.depth > 0.7 ? '#2a5470' : shark.depth > 0.5 ? '#1e3a5f' : '#0f2a44';
      const highlightColor = shark.depth > 0.7 ? '#4a7690' : shark.depth > 0.5 ? '#3e5a7f' : '#2f4a64';
      
      // Create gradient for realistic shading
      const gradient = ctx.createLinearGradient(-60, -20, 60, 20);
      gradient.addColorStop(0, highlightColor);
      gradient.addColorStop(0.3, baseColor);
      gradient.addColorStop(0.7, baseColor);
      gradient.addColorStop(1, '#0a1f33');

      // Main body (realistic shark silhouette)
      ctx.beginPath();
      ctx.moveTo(-80, 0); // nose
      ctx.quadraticCurveTo(-60, -15, -20, -18); // top of head
      ctx.quadraticCurveTo(20, -20, 60, -15); // dorsal area
      ctx.quadraticCurveTo(80, -10, 90, 0); // tail start
      ctx.quadraticCurveTo(80, 10, 60, 15); // bottom tail area
      ctx.quadraticCurveTo(20, 20, -20, 18); // belly
      ctx.quadraticCurveTo(-60, 15, -80, 0); // bottom of head
      ctx.closePath();

      ctx.fillStyle = gradient;
      ctx.fill();

      // Add realistic tail fin with movement
      const tailMovement = Math.sin(time * 0.005 + shark.tailOffset) * 8;
      ctx.beginPath();
      ctx.moveTo(90, 0);
      ctx.quadraticCurveTo(110 + tailMovement, -25, 120 + tailMovement * 0.5, -30);
      ctx.quadraticCurveTo(125 + tailMovement * 0.3, 0, 120 + tailMovement * 0.5, 30);
      ctx.quadraticCurveTo(110 + tailMovement, 25, 90, 0);
      ctx.fillStyle = baseColor;
      ctx.fill();

      // Dorsal fin with subtle movement
      const dorsalMovement = Math.sin(time * 0.003 + shark.finOffset) * 2;
      ctx.beginPath();
      ctx.moveTo(10, -18);
      ctx.quadraticCurveTo(15 + dorsalMovement, -35, 25 + dorsalMovement, -30);
      ctx.quadraticCurveTo(35, -20, 30, -18);
      ctx.fillStyle = highlightColor;
      ctx.fill();

      // Pectoral fins
      ctx.beginPath();
      ctx.ellipse(-10, 12, 20, 8, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = baseColor;
      ctx.fill();

      // Eye (realistic and menacing)
      ctx.beginPath();
      ctx.ellipse(-45, -8, 6, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      
      // Eye reflection
      ctx.beginPath();
      ctx.ellipse(-43, -10, 2, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Gills (realistic detail)
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(-20 + i * 8, 10);
        ctx.quadraticCurveTo(-18 + i * 8, 15, -16 + i * 8, 12);
        ctx.strokeStyle = '#0a1f33';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Teeth/mouth line for intimidation factor
      ctx.beginPath();
      ctx.moveTo(-75, 5);
      ctx.quadraticCurveTo(-70, 8, -65, 5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    };

    const updateShark = (shark: Shark, time: number) => {
      shark.x += shark.speed * shark.direction;
      shark.rotation += shark.rotationSpeed;
      
      // Realistic swimming pattern with slight vertical movement
      shark.y += Math.sin(time * 0.002 + shark.tailOffset) * 0.5;
      
      // Reset position when shark goes off screen
      if (shark.direction === 1 && shark.x > canvas.width + 150) {
        shark.x = -150;
      }
      if (shark.direction === -1 && shark.x < -150) {
        shark.x = canvas.width + 150;
      }
      
      drawRealisticShark(shark, time);
    };

    const animate = () => {
      timeRef.current += 1;
      
      // Create underwater effect background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 50, 100, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 20, 60, 0.2)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add bubbles effect
      for (let i = 0; i < 8; i++) {
        const bubbleX = (timeRef.current * 0.5 + i * 80) % canvas.width;
        const bubbleY = 20 + Math.sin(timeRef.current * 0.01 + i) * 15;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, 2 + Math.sin(timeRef.current * 0.02 + i) * 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.fill();
      }

      // Update and draw sharks
      sharksRef.current.forEach(shark => updateShark(shark, timeRef.current));
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Enhanced glitch effect for cyberpunk feel
    const glitchInterval = setInterval(() => {
      if (textElement) {
        const glitchType = Math.random();
        if (glitchType < 0.3) {
          textElement.style.transform = `skew(${Math.random() * 10 - 5}deg) translateX(${Math.random() * 4 - 2}px)`;
          textElement.style.filter = 'hue-rotate(90deg)';
        } else if (glitchType < 0.6) {
          textElement.style.textShadow = '2px 0 #ff00ff, -2px 0 #00ffff, 0 0 20px #0ff';
        } else {
          textElement.style.transform = 'scaleX(1.05)';
        }
        
        setTimeout(() => {
          textElement.style.transform = "skew(0deg) translateX(0px) scaleX(1)";
          textElement.style.filter = 'none';
          textElement.style.textShadow = '0 0 20px #0ff, 0 0 40px #0ff, 0 0 60px #0ff';
        }, 150);
      }
    }, 2500);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(glitchInterval);
    };
  }, []);

  return (
    <div className="relative w-full max-w-2xl h-32 overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-b from-blue-950/20 to-blue-900/40 backdrop-blur-md">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />
      <div
        ref={textRef}
        className="absolute inset-0 flex items-center justify-center text-4xl font-black text-center transition-all duration-150 z-10"
        style={{
          color: '#00f0ff',
          textShadow: '0 0 20px #0ff, 0 0 40px #0ff, 0 0 60px #0ff',
          fontFamily: 'Orbitron, monospace',
          letterSpacing: '3px'
        }}
      >
        SHARK<br />LOTO
      </div>
      {/* Underwater lighting effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse opacity-50"></div>
      {/* Surface water effect */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-300/30 to-transparent animate-pulse"></div>
    </div>
  );
}
