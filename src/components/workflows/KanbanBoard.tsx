import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { tasksRepo, type Task } from '@/data/mc';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { BoardFilters } from './BoardFilters';
import { BoardToolbar } from './BoardToolbar';
import { EmptyState } from './EmptyState';

interface KanbanBoardProps {
  instanceId: string;
}

type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done';

const COLUMN_STATUSES: TaskStatus[] = ['open', 'in_progress', 'blocked', 'done'];

const COLUMN_LABELS: Record<TaskStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em Progresso',
  blocked: 'Bloqueado',
  done: 'Concluído'
};

interface Filters {
  search: string;
  statuses: TaskStatus[];
  roles: string[];
  assignees: string[];
  priorities: number[];
  dueDates: string[];
  myTasksOnly: boolean;
}

interface BoardFiltersType {
  search: string;
  statuses: string[];
  roles: string[];
  assignees: string[];
  priorities: number[];
  dueDates: string[];
  myTasksOnly: boolean;
}

export const KanbanBoard = ({ instanceId }: KanbanBoardProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'due_date' | 'created_at'>('priority');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    statuses: [...COLUMN_STATUSES],
    roles: [],
    assignees: [],
    priorities: [],
    dueDates: [],
    myTasksOnly: false
  });

  const handleFiltersChange = (newFilters: BoardFiltersType) => {
    setFilters({
      ...newFilters,
      statuses: newFilters.statuses as TaskStatus[]
    });
  };
  
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tasksRepo.listByInstance(instanceId);
      setTasks(data);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tarefas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [instanceId, toast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...tasks];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.assigned_role?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(task => 
        filters.statuses.includes(task.status as TaskStatus)
      );
    }

    // Role filter
    if (filters.roles.length > 0) {
      filtered = filtered.filter(task => 
        task.assigned_role && filters.roles.includes(task.assigned_role)
      );
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(task => 
        filters.priorities.includes(task.priority)
      );
    }

    // My tasks only filter
    if (filters.myTasksOnly && user) {
      filtered = filtered.filter(task => 
        task.assignee_user_id === user.id
      );
    }

    // Due date filter
    if (filters.dueDates.length > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(task => {
        if (!task.due_at) return false;
        const dueDate = new Date(task.due_at);
        
        return filters.dueDates.some(filter => {
          switch (filter) {
            case 'overdue':
              return dueDate < now;
            case 'today':
              return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
            case 'this_week':
              return dueDate >= today && dueDate <= thisWeek;
            default:
              return false;
          }
        });
      });
    }

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          if (a.priority !== b.priority) return b.priority - a.priority;
          break;
        case 'due_date':
          if (a.due_at && b.due_at) {
            const dateA = new Date(a.due_at);
            const dateB = new Date(b.due_at);
            if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
          } else if (a.due_at && !b.due_at) return -1;
          else if (!a.due_at && b.due_at) return 1;
          break;
        case 'created_at':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      
      // Secondary sort by created_at
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    setFilteredTasks(filtered);
  }, [tasks, filters, sortBy, user]);

  const canMoveTask = (task: Task): boolean => {
    if (!user || !profile) return false;
    
    // Admin/superadmin can move any task
    if (profile.role === 'admin' || profile.role === 'superadmin') {
      return true;
    }
    
    // Regular users can only move their assigned tasks
    return task.assignee_user_id === user.id;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task && canMoveTask(task)) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if user can move this task
    if (!canMoveTask(task)) {
      toast({
        title: 'Permissão negada',
        description: 'Você só pode mover tarefas atribuídas a você.',
        variant: 'destructive',
      });
      return;
    }

    // Don't update if status is the same
    if (task.status === newStatus) return;

    // Optimistic update
    const originalStatus = task.status;
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    try {
      await tasksRepo.update(taskId, { 
        status: newStatus,
        started_at: newStatus === 'in_progress' && !task.started_at ? new Date().toISOString() : task.started_at,
        completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
      });
      
      toast({
        title: 'Tarefa atualizada',
        description: `Status alterado para "${COLUMN_LABELS[newStatus]}".`,
      });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      
      // Rollback on error
      const rollbackTasks = tasks.map(t => 
        t.id === taskId ? { ...t, status: originalStatus } : t
      );
      setTasks(rollbackTasks);
      
      toast({
        title: 'Erro ao atualizar tarefa',
        description: 'Não foi possível alterar o status da tarefa. Verifique suas permissões.',
        variant: 'destructive',
      });
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const getTotalCount = () => filteredTasks.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Carregando tarefas...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return <EmptyState instanceId={instanceId} />;
  }

  return (
    <div className="space-y-6">
      <BoardToolbar totalCount={getTotalCount()} />
      
      <BoardFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        sortBy={sortBy}
        onSortChange={setSortBy}
        availableRoles={[...new Set(tasks.map(t => t.assigned_role).filter(Boolean))]}
        availableAssignees={[]}
      />

      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COLUMN_STATUSES.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              title={COLUMN_LABELS[status]}
              tasks={getTasksByStatus(status)}
              canAcceptDrop={true}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard 
              task={activeTask} 
              isDragging={true}
              canMove={canMoveTask(activeTask)}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};