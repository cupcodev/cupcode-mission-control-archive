import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Eye, Calendar, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { instancesRepo, tasksRepo, templatesRepo } from '@/data/mc';
import type { WorkflowInstance, Task, WorkflowTemplate } from '@/types/mc';

interface ClientSummary {
  clientId: string;
  activeInstances: number;
  completedInstances: number;
  lastUpdate: string;
  instances: WorkflowInstance[];
}

export const ClientsList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);

  useEffect(() => {
    const loadClientsData = async () => {
      try {
        setLoading(true);
        const [instances, templatesData] = await Promise.all([
          instancesRepo.listMineOrParticipant(),
          templatesRepo.listActive()
        ]);

        setTemplates(templatesData);

        // Group instances by client_id
        const clientsMap = new Map<string, ClientSummary>();
        
        for (const instance of instances) {
          if (!instance.client_id) continue;
          
          const clientId = instance.client_id;
          if (!clientsMap.has(clientId)) {
            clientsMap.set(clientId, {
              clientId,
              activeInstances: 0,
              completedInstances: 0,
              lastUpdate: instance.created_at,
              instances: []
            });
          }

          const client = clientsMap.get(clientId)!;
          client.instances.push(instance);
          
          if (instance.status === 'done' || instance.status === 'canceled') {
            client.completedInstances++;
          } else {
            client.activeInstances++;
          }

          // Update last update time
          if (new Date(instance.created_at) > new Date(client.lastUpdate)) {
            client.lastUpdate = instance.created_at;
          }
        }

        // Get latest task updates for each client
        for (const [clientId, client] of clientsMap.entries()) {
          let latestTaskUpdate = client.lastUpdate;
          
          for (const instance of client.instances) {
            try {
              const tasks = await tasksRepo.listByInstance(instance.id);
              for (const task of tasks) {
                const taskUpdate = task.completed_at || task.started_at || task.created_at;
                if (new Date(taskUpdate) > new Date(latestTaskUpdate)) {
                  latestTaskUpdate = taskUpdate;
                }
              }
            } catch (error) {
              console.error(`Error loading tasks for instance ${instance.id}:`, error);
            }
          }
          
          client.lastUpdate = latestTaskUpdate;
        }

        setClients(Array.from(clientsMap.values()));
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClientsData();
  }, []);

  const getFilteredClients = () => {
    let filtered = clients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.clientId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => {
        if (statusFilter === 'active') {
          return client.activeInstances > 0;
        } else if (statusFilter === 'completed') {
          return client.completedInstances > 0 && client.activeInstances === 0;
        }
        return true;
      });
    }

    // Domain filter
    if (domainFilter !== 'all') {
      filtered = filtered.filter(client =>
        client.instances.some(instance => {
          const template = templates.find(t => t.id === instance.template_id);
          return template?.domain === domainFilter;
        })
      );
    }

    // Period filter
    if (periodFilter !== 'all') {
      const now = new Date();
      const daysAgo = parseInt(periodFilter);
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(client =>
        new Date(client.lastUpdate) >= cutoffDate
      );
    }

    return filtered;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUniqueDomains = () => {
    const domains = new Set<string>();
    clients.forEach(client => {
      client.instances.forEach(instance => {
        const template = templates.find(t => t.id === instance.template_id);
        if (template?.domain) {
          domains.add(template.domain);
        }
      });
    });
    return Array.from(domains);
  };

  const filteredClients = getFilteredClients();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Portal do Cliente</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Portal do Cliente</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum projeto disponível</h3>
            <p className="text-muted-foreground text-center">
              Você não tem acesso a nenhum projeto de cliente no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Portal do Cliente</h1>
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          {filteredClients.length} {filteredClients.length === 1 ? 'Cliente' : 'Clientes'}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ID do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Domínio</label>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {getUniqueDomains().map(domain => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.clientId} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{client.clientId}</span>
                <Badge variant="outline" className="shrink-0">
                  Cliente
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {client.activeInstances}
                  </div>
                  <div className="text-sm text-muted-foreground">Ativas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {client.completedInstances}
                  </div>
                  <div className="text-sm text-muted-foreground">Concluídas</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Última atualização: {formatDate(client.lastUpdate)}</span>
              </div>
              
              <Button 
                onClick={() => navigate(`/app/clients/${encodeURIComponent(client.clientId)}`)}
                className="w-full gap-2"
              >
                <Eye className="h-4 w-4" />
                Abrir Cliente
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && clients.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground text-center">
              Tente ajustar os filtros para encontrar os clientes desejados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};