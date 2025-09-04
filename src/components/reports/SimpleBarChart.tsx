import { cn } from '@/lib/utils';

interface DataPoint {
  label: string;
  value: number;
  blocked?: number;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  height?: number;
  horizontal?: boolean;
  className?: string;
  onBarClick?: (point: DataPoint, index: number) => void;
}

export const SimpleBarChart = ({ 
  data, 
  height = 200, 
  horizontal = false,
  className,
  onBarClick 
}: SimpleBarChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const padding = 10;

  if (horizontal) {
    return (
      <div className={cn('w-full space-y-2', className)} style={{ height }}>
        {data.map((point, index) => {
          const barWidth = (point.value / maxValue) * 80; // 80% max width
          const blockedWidth = point.blocked ? (point.blocked / point.value) * barWidth : 0;
          
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="w-24 text-xs text-muted-foreground text-right truncate">
                {point.label}
              </div>
              <div className="flex-1 relative">
                <div
                  className={cn(
                    'h-6 bg-primary/20 rounded relative cursor-pointer transition-all',
                    'hover:bg-primary/30',
                    onBarClick && 'focus:ring-2 focus:ring-ring focus:outline-none'
                  )}
                  style={{ width: `${barWidth}%` }}
                  role={onBarClick ? "button" : undefined}
                  tabIndex={onBarClick ? 0 : undefined}
                  aria-label={`${point.label}: ${point.value}${point.blocked ? ` (${point.blocked} bloqueadas)` : ''}`}
                  onClick={() => onBarClick?.(point, index)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onBarClick) {
                      e.preventDefault();
                      onBarClick(point, index);
                    }
                  }}
                >
                  {point.blocked && point.blocked > 0 && (
                    <div
                      className="absolute top-0 left-0 h-full bg-destructive/70 rounded"
                      style={{ width: `${(point.blocked / point.value) * 100}%` }}
                    />
                  )}
                </div>
              </div>
              <div className="w-8 text-xs text-muted-foreground">
                {point.value}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <div className="h-full flex items-end justify-between gap-1 pb-8">
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * 80; // 80% max height
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={cn(
                  'w-full bg-primary/20 rounded cursor-pointer transition-all',
                  'hover:bg-primary/30',
                  onBarClick && 'focus:ring-2 focus:ring-ring focus:outline-none'
                )}
                style={{ height: `${barHeight}%` }}
                role={onBarClick ? "button" : undefined}
                tabIndex={onBarClick ? 0 : undefined}
                aria-label={`${point.label}: ${point.value}`}
                onClick={() => onBarClick?.(point, index)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onBarClick) {
                    e.preventDefault();
                    onBarClick(point, index);
                  }
                }}
              />
              <div className="text-xs text-muted-foreground mt-2 text-center">
                {point.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {point.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};