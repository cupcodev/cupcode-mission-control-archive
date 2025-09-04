import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: {
    value: number;
    label: string;
  };
  clickable?: boolean;
  onClick?: () => void;
}

export const KpiCard = ({ 
  title, 
  value, 
  subtitle, 
  delta, 
  clickable = false,
  onClick 
}: KpiCardProps) => {
  const getDeltaIcon = () => {
    if (!delta) return null;
    
    if (delta.value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (delta.value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getDeltaColor = () => {
    if (!delta) return '';
    
    if (delta.value > 0) return 'text-green-600';
    if (delta.value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const CardComponent = clickable ? Button : Card;
  const cardProps = clickable 
    ? {
        variant: 'ghost' as const,
        className: cn(
          'h-auto w-full p-0 text-left justify-start',
          'hover:bg-accent/50 transition-colors'
        ),
        onClick
      }
    : {};

  const content = (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-2xl font-bold text-foreground">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {delta && (
          <div className="flex items-center gap-1 mt-2">
            {getDeltaIcon()}
            <span className={cn('text-xs font-medium', getDeltaColor())}>
              {delta.value > 0 ? '+' : ''}{delta.value}% {delta.label}
            </span>
          </div>
        )}
      </CardContent>
    </>
  );

  if (clickable) {
    return (
      <CardComponent {...cardProps}>
        <Card className="w-full border-0 shadow-none">
          {content}
        </Card>
      </CardComponent>
    );
  }

  return <Card>{content}</Card>;
};