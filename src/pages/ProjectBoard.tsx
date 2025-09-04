import { useParams } from 'react-router-dom';
import { ComingSoon } from '@/components/ComingSoon';

export const ProjectBoard = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-tomorrow font-bold">
            Board do Projeto {id}
          </h2>
          <p className="text-muted-foreground">
            Visualização Kanban para gerenciamento de tarefas
          </p>
        </div>
      </div>

      <ComingSoon 
        title="Board Kanban"
        description="O board interativo com colunas personalizáveis e arrastar-e-soltar está sendo desenvolvido."
      />
    </div>
  );
};