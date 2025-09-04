import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './TaskCard';
import { type Task } from '@/data/mc';

interface KanbanColumnProps {
  status: string;
  title: string;
  tasks: Task[];
  canAcceptDrop: boolean;
}

export const KanbanColumn = ({ status, title, tasks, canAcceptDrop }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`transition-colors ${
        isOver && canAcceptDrop ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>{title}</span>
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SortableContext 
          items={tasks.map(task => task.id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task}
              canMove={true} // This will be properly handled in the parent component
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            Nenhuma tarefa
          </div>
        )}
      </CardContent>
    </Card>
  );
};