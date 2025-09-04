import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, TrendingUp, Users, FolderKanban, AlertTriangle } from 'lucide-react';

// Mock data para a overview
const mockStats = {
  activeTasks: 24,
  pendingApprovals: 8,
  slaOnTimePct: 94
};

const mockRecentProjects = [
  { id: 'proj-001', name: 'Website Redesign', status: 'active', progress: 75 },
  { id: 'proj-002', name: 'Mobile App Update', status: 'review', progress: 90 },
  { id: 'proj-003', name: 'API Integration', status: 'planning', progress: 25 },
];

const mockRecentActivity = [
  { id: 1, action: 'Task "Landing Page" foi concluída', time: '2 min atrás', user: 'João Silva' },
  { id: 2, action: 'Projeto "Mobile App" entrou em revisão', time: '15 min atrás', user: 'Maria Santos' },
  { id: 3, action: 'Nova aprovação pendente em "API Integration"', time: '1h atrás', user: 'Pedro Costa' },
];

export const Overview = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-primary/20 hover:border-primary/40 transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-tomorrow font-bold text-primary">
              {mockStats.activeTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% desde a semana passada
            </p>
          </CardContent>
        </Card>

        <Card className="border border-secondary/20 hover:border-secondary/40 transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-tomorrow font-bold text-secondary">
              {mockStats.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground">
              -3 desde ontem
            </p>
          </CardContent>
        </Card>

        <Card className="border border-green-500/20 hover:border-green-500/40 transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLAs no Prazo</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-tomorrow font-bold text-green-500">
              {mockStats.slaOnTimePct}%
            </div>
            <p className="text-xs text-muted-foreground">
              +2% este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              <span>Projetos Recentes</span>
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso dos seus projetos ativos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockRecentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium">{project.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{project.progress}%</span>
                  </div>
                </div>
                <Badge 
                  variant={
                    project.status === 'active' ? 'default' : 
                    project.status === 'review' ? 'secondary' : 'outline'
                  }
                >
                  {project.status === 'active' ? 'Ativo' : 
                   project.status === 'review' ? 'Revisão' : 'Planejamento'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-secondary" />
              <span>Atividade Recente</span>
            </CardTitle>
            <CardDescription>
              Últimas atualizações da equipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.action}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{activity.user}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <span>Ações Rápidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background/50 rounded-lg border cursor-pointer hover:bg-background/70 transition-colors">
              <h4 className="font-medium mb-2">Criar Projeto</h4>
              <p className="text-sm text-muted-foreground">Inicie um novo projeto no Mission Control</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg border cursor-pointer hover:bg-background/70 transition-colors">
              <h4 className="font-medium mb-2">Revisar Aprovações</h4>
              <p className="text-sm text-muted-foreground">8 aprovações aguardando sua decisão</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg border cursor-pointer hover:bg-background/70 transition-colors">
              <h4 className="font-medium mb-2">Ver Relatórios</h4>
              <p className="text-sm text-muted-foreground">Acompanhe métricas e performance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};