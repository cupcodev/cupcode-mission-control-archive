import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, AlertTriangle, MoreVertical, ExternalLink, Flag, User, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { tasksRepo, type Task } from '@/data/mc';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  canMove: boolean;
  onClick?: () => void;
}

export const TaskCard = ({ task, isDragging = false, canMove, onClick }: TaskCardProps) => {
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

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600 bg-red-100';
    if (priority >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return 'Alta';
    if (priority >= 2) return 'Média';
    return 'Baixa';
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

  const isOverdue = task.due_at && new Date(task.due_at) < new Date();
  const isDueToday = task.due_at && 
    new Date(task.due_at).toDateString() === new Date().toDateString();

  const canEdit = userRole === 'admin' || userRole === 'superadmin' || task.assignee_user_id === user?.id;

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const { toast: useToastHook } = useToast();

  const handleStatusChange = async (newStatus: 'open' | 'in_progress' | 'blocked' | 'done') => {
    try {
      await tasksRepo.update(task.id, { 
        status: newStatus,
        started_at: newStatus === 'in_progress' && !task.started_at ? new Date().toISOString() : task.started_at,
        completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
      });
      useToastHook({
        title: 'Status atualizado',
        description: `Status alterado para "${newStatus}".`,
      });
      // Refresh the board
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      useToastHook({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da tarefa.',
        variant: 'destructive',
      });
    }
  };

  const handleAssignToMe = async () => {
    if (!user) return;

    try {
      await tasksRepo.update(task.id, { assignee_user_id: user.id });
      useToastHook({
        title: 'Tarefa atribuída',
        description: 'A tarefa foi atribuída para você.',
      });
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atribuir tarefa:', error);
      useToastHook({
        title: 'Erro',
        description: 'Não foi possível atribuir a tarefa. Verifique suas permissões.',
        variant: 'destructive',
      });
    }
  };

  const canAssignToMe = () => {
    if (!user || !profile) return false;
    
    // Can assign to self if not already assigned to them
    if (task.assignee_user_id === user.id) return false;
    
    // Admin can assign any task to themselves
    if (profile.role === 'admin' || profile.role === 'superadmin') return true;
    
    return false;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all hover:shadow-md ${
        isDragging || isSortableDragging ? 'opacity-50 rotate-1 scale-105' : ''
      } ${isOverdue ? 'border-red-300' : isDueToday ? 'border-yellow-300' : ''}`}
      {...attributes}
    >
      <CardContent className="p-3 space-y-3">
        {/* Header with drag handle, type, priority and actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Drag handle - only this area triggers drag */}
            {canMove && (
              <div 
                className="cursor-grab active:cursor-grabbing p-1 -m-1 text-muted-foreground hover:text-foreground"
                {...listeners}
              >
                <GripVertical className="h-3 w-3" />
              </div>
            )}
            
            <div className="flex flex-wrap gap-1">
              <Badge 
                variant="outline" 
                className={`text-xs ${getTypeColor(task.type)}`}
              >
                {getTypeLabel(task.type)}
              </Badge>
              <Badge 
                variant="secondary" 
                className={`text-xs ${getPriorityColor(task.priority)}`}
              >
                <Flag className="w-3 h-3 mr-1" />
                {getPriorityLabel(task.priority)}
              </Badge>
            </div>
          </div>
          
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 bg-background border shadow-md">
                <DropdownMenuItem 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onClick?.(); 
                  }}
                  className="cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir detalhes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleStatusChange('open'); 
                  }}
                  className="cursor-pointer"
                >
                  Mover para Aberto
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleStatusChange('in_progress'); 
                  }}
                  className="cursor-pointer"
                >
                  Mover para Em Progresso
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleStatusChange('blocked'); 
                  }}
                  className="cursor-pointer"
                >
                  Mover para Bloqueado
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleStatusChange('done'); 
                  }}
                  className="cursor-pointer"
                >
                  Mover para Concluído
                </DropdownMenuItem>
                {canAssignToMe() && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleAssignToMe(); 
                      }}
                      className="cursor-pointer"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Atribuir para mim
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Clickable content area */}
        <div 
          className="cursor-pointer space-y-3"
          onClick={(e) => {
            e.stopPropagation();
            if (!isDragging && !isSortableDragging) {
              onClick?.();
            }
          }}
        >
          {/* Title */}
          <h4 className="font-medium text-sm leading-tight line-clamp-2">
            {task.title}
          </h4>

          {/* Due date */}
          {task.due_at && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className={`${isOverdue ? 'text-red-600' : isDueToday ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                {formatDueDate(task.due_at)}
              </span>
              {isOverdue && <Badge variant="destructive" className="text-xs">Atrasada</Badge>}
              {isDueToday && !isOverdue && <Badge variant="outline" className="text-xs text-yellow-600">Hoje</Badge>}
            </div>
          )}

          {/* Assignee and role */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {task.assigned_role?.slice(0, 2).toUpperCase() || 'TA'}
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

          {/* Status indicator */}
          {task.status === 'blocked' && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Bloqueada</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};