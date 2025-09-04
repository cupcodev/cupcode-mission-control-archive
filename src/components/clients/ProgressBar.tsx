import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar = ({ progress, className }: ProgressBarProps) => {
  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-primary';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('w-full bg-muted rounded-full h-2', className)}>
      <div
        className={cn(
          'h-2 rounded-full transition-all duration-500 ease-out',
          getProgressColor(progress)
        )}
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
    </div>
  );
};