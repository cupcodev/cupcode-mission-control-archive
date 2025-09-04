import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Pause, Play, X, Kanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { instancesRepo, type WorkflowInstance } from '@/data/mc';
import { InstanceStartDialog } from '@/components/workflows/InstanceStartDialog';

export const WorkflowExecutions = () => {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewInstanceDialog, setShowNewInstanceDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadInstances = async () => {
    try {
      setLoading(true);
      const data = await instancesRepo.listMineOrParticipant();
      setInstances(data);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as instâncias.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const filteredInstances = instances.filter(instance => 
    instance.variables?.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instance.variables?.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      running: 'default',
      paused: 'secondary',
      done: 'outline',
      canceled: 'destructive'
    };
    
    const labels: Record<string, string> = {
      running: 'Em execução',
      paused: 'Pausado',
      done: 'Concluído',
      canceled: 'Cancelado'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleAction = (instanceId: string, action: string) => {
    // Placeholder para ações futuras
    toast({
      title: 'Em breve',
      description: `Ação "${action}" será implementada em breve.`,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Execuções de Workflow</h1>
          <p className="text-muted-foreground">
            Monitore instâncias de workflow em execução
          </p>
        </div>
        <Button onClick={() => setShowNewInstanceDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Instância
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por projeto ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Instâncias */}
      <Card>
        <CardHeader>
          <CardTitle>Instâncias ({filteredInstances.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando instâncias...</div>
          ) : filteredInstances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma instância encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Projeto/Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado por</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">Template {instance.template_id}</div>
                        <div className="text-sm text-muted-foreground">v{instance.template_version}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {instance.variables?.project_name && (
                          <div className="font-medium">{instance.variables.project_name}</div>
                        )}
                        {instance.variables?.client_name && (
                          <div className="text-sm text-muted-foreground">{instance.variables.client_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(instance.status)}
                    </TableCell>
                    <TableCell>{instance.created_by}</TableCell>
                    <TableCell>
                      {new Date(instance.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/app/workflows/instances/${instance.id}/board`)}>
                            <Kanban className="h-4 w-4 mr-2" />
                            Abrir Board
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(instance.id, 'ver')}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {instance.status === 'running' && (
                            <DropdownMenuItem onClick={() => handleAction(instance.id, 'pausar')}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pausar
                            </DropdownMenuItem>
                          )}
                          {instance.status === 'paused' && (
                            <DropdownMenuItem onClick={() => handleAction(instance.id, 'retomar')}>
                              <Play className="h-4 w-4 mr-2" />
                              Retomar
                            </DropdownMenuItem>
                          )}
                          {(instance.status === 'running' || instance.status === 'paused') && (
                            <DropdownMenuItem onClick={() => handleAction(instance.id, 'cancelar')}>
                              <X className="h-4 w-4 mr-2" />
                              Cancelar
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

      <InstanceStartDialog
        open={showNewInstanceDialog}
        onOpenChange={setShowNewInstanceDialog}
        onSuccess={() => {
          setShowNewInstanceDialog(false);
          loadInstances();
          toast({
            title: 'Sucesso',
            description: 'Instância criada com sucesso.',
          });
        }}
      />
    </div>
  );
};