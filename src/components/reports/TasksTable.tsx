import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { TaskDetail } from '@/data/mc/reportsRepo';
import { cn } from '@/lib/utils';

interface TasksTableProps {
  tasks: TaskDetail[];
  onInstanceClick?: (instanceId: string) => void;
}

export const TasksTable = ({ tasks, onInstanceClick }: TasksTableProps) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'outline',
      in_progress: 'default',
      blocked: 'destructive',
      done: 'secondary',
      rejected: 'destructive'
    } as const;

    const labels = {
      open: 'Aberta',
      in_progress: 'Em andamento',
      blocked: 'Bloqueada',
      done: 'Concluída',
      rejected: 'Rejeitada'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHours = (hours?: number) => {
    if (hours === undefined || hours === null) return '-';
    return `${hours}h`;
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma tarefa encontrada com os filtros aplicados.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarefa</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Criada</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Idade</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {task.id}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{task.templateName}</div>
                  <div className="text-sm text-muted-foreground">
                    v{task.templateVersion}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {task.type}
                </Badge>
              </TableCell>
              <TableCell>
                {getStatusBadge(task.status)}
              </TableCell>
              <TableCell>
                {task.assignedRole ? (
                  <Badge variant="secondary">
                    {task.assignedRole}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {task.assigneeName ? (
                  <div>
                    <div className="font-medium">{task.assigneeName}</div>
                    <div className="text-sm text-muted-foreground">
                      {task.assigneeEmail}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Não atribuída</span>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(task.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {task.slaHours && (
                    <span className="text-sm">
                      {formatHours(task.slaHours)}
                    </span>
                  )}
                  {task.metSla !== undefined && (
                    <Badge 
                      variant={task.metSla ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {task.metSla ? 'Atendido' : 'Não atendido'}
                    </Badge>
                  )}
                  {task.overdue && (
                    <Badge variant="destructive" className="text-xs">
                      Atrasada
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className={cn(
                  'text-sm',
                  task.ageDays > 10 ? 'text-destructive' :
                  task.ageDays > 5 ? 'text-orange-600' : 'text-foreground'
                )}>
                  {task.ageDays} dia{task.ageDays !== 1 ? 's' : ''}
                </span>
              </TableCell>
              <TableCell>
                {onInstanceClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onInstanceClick(task.workflowInstanceId)}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Abrir board da instância</span>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};