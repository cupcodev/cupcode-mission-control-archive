import { cn } from '@/lib/utils';

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  height?: number;
  className?: string;
  onPointClick?: (point: DataPoint, index: number) => void;
}

export const SimpleLineChart = ({ 
  data, 
  height = 200, 
  className,
  onPointClick 
}: SimpleLineChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue || 1;

  const padding = 20;
  const chartWidth = 100 - (padding * 2);
  const chartHeight = 100 - (padding * 2);

  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + ((maxValue - point.value) / valueRange) * chartHeight;
    return { x, y, ...point, index };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Grid lines */}
        <defs>
          <pattern
            id="grid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="0.1"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Area under the line */}
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`}
          fill="hsl(var(--primary))"
          fillOpacity="0.1"
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point) => (
          <circle
            key={point.index}
            cx={point.x}
            cy={point.y}
            r="0.8"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth="0.2"
            className={cn(
              'cursor-pointer transition-all',
              onPointClick && 'hover:r-1.2'
            )}
            role={onPointClick ? "button" : undefined}
            tabIndex={onPointClick ? 0 : undefined}
            aria-label={`${point.label}: ${point.value}`}
            onClick={() => onPointClick?.(point, point.index)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onPointClick) {
                e.preventDefault();
                onPointClick(point, point.index);
              }
            }}
          />
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        {data.map((point, index) => (
          <span key={index} className="text-center">
            {new Date(point.label).toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit' 
            })}
          </span>
        ))}
      </div>
    </div>
  );
};