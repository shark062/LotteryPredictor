import { useEffect, useState } from 'react';

interface ConfettiProps {
  show: boolean;
  duration?: number;
}

export function Confetti({ show, duration = 3000 }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; color: string; left: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        color: ['#00BFFF', '#FF0096', '#FFD700', '#FF6B6B', '#4ECDC4'][i % 5],
        left: Math.random() * 100,
        delay: Math.random() * 1000,
      }));
      setParticles(newParticles);

      const timeout = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [show, duration]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="confetti-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            backgroundColor: particle.color,
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
