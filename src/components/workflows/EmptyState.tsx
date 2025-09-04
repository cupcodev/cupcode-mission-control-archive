import { Plus, Kanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  instanceId: string;
}

export const EmptyState = ({ instanceId }: EmptyStateProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Kanban className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="mt-4 text-lg font-semibold">Nenhuma tarefa encontrada</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Esta instância ainda não possui tarefas. As tarefas são criadas automaticamente
          quando uma instância de workflow é iniciada a partir de um template.
        </p>
        
        <div className="mt-6">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Criar tarefa manual
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};