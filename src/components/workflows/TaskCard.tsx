import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, AlertTriangle, User, MoreVertical, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { tasksRepo, type Task } from '@/data/mc';
import { toast } from 'sonner';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  canMove: boolean;
}

export const TaskCard = ({ task, isDragging = false, canMove }: TaskCardProps) => {
  const { user, profile } = useAuth();
  const userRole = profile?.role;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    disabled: !canMove,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      task: 'bg-blue-500/10 text-blue-700 border-blue-200',
      approval: 'bg-orange-500/10 text-orange-700 border-orange-200',
      form: 'bg-green-500/10 text-green-700 border-green-200',
      automation: 'bg-purple-500/10 text-purple-700 border-purple-200'
    };
    return colors[type] || colors.task;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      task: 'Tarefa',
      approval: 'Aprovação',
      form: 'Formulário',
      automation: 'Automação'
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-500/10 text-red-700 border-red-200';
    if (priority === 3) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    return 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const getPriorityLabel = (priority: number) => {
    const labels: Record<number, string> = {
      5: 'Crítica',
      4: 'Alta',
      3: 'Média',
      2: 'Baixa',
      1: 'Muito Baixa'
    };
    return labels[priority] || 'Média';
  };

  const getDueDateStatus = () => {
    if (!task.due_at) return null;
    
    const now = new Date();
    const dueDate = new Date(task.due_at);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    if (dueDate < now) {
      return { label: 'Atrasada', color: 'bg-red-500/10 text-red-700 border-red-200' };
    } else if (dueDate >= today && dueDate < tomorrow) {
      return { label: 'Hoje', color: 'bg-orange-500/10 text-orange-700 border-orange-200' };
    }
    return null;
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getAssigneeInitials = () => {
    // This would normally come from a user lookup, but for now we'll use the role
    return task.assigned_role?.slice(0, 2).toUpperCase() || 'TA';
  };

  const canAssignToMe = () => {
    if (!user || !profile) return false;
    
    // Can assign to self if not already assigned to them
    if (task.assignee_user_id === user.id) return false;
    
    // Admin can assign any task to themselves
    if (profile.role === 'admin' || profile.role === 'superadmin') return true;
    
    // Regular users might not be able to assign tasks to themselves depending on RLS
    return false;
  };

  const handleAssignToMe = async () => {
    if (!user) return;

    try {
      await tasksRepo.update(task.id, { assignee_user_id: user.id });
      toast.success('Tarefa atribuída para você');
    } catch (error) {
      console.error('Erro ao atribuir tarefa:', error);
      toast.error('Não foi possível atribuir a tarefa. Verifique suas permissões.');
    }
  };

  const handleStatusChange = async (newStatus: 'open' | 'in_progress' | 'blocked' | 'done') => {
    try {
      await tasksRepo.update(task.id, { 
        status: newStatus,
        started_at: newStatus === 'in_progress' && !task.started_at ? new Date().toISOString() : task.started_at,
        completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
      });
      toast.success(`Status atualizado para "${newStatus}"`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Não foi possível atualizar o status da tarefa.');
    }
  };

  const handleAutoAssign = async () => {
    const { assignmentService } = await import('@/lib/assignment-service');
    
    try {
      const result = await assignmentService.assignTaskByRole(task.id);
      if (result.success) {
        toast.success('Tarefa atribuída automaticamente');
        // Trigger refresh if there's a callback
        window.location.reload();
      } else {
        toast.error(result.error || 'Erro ao atribuir tarefa');
      }
    } catch (error: any) {
      toast.error('Erro ao atribuir tarefa: ' + error.message);
    }
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-all hover:shadow-md ${
        isDragging || isSortableDragging ? 'opacity-50 rotate-1 scale-105' : ''
      } ${!canMove ? 'cursor-not-allowed opacity-75' : ''}`}
      {...attributes}
      {...(canMove ? listeners : {})}
    >
      <CardContent className="p-3 space-y-3">
        {/* Header with type and priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            <Badge 
              variant="outline" 
              className={`text-xs ${getTypeColor(task.type)}`}
            >
              {getTypeLabel(task.type)}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs ${getPriorityColor(task.priority)}`}
            >
              P{task.priority}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(`/app/tasks/${task.id}`, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir detalhes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusChange('open')}>
                  Mover para Aberto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                  Mover para Em Progresso
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('blocked')}>
                  Mover para Bloqueado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                  Mover para Concluído
                </DropdownMenuItem>
                {canAssignToMe() && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleAssignToMe}>
                      <User className="h-4 w-4 mr-2" />
                      Atribuir para mim
                    </DropdownMenuItem>
                  </>
                )}
                
                {(userRole === 'admin' || userRole === 'superadmin') && task.assigned_role && !task.assignee_user_id && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleAutoAssign}>
                      Atribuir automaticamente ({task.assigned_role})
                    </DropdownMenuItem>
                  </>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <h4 className="font-medium text-sm leading-tight line-clamp-2">
          {task.title}
        </h4>

        {/* Due date and SLA warning */}
        {(task.due_at || dueDateStatus) && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {task.due_at ? formatDueDate(task.due_at) : 'Sem prazo'}
            </span>
            {dueDateStatus && (
              <Badge 
                variant="outline" 
                className={`text-xs ${dueDateStatus.color}`}
              >
                {dueDateStatus.label}
              </Badge>
            )}
          </div>
        )}

        {/* Assignee and role */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getAssigneeInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {task.assigned_role || 'Sem papel'}
            </span>
          </div>
          
          {task.assignee_user_id === user?.id && (
            <Badge variant="outline" className="text-xs">
              Minha
            </Badge>
          )}
        </div>

        {/* Blocked indicator */}
        {task.status === 'blocked' && (
          <div className="flex items-center gap-1 text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-xs">Bloqueada</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};