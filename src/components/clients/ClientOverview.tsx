import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, ExternalLink, Eye, Share, Users, Activity, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { instancesRepo, tasksRepo, templatesRepo } from '@/data/mc';
import type { WorkflowInstance, Task, WorkflowTemplate } from '@/types/mc';
import { InstanceSummaryCard } from './InstanceSummaryCard';
import { useToast } from '@/hooks/use-toast';

interface ServiceGroup {
  serviceId: string | null;
  instances: WorkflowInstance[];
}

export const ClientOverview = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  useEffect(() => {
    const loadClientData = async () => {
      if (!clientId) {
        navigate('/app/clients');
        return;
      }

      try {
        setLoading(true);
        const [allInstances, templatesData] = await Promise.all([
          instancesRepo.listMineOrParticipant(),
          templatesRepo.listActive()
        ]);

        setTemplates(templatesData);
        
        // Filter instances for this client
        const clientInstances = allInstances.filter(
          instance => instance.client_id === decodeURIComponent(clientId)
        );

        if (clientInstances.length === 0) {
          toast({
            title: 'Cliente não encontrado',
            description: 'Você não tem permissão para acessar este cliente ou ele não existe.',
            variant: 'destructive',
          });
          navigate('/app/clients');
          return;
        }

        setInstances(clientInstances);
      } catch (error) {
        console.error('Error loading client data:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do cliente.',
          variant: 'destructive',
        });
        navigate('/app/clients');
      } finally {
        setLoading(false);
      }
    };

    loadClientData();
  }, [clientId, navigate, toast]);

  const getFilteredInstances = () => {
    let filtered = instances;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(instance => instance.status === statusFilter);
    }

    // Domain filter
    if (domainFilter !== 'all') {
      filtered = filtered.filter(instance => {
        const template = templates.find(t => t.id === instance.template_id);
        return template?.domain === domainFilter;
      });
    }

    return filtered;
  };

  const groupInstancesByService = (instances: WorkflowInstance[]): ServiceGroup[] => {
    const grouped = new Map<string | null, WorkflowInstance[]>();
    
    instances.forEach(instance => {
      const serviceId = instance.service_id || null;
      if (!grouped.has(serviceId)) {
        grouped.set(serviceId, []);
      }
      grouped.get(serviceId)!.push(instance);
    });

    return Array.from(grouped.entries()).map(([serviceId, instances]) => ({
      serviceId,
      instances: instances.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }));
  };

  const getStats = () => {
    const filtered = getFilteredInstances();
    return {
      total: filtered.length,
      running: filtered.filter(i => i.status === 'running').length,
      paused: filtered.filter(i => i.status === 'paused').length,
      done: filtered.filter(i => i.status === 'done').length,
      canceled: filtered.filter(i => i.status === 'canceled').length,
    };
  };

  const getUniqueDomains = () => {
    const domains = new Set<string>();
    instances.forEach(instance => {
      const template = templates.find(t => t.id === instance.template_id);
      if (template?.domain) {
        domains.add(template.domain);
      }
    });
    return Array.from(domains);
  };

  const handleExportCSV = async () => {
    try {
      const csvData = [];
      const filtered = getFilteredInstances();
      
      for (const instance of filtered) {
        const template = templates.find(t => t.id === instance.template_id);
        const tasks = await tasksRepo.listByInstance(instance.id);
        
        const doneCount = tasks.filter(t => t.status === 'done').length;
        const total = tasks.length;
        const progress = total > 0 ? Math.floor((doneCount / total) * 100) : 0;
        
        const overdueTasks = tasks.filter(t => t.due_at && new Date(t.due_at) < new Date()).length;
        const todayTasks = tasks.filter(t => {
          if (!t.due_at) return false;
          const taskDate = new Date(t.due_at).toDateString();
          const today = new Date().toDateString();
          return taskDate === today;
        }).length;
        const noDueDateTasks = tasks.filter(t => !t.due_at && ['open', 'in_progress'].includes(t.status)).length;
        
        const lastUpdate = tasks.reduce((latest, task) => {
          const taskUpdate = task.completed_at || task.started_at || task.created_at;
          return new Date(taskUpdate) > new Date(latest) ? taskUpdate : latest;
        }, instance.created_at);

        csvData.push({
          instance_id: instance.id,
          template: template?.name || 'N/A',
          versao: template?.version || 'N/A',
          status: instance.status,
          progresso: `${progress}%`,
          atrasadas: overdueTasks,
          hoje: todayTasks,
          sem_prazo: noDueDateTasks,
          ultima_atualizacao: new Date(lastUpdate).toLocaleDateString('pt-BR')
        });
      }

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cliente-${clientId}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: 'Exportação concluída',
        description: 'O arquivo CSV foi baixado com sucesso.',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = getStats();
  const filteredInstances = getFilteredInstances();
  const serviceGroups = groupInstancesByService(filteredInstances);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/app/clients')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              {decodeURIComponent(clientId!)}
            </h1>
            <p className="text-muted-foreground">Portal do Cliente</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2"
            disabled={filteredInstances.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled
          >
            <Share className="h-4 w-4" />
            Gerar Link (em breve)
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold text-primary">{stats.running}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-primary"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pausadas</p>
                <p className="text-2xl font-bold text-orange-500">{stats.paused}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-500">{stats.done}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Canceladas</p>
                <p className="text-2xl font-bold text-red-500">{stats.canceled}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status da Instância</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="running">Em Andamento</SelectItem>
                  <SelectItem value="paused">Pausadas</SelectItem>
                  <SelectItem value="done">Concluídas</SelectItem>
                  <SelectItem value="canceled">Canceladas</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Services and Instances */}
      {serviceGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma instância encontrada</h3>
            <p className="text-muted-foreground text-center">
              Não foram encontradas instâncias para os filtros selecionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        serviceGroups.map((serviceGroup) => (
          <Card key={serviceGroup.serviceId || 'no-service'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Activity className="h-3 w-3" />
                  Serviço
                </Badge>
                {serviceGroup.serviceId || 'Sem serviço definido'}
                <Badge variant="secondary" className="ml-auto">
                  {serviceGroup.instances.length} {serviceGroup.instances.length === 1 ? 'instância' : 'instâncias'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {serviceGroup.instances.map((instance) => (
                  <InstanceSummaryCard 
                    key={instance.id} 
                    instance={instance} 
                    template={templates.find(t => t.id === instance.template_id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};