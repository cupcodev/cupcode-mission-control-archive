import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Plus, Play, FileText, Clock, Users, Search } from 'lucide-react';
import { templatesRepo, instancesRepo, type WorkflowTemplate, type WorkflowInstance } from '@/data/mc';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const Workflows = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [instancesLoading, setInstancesLoading] = useState(true);
  const [searchTemplates, setSearchTemplates] = useState('');
  const [searchInstances, setSearchInstances] = useState('');
  const { toast } = useToast();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  useEffect(() => {
    loadTemplates();
    loadInstances();
  }, []);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const data = await templatesRepo.listActive();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates.',
        variant: 'destructive',
      });
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadInstances = async () => {
    try {
      setInstancesLoading(true);
      const data = await instancesRepo.listMineOrParticipant();
      setInstances(data);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as execuções.',
        variant: 'destructive',
      });
    } finally {
      setInstancesLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTemplates.toLowerCase()) ||
    template.domain.toLowerCase().includes(searchTemplates.toLowerCase())
  );

  const filteredInstances = instances.filter(instance => {
    const searchLower = searchInstances.toLowerCase();
    const clientName = instance.variables?.client_name || '';
    const projectName = instance.variables?.project_name || '';
    return clientName.toLowerCase().includes(searchLower) ||
           projectName.toLowerCase().includes(searchLower) ||
           instance.status.toLowerCase().includes(searchLower);
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'running':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'done':
        return 'success';
      case 'canceled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return 'Executando';
      case 'paused':
        return 'Pausado';
      case 'done':
        return 'Concluído';
      case 'canceled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Gerencie templates e acompanhe execuções de workflows
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/app/workflows/templates/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        )}
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Execuções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={searchTemplates}
                onChange={(e) => setSearchTemplates(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {templatesLoading ? (
            <div className="text-center py-8">Carregando templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTemplates ? 'Ajuste sua busca ou' : ''} Crie seu primeiro template de workflow.
                </p>
                {isAdmin && (
                  <Button onClick={() => navigate('/app/workflows/templates/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Template
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>
                          Domínio: {template.domain} • v{template.version}
                        </CardDescription>
                      </div>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {template.spec.nodes.length} etapas
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Criado em {new Date(template.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/app/workflows/templates/${template.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/app/workflows/templates/${template.id}/start`)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Executar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar execuções..."
                value={searchInstances}
                onChange={(e) => setSearchInstances(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {instancesLoading ? (
            <div className="text-center py-8">Carregando execuções...</div>
          ) : filteredInstances.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma execução encontrada</h3>
                <p className="text-muted-foreground">
                  {searchInstances ? 'Ajuste sua busca para encontrar execuções.' : 'Execute um template para começar.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInstances.map((instance) => {
                const template = templates.find(t => t.id === instance.template_id);
                const clientName = instance.variables?.client_name || 'Cliente não informado';
                const projectName = instance.variables?.project_name || 'Projeto sem nome';
                
                return (
                  <Card key={instance.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{projectName}</CardTitle>
                          <CardDescription>
                            {clientName} • {template?.name || 'Template não encontrado'}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(instance.status) as any}>
                          {getStatusLabel(instance.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          Template v{instance.template_version}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Iniciado em {new Date(instance.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/app/workflows/instances/${instance.id}`)}
                          >
                            Ver Detalhes
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/app/workflows/instances/${instance.id}/board`)}
                          >
                            Abrir Board
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};