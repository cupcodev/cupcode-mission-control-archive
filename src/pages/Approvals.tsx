import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Clock, Search, Filter, MoreHorizontal, Eye, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TaskDrawer } from '@/components/workflows/TaskDrawer';
import { ApprovalDecisionDialog } from '@/components/workflows/ApprovalDecisionDialog';
import { tasksRepo } from '@/data/mc';
import type { Task } from '@/types/mc';
import { format, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Approvals = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [decisionTask, setDecisionTask] = useState<Task | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadApprovalTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchQuery, statusFilter, assigneeFilter, showMyTasks]);

  const loadApprovalTasks = async () => {
    try {
      setLoading(true);
      // Mock data - in real implementation, this would filter by type='approval'
      const mockApprovalTasks: Task[] = [
        {
          id: 'approval-1',
          workflow_instance_id: 'instance-1',
          node_id: 'approval-node-1',
          type: 'approval',
          title: 'Aprovação de Design UI',
          status: 'open',
          priority: 5,
          assigned_role: 'designer',
          assignee_user_id: user?.id,
          due_at: new Date().toISOString(),
          sla_hours: 24,
          fields: {
            checklist: [
              { id: '1', label: 'Design responsivo', required: true, done: true },
              { id: '2', label: 'Acessibilidade verificada', required: true, done: false },
              { id: '3', label: 'Aprovação do cliente', required: false, done: false }
            ]
          },
          created_by: 'user-1',
          created_at: '2024-01-15T09:00:00Z'
        },
        {
          id: 'approval-2',
          workflow_instance_id: 'instance-2',
          node_id: 'approval-node-2',
          type: 'approval',
          title: 'Revisão de Código Backend',
          status: 'in_progress',
          priority: 4,
          assigned_role: 'tech-lead',
          assignee_user_id: 'other-user',
          due_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          sla_hours: 48,
          fields: {},
          created_by: 'user-2',
          created_at: '2024-01-14T14:30:00Z'
        }
      ];
      
      setTasks(mockApprovalTasks);
    } catch (error) {
      toast({
        title: 'Erro ao carregar aprovações',
        description: 'Tente novamente ou contate o suporte',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = tasks;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.node_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Assignee filter
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'me') {
        filtered = filtered.filter(task => task.assignee_user_id === user?.id);
      } else if (assigneeFilter === 'unassigned') {
        filtered = filtered.filter(task => !task.assignee_user_id);
      }
    }

    // My tasks toggle
    if (showMyTasks) {
      filtered = filtered.filter(task => task.assignee_user_id === user?.id);
    }

    setFilteredTasks(filtered);
  };

  const handleAssignToMe = async (task: Task) => {
    try {
      await tasksRepo.update(task.id, {
        assignee_user_id: user?.id
      });
      
      setTasks(tasks.map(t => 
        t.id === task.id 
          ? { ...t, assignee_user_id: user?.id }
          : t
      ));
      
      toast({
        title: 'Tarefa atribuída',
        description: 'A tarefa foi atribuída para você'
      });
      
      // Reload tasks to get fresh data
      loadApprovalTasks();
    } catch (error) {
      toast({
        title: 'Erro ao atribuir tarefa',
        description: 'Não foi possível atribuir a tarefa',
        variant: 'destructive'
      });
    }
  };

  const getSLABadge = (task: Task) => {
    if (!task.due_at) return null;

    const dueDate = new Date(task.due_at);
    const now = new Date();

    if (isPast(dueDate) && !isToday(dueDate)) {
      return <Badge variant="destructive">Atrasada</Badge>;
    }

    if (isToday(dueDate)) {
      return <Badge variant="secondary">Hoje</Badge>;
    }

    return <Badge variant="outline">
      {format(dueDate, "dd/MM", { locale: ptBR })}
    </Badge>;
  };

  const canMakeDecision = (task: Task) => {
    return true; // Allow all authenticated users to make decisions for now
  };

  const canAssignToMe = (task: Task) => {
    return task.assignee_user_id !== user?.id;
  };

  const openTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskDrawerOpen(true);
  };

  const openDecisionDialog = (task: Task) => {
    setDecisionTask(task);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: 'outline',
      in_progress: 'secondary',
      blocked: 'destructive',
      done: 'default'
    };

    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando aprovações...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aprovações</h1>
          <p className="text-muted-foreground">
            Gerencie suas aprovações pendentes e histórico de decisões
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Aberta</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="blocked">Bloqueada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Responsável</label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="me">Minhas tarefas</SelectItem>
                  <SelectItem value="unassigned">Não atribuídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filtro rápido</label>
              <Button
                variant={showMyTasks ? "default" : "outline"}
                onClick={() => setShowMyTasks(!showMyTasks)}
                className="w-full"
              >
                Minhas pendentes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Aprovações ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {tasks.length === 0 
                ? "Nenhuma aprovação encontrada"
                : "Nenhuma aprovação corresponde aos filtros aplicados"
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {task.node_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task.status)}
                    </TableCell>
                    <TableCell>
                      {task.assignee_user_id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground">
                            {task.assignee_user_id === user?.id ? 'Eu' : 'U'}
                          </div>
                          <span className="text-sm">
                            {task.assignee_user_id === user?.id ? 'Você' : 'Usuário'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não atribuída</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">P{task.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      {getSLABadge(task)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openTaskDetail(task.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {canMakeDecision(task) && (
                            <DropdownMenuItem onClick={() => openDecisionDialog(task)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Tomar decisão
                            </DropdownMenuItem>
                          )}
                          {canAssignToMe(task) && (
                            <DropdownMenuItem onClick={() => handleAssignToMe(task)}>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Atribuir para mim
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Task Detail Drawer */}
      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={isTaskDrawerOpen}
        onClose={() => {
          setIsTaskDrawerOpen(false);
          setSelectedTaskId(null);
        }}
        onUpdate={loadApprovalTasks}
      />

      {/* Decision Dialog */}
      {decisionTask && (
        <ApprovalDecisionDialog
          task={decisionTask}
          isOpen={!!decisionTask}
          onClose={() => setDecisionTask(null)}
          onDecisionMade={() => {
            setDecisionTask(null);
            loadApprovalTasks();
          }}
        />
      )}
    </div>
  );
};