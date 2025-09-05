import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FolderKanban, Users, Calendar, MoreVertical, Clock } from 'lucide-react';
import { instancesRepo } from '@/data/mc';
import type { WorkflowInstance } from '@/types/mc';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data para projetos
const mockProjects = [
  {
    id: 'telescup-v2',
    name: 'Telescup V2.0',
    description: 'Modernização da plataforma de gestão de assets',
    status: 'active',
    progress: 68,
    team: ['João Silva', 'Maria Santos', 'Pedro Costa'],
    deadline: '2024-03-15',
    tasksCount: 24,
    completedTasks: 16
  },
  {
    id: 'mission-control',
    name: 'Mission Control',
    description: 'Sistema de gestão de tarefas e workflows',
    status: 'active',
    progress: 45,
    team: ['Ana Paula', 'Carlos Mendes'],
    deadline: '2024-02-28',
    tasksCount: 18,
    completedTasks: 8
  },
  {
    id: 'api-gateway',
    name: 'API Gateway Refactor',
    description: 'Reestruturação da arquitetura de APIs',
    status: 'planning',
    progress: 15,
    team: ['Roberto Lima', 'Julia Fernandes', 'Lucas Santos'],
    deadline: '2024-04-10',
    tasksCount: 32,
    completedTasks: 5
  }
];

export const Projects = () => {
  const navigate = useNavigate();
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function needs to be declared before being used
  const getProjectName = (instance: WorkflowInstance) => {
    return instance.variables?.project_name || `Projeto ${instance.id.slice(0, 8)}`;
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    try {
      const data = await instancesRepo.listMineOrParticipant();
      setInstances(data);
    } catch (error) {
      console.error('Error loading instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = instances.filter(instance => {
    const projectName = getProjectName(instance);
    const clientName = instance.client_name || '';
    return projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           clientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'done': return 'bg-green-500';
      case 'canceled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running': return 'Em andamento';
      case 'paused': return 'Pausado';
      case 'done': return 'Concluído';
      case 'canceled': return 'Cancelado';
      default: return status;
    }
  };


  const handleProjectClick = (instanceId: string) => {
    navigate(`/app/workflows/instances/${instanceId}/board`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-tomorrow font-bold">Projetos</h2>
          <p className="text-muted-foreground">Gerencie todos os seus projetos em um só lugar</p>
        </div>
        
        <Button 
          onClick={() => navigate('/app/projects/new')}
          className="bg-gradient-primary hover:shadow-primary transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar projetos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando projetos...</p>
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground mb-4">Crie seu primeiro projeto para começar.</p>
          <Button 
            onClick={() => navigate('/app/projects/new')}
            className="bg-gradient-primary hover:shadow-primary transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Projeto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((instance) => {

            return (
              <Card 
                key={instance.id} 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => handleProjectClick(instance.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FolderKanban className="h-5 w-5 text-primary" />
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(instance.status)} mr-2`} />
                        <span className="text-sm text-muted-foreground">{getStatusLabel(instance.status)}</span>
                      </div>
                    </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Duplicar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Arquivar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <CardTitle className="text-lg font-tomorrow group-hover:text-primary transition-colors">
                  {getProjectName(instance)}
                </CardTitle>
                <CardDescription className="text-sm">
                  {instance.client_name || 'Cliente não especificado'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Service */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Serviço</span>
                  <Badge variant="outline">
                    {instance.service_name || 'Não especificado'}
                  </Badge>
                </div>

                {/* Created Date */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Criado em</span>
                  </div>
                  <span className="font-medium">
                    {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Template Version */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Template</span>
                  </div>
                  <span className="font-medium">v{instance.template_version}</span>
                </div>

                {/* Tags */}
                {instance.variables?.tags && instance.variables.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t">
                    {instance.variables.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {instance.variables.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{instance.variables.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty Search State */}
      {!loading && instances.length > 0 && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar sua busca ou criar um novo projeto.
          </p>
        </div>
      )}
    </div>
  );
};