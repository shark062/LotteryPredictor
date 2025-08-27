import { cn } from "@/lib/utils";

interface NumberBallProps {
  number: number;
  type?: 'default' | 'hot' | 'cold' | 'mixed' | 'winning' | 'user';
  size?: 'sm' | 'md' | 'lg';
  isHighlighted?: boolean;
  className?: string;
}

export default function NumberBall({ 
  number, 
  type = 'default', 
  size = 'md',
  isHighlighted = false,
  className 
}: NumberBallProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const typeClasses = {
    default: 'lottery-ball',
    hot: 'hot-number',
    cold: 'cold-number', 
    mixed: 'mixed-number',
    winning: 'bg-green-500 text-white shadow-lg shadow-green-500/50',
    user: 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
  };

  return (
    <div 
      className={cn(
        'rounded-full flex items-center justify-center font-bold transition-all duration-300 hover:scale-110',
        sizeClasses[size],
        typeClasses[type],
        isHighlighted && 'ring-2 ring-accent ring-offset-2',
        className
      )}
      data-testid={`number-ball-${number}`}
    >
      {number.toString().padStart(2, '0')}
    </div>
  );
}
