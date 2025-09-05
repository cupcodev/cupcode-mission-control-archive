import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, Clock, User, Flag, MessageCircle, History, 
  CheckSquare, Square, Plus, X, ExternalLink, ArrowLeft,
  AlertTriangle, Edit3, Copy, Link, Save, Loader2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { tasksRepo, approvalsRepo, type Task, type Comment, type ActivityLog, type Approval } from '@/data/mc';
import { ApprovalDecisionDialog } from './ApprovalDecisionDialog';
import { cn } from '@/lib/utils';

interface TaskDetailProps {
  taskId?: string;
  isDrawer?: boolean;
  onClose?: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  done: boolean;
  updated_at: string;
}

export const TaskDetail = ({ taskId: propTaskId, isDrawer = false, onClose, onUpdate }: TaskDetailProps & { onUpdate?: () => void }) => {
  const { id: paramTaskId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const userRole = profile?.role;

  const taskId = propTaskId || paramTaskId;
  
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  // Comment state
  const [newComment, setNewComment] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  
  // Block state
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  
  // Approval state
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const canEdit = () => {
    if (!user || !profile) return false;
    return profile.role === 'admin' || profile.role === 'superadmin' || task?.assignee_user_id === user.id;
  };

  const canComment = () => {
    if (!user || !profile) return false;
    // For now, allow all authenticated users to comment
    // TODO: Check if user is participant of the instance
    return true;
  };

  useEffect(() => {
    if (!taskId) return;
    loadTaskData();
  }, [taskId]);

  const loadTaskData = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const [taskData, commentsData] = await Promise.all([
        tasksRepo.get(taskId),
        tasksRepo.getComments(taskId)
      ]);
      
      // Load approvals if this is an approval task
      if (taskData?.type === 'approval') {
        try {
          const approvalsData = await approvalsRepo.listByTask(taskId);
          setApprovals(approvalsData);
        } catch (error) {
          console.error('Error loading approvals:', error);
        }
      }
      
      if (!taskData) {
        toast({
          title: 'Tarefa não encontrada',
          description: 'A tarefa solicitada não foi encontrada.',
          variant: 'destructive',
        });
        return;
      }
      
      setTask(taskData);
      setComments(commentsData);
      setEditTitle(taskData.title);
      setEditDescription(taskData.fields?.description || '');
      setSelectedDate(taskData.due_at ? new Date(taskData.due_at) : undefined);
      
      // Generate activity logs based on task changes
      const logs = [];
      
      if (taskData.started_at) {
        logs.push({
          id: 1,
          task_id: taskId,
          actor_user_id: taskData.assignee_user_id || 'system',
          action: 'iniciou a tarefa',
          before: { status: 'open' },
          after: { status: 'in_progress' },
          created_at: taskData.started_at
        });
      }
      
      if (taskData.completed_at) {
        logs.push({
          id: 2,
          task_id: taskId,
          actor_user_id: taskData.assignee_user_id || 'system',
          action: 'concluiu a tarefa',
          before: { status: 'in_progress' },
          after: { status: 'done' },
          created_at: taskData.completed_at
        });
      }
      
      if (taskData.status === 'blocked' && taskData.fields?.block_reason) {
        logs.push({
          id: 3,
          task_id: taskId,
          actor_user_id: taskData.assignee_user_id || 'system',
          action: 'bloqueou a tarefa',
          before: {},
          after: { status: 'blocked', reason: taskData.fields.block_reason },
          created_at: new Date().toISOString()
        });
      }
      
      logs.push({
        id: 4,
        task_id: taskId,
        actor_user_id: taskData.created_by || 'system',
        action: 'criou a tarefa',
        before: {},
        after: { status: 'open' },
        created_at: taskData.created_at
      });
      
      setActivityLogs(logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error('Erro ao carregar tarefa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da tarefa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!task || !canEdit()) return;
    
    try {
      setSaving(true);
      await tasksRepo.update(task.id, { 
        fields: { ...task.fields, title: editTitle }
      });
      setTask({ ...task, title: editTitle, fields: { ...task.fields, title: editTitle } });
      setIsEditingTitle(false);
      toast({
        title: 'Título atualizado',
        description: 'O título da tarefa foi atualizado com sucesso.',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao salvar título:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o título.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (!task || !canEdit()) return;
    
    try {
      setSaving(true);
      await tasksRepo.update(task.id, { 
        status: newStatus,
        started_at: newStatus === 'in_progress' && !task.started_at ? new Date().toISOString() : task.started_at,
        completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
      });
      setTask({ ...task, status: newStatus });
      toast({
        title: 'Status atualizado',
        description: `Status alterado para "${newStatus}".`,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!task || !user) return;
    
    try {
      setSaving(true);
      await tasksRepo.update(task.id, { assignee_user_id: user.id });
      setTask({ ...task, assignee_user_id: user.id });
      toast({
        title: 'Tarefa atribuída',
        description: 'A tarefa foi atribuída para você.',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao atribuir tarefa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atribuir a tarefa.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoAssign = async () => {
    const { assignmentService } = await import('@/lib/assignment-service');
    
    try {
      setSaving(true);
      const result = await assignmentService.assignTaskByRole(task.id);
      if (result.success) {
        // Find the assigned user and update the task
        if (result.assigned) {
          setTask({ ...task, assignee_user_id: result.assigned });
        }
        toast({
          title: 'Tarefa atribuída automaticamente',
          description: 'A tarefa foi atribuída automaticamente baseada na função.',
        });
        onUpdate?.();
      } else {
        toast({
          title: 'Erro na atribuição automática',
          description: result.error || 'Não foi possível atribuir a tarefa automaticamente.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao atribuir tarefa: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!task || !canEdit()) return;
    
    try {
      setSaving(true);
      const priority = parseInt(newPriority);
      await tasksRepo.update(task.id, { priority });
      setTask({ ...task, priority });
      toast({
        title: 'Prioridade atualizada',
        description: `Prioridade alterada para ${priority}.`,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a prioridade.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = async (date: Date | undefined) => {
    if (!task || !canEdit()) return;
    
    try {
      setSaving(true);
      const due_at = date ? date.toISOString() : undefined;
      await tasksRepo.update(task.id, { due_at });
      setTask({ ...task, due_at });
      setSelectedDate(date);
      toast({
        title: 'Data de vencimento atualizada',
        description: date ? `Data alterada para ${format(date, 'dd/MM/yyyy', { locale: ptBR })}` : 'Data removida',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a data.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    if (!task || !canEdit()) return;
    
    try {
      const checklist = (task?.fields?.checklist || []) as Array<{id: string, text: string, completed: boolean}>;
      const updatedChecklist = checklist.map(item => 
        item.id === itemId 
          ? { ...item, completed: !item.completed, updated_at: new Date().toISOString() }
          : item
      );
      
      setSaving(true);
      await tasksRepo.update(task.id, { 
        fields: { ...task.fields, checklist: updatedChecklist }
      });
      setTask({ ...task, fields: { ...task.fields, checklist: updatedChecklist } });
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o checklist.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBlockTask = async () => {
    if (!task || !canEdit() || !blockReason.trim()) return;
    
    try {
      setSaving(true);
      await tasksRepo.update(task.id, { 
        status: 'blocked',
        fields: { ...task.fields, block_reason: blockReason }
      });
      setTask({ 
        ...task, 
        status: 'blocked', 
        fields: { ...task.fields, block_reason: blockReason }
      });
      setIsBlocking(false);
      setBlockReason('');
      toast({
        title: 'Tarefa bloqueada',
        description: 'A tarefa foi marcada como bloqueada.',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao bloquear tarefa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível bloquear a tarefa.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnblockTask = async () => {
    if (!task || !canEdit()) return;
    
    try {
      setSaving(true);
      const { block_reason, ...fieldsWithoutBlockReason } = task.fields || {};
      await tasksRepo.update(task.id, { 
        status: 'open',
        fields: fieldsWithoutBlockReason
      });
      setTask({ 
        ...task, 
        status: 'open', 
        fields: fieldsWithoutBlockReason
      });
      toast({
        title: 'Tarefa desbloqueada',
        description: 'A tarefa foi desbloqueada.',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao desbloquear tarefa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desbloquear a tarefa.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim() || !canComment()) return;
    
    try {
      setSaving(true);
      const attachments = [];
      if (attachmentName.trim() && attachmentUrl.trim()) {
        attachments.push({ name: attachmentName.trim(), url: attachmentUrl.trim() });
      }
      
      const comment = await tasksRepo.addComment(task.id, newComment.trim(), attachments);
      setComments([...comments, comment]);
      setNewComment('');
      setAttachmentName('');
      setAttachmentUrl('');
      toast({
        title: 'Comentário adicionado',
        description: 'Seu comentário foi publicado.',
      });
      // Recarregar dados para atualizar histórico
      loadTaskData();
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o comentário.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-gray-500/10 text-gray-700 border-gray-200',
      in_progress: 'bg-blue-500/10 text-blue-700 border-blue-200',
      blocked: 'bg-red-500/10 text-red-700 border-red-200',
      done: 'bg-green-500/10 text-green-700 border-green-200',
      rejected: 'bg-red-500/10 text-red-700 border-red-200'
    };
    return colors[status] || colors.open;
  };

  const getDueDateStatus = () => {
    if (!task?.due_at) return null;
    
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

  const getChecklistProgress = () => {
    const checklist = (task?.fields?.checklist || []) as Array<{id: string, text: string, completed: boolean}>;
    const total = checklist.length;
    const completed = checklist.filter(item => item.completed).length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const dueDateStatus = getDueDateStatus();
  const checklistProgress = getChecklistProgress();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando tarefa...</span>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Tarefa não encontrada</h3>
        <p className="text-muted-foreground mb-4">
          A tarefa solicitada não foi encontrada ou você não tem permissão para acessá-la.
        </p>
        {!isDrawer && (
          <Button onClick={() => navigate('/app/workflows/instances')}>
            Voltar para instâncias
          </Button>
        )}
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2">
            {!isDrawer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/workflows/instances')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
            <Badge variant="outline" className={getTypeColor(task.type)}>
              {task.type}
            </Badge>
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
            {dueDateStatus && (
              <Badge variant="outline" className={dueDateStatus.color}>
                {dueDateStatus.label}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-bold"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                      setEditTitle(task.title);
                    }
                  }}
                />
                <Button size="sm" onClick={handleSaveTitle} disabled={saving}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditingTitle(false);
                    setEditTitle(task.title);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{task.title}</h1>
                {canEdit() && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(task.id)}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.href)}>
              <Link className="h-4 w-4 mr-2" />
              Copiar link
            </DropdownMenuItem>
            {!isDrawer && (
              <DropdownMenuItem onClick={() => window.open(`/app/tasks/${task.id}`, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em nova aba
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Papel</Label>
                <p className="font-medium">{task.assigned_role || 'Não definido'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Responsável</Label>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {task.assigned_role?.slice(0, 2).toUpperCase() || 'TA'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {task.assignee_user_id === user?.id ? 'Você' : 'Não atribuído'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Prioridade</Label>
                {canEdit() ? (
                  <Select value={task.priority.toString()} onValueChange={handlePriorityChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Muito Baixa</SelectItem>
                      <SelectItem value="2">2 - Baixa</SelectItem>
                      <SelectItem value="3">3 - Média</SelectItem>
                      <SelectItem value="4">4 - Alta</SelectItem>
                      <SelectItem value="5">5 - Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">P{task.priority}</p>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                {canEdit() ? (
                  <Select value={task.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                      <SelectItem value="done">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">{task.status}</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Data de vencimento</Label>
              {canEdit() ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <p className="font-medium">
                  {task.due_at ? format(new Date(task.due_at), "dd/MM/yyyy", { locale: ptBR }) : 'Não definida'}
                </p>
              )}
            </div>

            {task.sla_hours && (
              <div>
                <Label className="text-sm text-muted-foreground">SLA</Label>
                <p className="font-medium">{task.sla_hours} horas</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {task.assignee_user_id !== user?.id && canEdit() && (
              <Button onClick={handleAssignToMe} disabled={saving} className="w-full">
                <User className="h-4 w-4 mr-2" />
                Atribuir para mim
              </Button>
            )}
            
            {canEdit() && (
              <Button onClick={handleAutoAssign} disabled={saving} className="w-full" variant="outline">
                <User className="h-4 w-4 mr-2" />
                Alterar atribuição
              </Button>
            )}
            
            {task.type === 'approval' && canEdit() && (
              <Button 
                onClick={() => setShowApprovalDialog(true)} 
                disabled={saving} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Tomar decisão
              </Button>
            )}
            
            {task.status === 'blocked' ? (
              <Button onClick={handleUnblockTask} disabled={saving} className="w-full" variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Desbloquear tarefa
              </Button>
            ) : canEdit() && (
              <Dialog open={isBlocking} onOpenChange={setIsBlocking}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Marcar como bloqueada
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bloquear tarefa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="block-reason">Motivo do bloqueio</Label>
                      <Textarea
                        id="block-reason"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Descreva o motivo do bloqueio..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsBlocking(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleBlockTask} 
                        disabled={!blockReason.trim() || saving}
                      >
                        Bloquear tarefa
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Blocked reason */}
      {task.status === 'blocked' && task.fields?.block_reason && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Tarefa Bloqueada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{task.fields.block_reason}</p>
          </CardContent>
        </Card>
      )}

      {/* Approval Section */}
      {task.type === 'approval' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Histórico de Aprovações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approvals.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                Nenhuma decisão tomada ainda
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div key={approval.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {approval.decision === 'approved' && <CheckSquare className="h-4 w-4 text-green-600" />}
                        {approval.decision === 'changes_requested' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        {approval.decision === 'rejected' && <X className="h-4 w-4 text-red-600" />}
                        <span className="font-medium">
                          {approval.decision === 'approved' && 'Aprovado'}
                          {approval.decision === 'changes_requested' && 'Mudanças Solicitadas'}
                          {approval.decision === 'rejected' && 'Rejeitado'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(approval.decided_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    
                    {approval.reason && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Motivo:</strong> {approval.reason}
                      </div>
                    )}
                    
                    {approval.artifacts && approval.artifacts.length > 0 && (
                      <div className="text-sm">
                        <strong>Evidências:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {approval.artifacts.map((artifact: any, index: number) => (
                            <a
                              key={index}
                              href={artifact.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {artifact.name || artifact.url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canEdit() && (
              <Button 
                onClick={() => setShowApprovalDialog(true)}
                className="w-full mt-4"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Nova Decisão
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Descrição</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditingDescription && canEdit() ? (
            <div className="space-y-2">
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Adicione uma descrição..."
                rows={4}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={async () => {
                  try {
                    setSaving(true);
                     await tasksRepo.update(task.id, { 
                       fields: { ...task.fields, description: editDescription }
                     });
                     setTask({ 
                       ...task, 
                       fields: { ...task.fields, description: editDescription }
                     });
                     setIsEditingDescription(false);
                     toast({
                       title: 'Descrição atualizada',
                       description: 'A descrição foi atualizada com sucesso.',
                     });
                     onUpdate?.();
                  } catch (error) {
                    toast({
                      title: 'Erro',
                      description: 'Não foi possível atualizar a descrição.',
                      variant: 'destructive',
                    });
                  } finally {
                    setSaving(false);
                  }
                }}>
                  Salvar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditingDescription(false);
                    setEditDescription(task.fields?.description || '');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {task.fields?.description || 'Nenhuma descrição adicionada.'}
              </p>
              {canEdit() && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsEditingDescription(true)}
                  className="mt-2"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar descrição
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Subtarefas
              {checklistProgress.total > 0 && (
                <Badge variant="outline">
                  {checklistProgress.completed}/{checklistProgress.total} ({checklistProgress.percentage}%)
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checklistProgress.total > 0 ? (
            <div className="space-y-2">
              {((task.fields?.checklist || []) as Array<{id: string, text: string, completed: boolean}>).map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleChecklistItem(item.id)}
                    disabled={!canEdit() || saving}
                    className="p-0 h-auto"
                  >
                    {item.completed ? (
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                  <span className={cn(
                    "flex-1",
                    item.completed && "line-through text-muted-foreground"
                  )}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma subtarefa encontrada.</p>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comentários ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canComment() ? (
            <div className="space-y-3 p-3 border rounded-lg">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                rows={3}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="Nome do anexo (opcional)"
                />
                <Input
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="URL do anexo (opcional)"
                />
              </div>
              <Button 
                onClick={handleAddComment} 
                disabled={!newComment.trim() || saving}
                size="sm"
              >
                Publicar comentário
              </Button>
            </div>
          ) : (
            <div className="p-3 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-sm">
                Você precisa ser participante desta instância para comentar.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">US</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{profile?.display_name || user?.email || 'Usuário'}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap mb-2">{comment.body}</p>
                {comment.attachments.length > 0 && (
                  <div className="space-y-1">
                    {comment.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <ExternalLink className="h-3 w-3" />
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {attachment.name}
                        </a>
                        {attachment.url.includes('telescup') && (
                          <Badge variant="outline" className="text-xs">
                            Telescup
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Nenhum comentário ainda.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex gap-3 p-2 border rounded">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{profile?.display_name || user?.email || 'Usuário'}</span> {log.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma atividade registrada.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const wrappedContent = (
    <div>
      {content}
      
      {/* Approval Decision Dialog */}
      {task && showApprovalDialog && (
        <ApprovalDecisionDialog
          task={task}
          isOpen={showApprovalDialog}
          onClose={() => setShowApprovalDialog(false)}
          onDecisionMade={() => {
            setShowApprovalDialog(false);
            loadTaskData(); // Reload all data including approvals
          }}
        />
      )}
    </div>
  );

  if (isDrawer) {
    return wrappedContent;
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {wrappedContent}
    </div>
  );
};