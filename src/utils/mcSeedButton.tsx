import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { seedUtil } from '@/data/mc';
import { toast } from 'sonner';
import { Loader2, Database } from 'lucide-react';

export const McSeedButton = () => {
  const { profile } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeeded, setIsSeeded] = useState(seedUtil.isSeedCompleted());

  const handleSeed = async () => {
    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      toast.error('Apenas administradores podem executar o seed');
      return;
    }

    setIsSeeding(true);
    try {
      const result = await seedUtil.checkAndSeedDevData();
      
      if (result) {
        toast.success('Dados de teste do Mission Control criados com sucesso!', {
          description: `Template: ${result.template.name}, Instância criada com ${result.tasks.length} tarefas`
        });
        setIsSeeded(true);
      } else {
        toast.info('Dados de teste já foram criados anteriormente');
        setIsSeeded(true);
      }
    } catch (error: any) {
      console.error('Seed error:', error);
      toast.error('Erro ao criar dados de teste', {
        description: error.message || 'Erro desconhecido'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleReset = () => {
    seedUtil.resetSeed();
    setIsSeeded(false);
    toast.info('Flag de seed resetado. Você pode executar o seed novamente.');
  };

  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleSeed}
        disabled={isSeeding}
        variant={isSeeded ? "secondary" : "default"}
        size="sm"
      >
        {isSeeding ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Database className="h-4 w-4 mr-2" />
        )}
        {isSeeded ? 'Dados já criados' : 'Criar dados de teste MC'}
      </Button>
      
      {isSeeded && (
        <Button onClick={handleReset} variant="outline" size="sm">
          Reset
        </Button>
      )}
    </div>
  );
};