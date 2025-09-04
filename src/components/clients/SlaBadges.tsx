import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlaBadgesProps {
  overdue: number;
  dueToday: number;
  noDueDate: number;
}

export const SlaBadges = ({ overdue, dueToday, noDueDate }: SlaBadgesProps) => {
  return (
    <div className="flex flex-wrap gap-1">
      {overdue > 0 && (
        <Badge variant="destructive" className="text-xs gap-1">
          <AlertTriangle className="h-3 w-3" />
          {overdue} atrasada{overdue !== 1 ? 's' : ''}
        </Badge>
      )}
      
      {dueToday > 0 && (
        <Badge variant="secondary" className="text-xs gap-1 bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20">
          <Clock className="h-3 w-3" />
          {dueToday} hoje
        </Badge>
      )}
      
      {noDueDate > 0 && (
        <Badge variant="outline" className="text-xs gap-1">
          <Calendar className="h-3 w-3" />
          {noDueDate} sem prazo
        </Badge>
      )}
      
      {overdue === 0 && dueToday === 0 && noDueDate === 0 && (
        <Badge variant="outline" className="text-xs gap-1 text-green-700 bg-green-500/10 border-green-500/20">
          <Clock className="h-3 w-3" />
          SLAs em dia
        </Badge>
      )}
    </div>
  );
};