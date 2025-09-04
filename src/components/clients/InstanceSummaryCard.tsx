import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, Calendar, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tasksRepo } from '@/data/mc';
import type { WorkflowInstance, WorkflowTemplate, Task } from '@/types/mc';
import { ProgressBar } from './ProgressBar';
import { SlaBadges } from './SlaBadges';
import { NextStepsList } from './NextStepsList';

interface InstanceSummaryCardProps {
  instance: WorkflowInstance;
  template?: WorkflowTemplate;
}

export const InstanceSummaryCard = ({ instance, template }: InstanceSummaryCardProps) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>(instance.created_at);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const instanceTasks = await tasksRepo.listByInstance(instance.id);
        setTasks(instanceTasks);
        
        // Calculate last update
        const taskUpdates = instanceTasks.map(task => 
          task.completed_at || task.started_at || task.created_at
        );
        
        const latestTaskUpdate = taskUpdates.reduce((latest, current) => 
          new Date(current) > new Date(latest) ? current : latest, instance.created_at
        );
        
        setLastUpdate(latestTaskUpdate);
      } catch (error) {
        console.error('Error loading tasks for instance:', instance.id, error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [instance.id, instance.created_at]);

  const getProgress = () => {
    if (tasks.length === 0) return 0;
    const doneCount = tasks.filter(task => task.status === 'done').length;
    return Math.floor((doneCount / tasks.length) * 100);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      running: 'text-primary bg-primary/10 border-primary/20',
      paused: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      done: 'text-green-500 bg-green-500/10 border-green-500/20',
      canceled: 'text-red-500 bg-red-500/10 border-red-500/20',
    };
    return colors[status as keyof typeof colors] || colors.running;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      running: 'Em Andamento',
      paused: 'Pausada',
      done: 'Concluída',
      canceled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getNextSteps = () => {
    return tasks
      .filter(task => ['open', 'in_progress'].includes(task.status))
      .sort((a, b) => {
        // First by due_at (nulls last)
        if (a.due_at && !b.due_at) return -1;
        if (!a.due_at && b.due_at) return 1;
        if (a.due_at && b.due_at) {
          const dateCompare = new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
          if (dateCompare !== 0) return dateCompare;
        }
        
        // Then by priority (descending)
        const priorityCompare = (b.priority || 0) - (a.priority || 0);
        if (priorityCompare !== 0) return priorityCompare;
        
        // Finally by created_at (ascending)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, 3);
  };

  const getSlaData = () => {
    const now = new Date();
    const today = now.toDateString();
    
    const overdue = tasks.filter(task => 
      task.due_at && 
      new Date(task.due_at) < now &&
      ['open', 'in_progress'].includes(task.status)
    ).length;
    
    const due_today = tasks.filter(task => 
      task.due_at && 
      new Date(task.due_at).toDateString() === today &&
      ['open', 'in_progress'].includes(task.status)
    ).length;
    
    const no_due_date = tasks.filter(task => 
      !task.due_at && 
      ['open', 'in_progress'].includes(task.status)
    ).length;

    return { overdue, due_today, no_due_date };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-1/3"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = getProgress();
  const nextSteps = getNextSteps();
  const slaData = getSlaData();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              {template?.name || 'Template não encontrado'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                v{template?.version || 'N/A'}
              </Badge>
              <Badge className={cn('text-xs', getStatusColor(instance.status))}>
                {getStatusLabel(instance.status)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <ProgressBar progress={progress} />
        </div>

        {/* SLA Badges */}
        <SlaBadges 
          overdue={slaData.overdue}
          dueToday={slaData.due_today}
          noDueDate={slaData.no_due_date}
        />

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Próximos Passos</h4>
            <NextStepsList tasks={nextSteps} />
          </div>
        )}

        {/* Last Update */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Atualizado: {formatDate(lastUpdate)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => navigate(`/app/workflows/instances/${instance.id}/board`)}
            className="flex-1 gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir Board
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/app/workflows/instances`)}
            className="gap-1"
          >
            <Eye className="h-3 w-3" />
            Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};