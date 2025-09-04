import { useParams } from 'react-router-dom';
import { KanbanBoard } from '@/components/workflows/KanbanBoard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProjectBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Para demonstração, usamos um instanceId padrão baseado no project id
  const instanceId = `project-${id}-instance`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/app/projects')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <div>
            <h2 className="text-2xl font-tomorrow font-bold">
              Board do Projeto {id}
            </h2>
            <p className="text-muted-foreground">
              Visualização Kanban para gerenciamento de tarefas
            </p>
          </div>
        </div>
      </div>

      <KanbanBoard instanceId={instanceId} />
    </div>
  );
};