import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/mc';

interface NextStepsListProps {
  tasks: Task[];
}

export const NextStepsList = ({ tasks }: NextStepsListProps) => {
  const formatDueDate = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    const today = now.toDateString();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (dueDate < now) {
      return { text: 'Atrasada', variant: 'destructive' as const, icon: AlertTriangle };
    } else if (dueDate.toDateString() === today) {
      return { text: 'Hoje', variant: 'secondary' as const, icon: Clock };
    } else if (dueDate.toDateString() === tomorrow) {
      return { text: 'Amanhã', variant: 'outline' as const, icon: Calendar };
    } else {
      return { 
        text: dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 
        variant: 'outline' as const,
        icon: Calendar
      };
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-500';
    if (priority >= 3) return 'text-orange-500';
    if (priority >= 2) return 'text-blue-500';
    return 'text-muted-foreground';
  };

  if (tasks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Nenhuma próxima tarefa pendente
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => {
        const dueDateInfo = task.due_at ? formatDueDate(task.due_at) : null;
        const IconComponent = dueDateInfo?.icon;
        
        return (
          <div key={task.id} className="flex items-start justify-between gap-2 p-2 bg-muted/30 rounded-md">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                <Badge 
                  variant="outline" 
                  className={cn('text-xs h-4', getPriorityColor(task.priority || 0))}
                >
                  P{task.priority || 0}
                </Badge>
              </div>
              <p className="text-sm font-medium line-clamp-2 leading-snug">
                {task.title}
              </p>
            </div>
            
            {dueDateInfo && IconComponent && (
              <Badge variant={dueDateInfo.variant} className="text-xs gap-1 shrink-0">
                <IconComponent className="h-3 w-3" />
                {dueDateInfo.text}
              </Badge>
            )}
            
            {!task.due_at && (
              <Badge variant="outline" className="text-xs shrink-0">
                Sem prazo
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
};