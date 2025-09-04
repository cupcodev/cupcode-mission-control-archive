import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KanbanBoard } from '@/components/workflows/KanbanBoard';
import { tasksRepo, instancesRepo, type WorkflowInstance } from '@/data/mc';

export const WorkflowInstanceBoard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<WorkflowInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadInstance = async () => {
      if (!id) {
        navigate('/app/workflows/instances');
        return;
      }

      try {
        setLoading(true);
        const instanceData = await instancesRepo.get(id);
        if (!instanceData) {
          toast({
            title: 'Instância não encontrada',
            description: 'A instância solicitada não foi encontrada ou você não tem permissão para acessá-la.',
            variant: 'destructive',
          });
          navigate('/app/workflows/instances');
          return;
        }
        setInstance(instanceData);
      } catch (error) {
        console.error('Erro ao carregar instância:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a instância.',
          variant: 'destructive',
        });
        navigate('/app/workflows/instances');
      } finally {
        setLoading(false);
      }
    };

    loadInstance();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center py-8">Carregando board...</div>
      </div>
    );
  }

  if (!instance || !id) {
    return null;
  }

  const getProjectName = () => {
    return instance.variables?.project_name || 
           instance.variables?.client_name || 
           `Instância ${instance.id.slice(0, 8)}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/app/workflows/instances')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{getProjectName()}</h1>
          <p className="text-muted-foreground">
            Board Kanban - Status: {instance.status}
          </p>
        </div>
      </div>

      <KanbanBoard instanceId={id} templateId={instance.template_id} />
    </div>
  );
};