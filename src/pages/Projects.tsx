import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FolderKanban, Users, Calendar, MoreVertical } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Ativo', variant: 'default' as const },
      planning: { label: 'Planejamento', variant: 'secondary' as const },
      completed: { label: 'Concluído', variant: 'outline' as const },
      paused: { label: 'Pausado', variant: 'destructive' as const },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.active;
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/app/projects/${projectId}/board`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-tomorrow font-bold">Projetos</h2>
          <p className="text-muted-foreground">Gerencie todos os seus projetos em um só lugar</p>
        </div>
        
        <Button className="bg-gradient-primary hover:shadow-primary transition-all duration-300">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const statusBadge = getStatusBadge(project.status);
          const progressColor = project.progress >= 75 ? 'bg-green-500' : 
                               project.progress >= 50 ? 'bg-primary' : 
                               project.progress >= 25 ? 'bg-yellow-500' : 'bg-red-500';

          return (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => handleProjectClick(project.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    <Badge variant={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
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
                  {project.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {project.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tarefas</span>
                  <span className="font-medium">
                    {project.completedTasks}/{project.tasksCount}
                  </span>
                </div>

                {/* Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {project.team.length} membros
                    </span>
                  </div>
                  
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 bg-gradient-primary rounded-full border-2 border-background flex items-center justify-center text-xs text-white font-medium"
                        title={member}
                      >
                        {member.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                    {project.team.length > 3 && (
                      <div className="w-8 h-8 bg-muted rounded-full border-2 border-background flex items-center justify-center text-xs font-medium">
                        +{project.team.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Deadline */}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Entrega</span>
                  </div>
                  <span className="font-medium">
                    {new Date(project.deadline).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Tente ajustar sua busca.' : 'Crie seu primeiro projeto para começar.'}
          </p>
          {!searchTerm && (
            <Button className="bg-gradient-primary hover:shadow-primary transition-all duration-300">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Projeto
            </Button>
          )}
        </div>
      )}
    </div>
  );
};