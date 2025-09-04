import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReportsFilters } from '@/components/reports/ReportsFilters';
import { KpiCard } from '@/components/reports/KpiCard';
import { SimpleLineChart } from '@/components/reports/SimpleLineChart';
import { SimpleBarChart } from '@/components/reports/SimpleBarChart';
import { TasksTable } from '@/components/reports/TasksTable';
import { 
  reportsRepo, 
  type ReportsFilter, 
  type TaskDetail,
  type TaskStatusCount,
  type ThroughputData,
  type AgingWipData,
  type WorkloadData
} from '@/data/mc/reportsRepo';

export const Reports = () => {
  const { toast } = useToast();
  
  // State for filters
  const [filters, setFilters] = useState<ReportsFilter>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString()
  });

  // State for data
  const [statusCounts, setStatusCounts] = useState<TaskStatusCount[]>([]);
  const [throughputData, setThroughputData] = useState<ThroughputData[]>([]);
  const [slaCompliance, setSlaCompliance] = useState({ total: 0, met: 0, percentage: 0 });
  const [leadTime, setLeadTime] = useState({ avgLeadTimeHours: 0 });
  const [approvalCycle, setApprovalCycle] = useState({ avgApprovalTimeHours: 0 });
  const [agingWip, setAgingWip] = useState<AgingWipData[]>([]);
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([]);
  const [taskDetails, setTaskDetails] = useState<TaskDetail[]>([]);

  // State for drilldown
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [drilldownTasks, setDrilldownTasks] = useState<TaskDetail[]>([]);

  // Load data when filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          statusData,
          throughput,
          sla,
          leadTimeData,
          approvalData,
          aging,
          workload,
          tasks
        ] = await Promise.all([
          reportsRepo.getTaskStatusCounts(filters),
          reportsRepo.getThroughputData(filters),
          reportsRepo.getSlaCompliance(filters),
          reportsRepo.getLeadTime(filters),
          reportsRepo.getApprovalCycle(filters),
          reportsRepo.getAgingWip(filters),
          reportsRepo.getWorkloadData(filters),
          reportsRepo.getTaskDetails(filters)
        ]);

        setStatusCounts(statusData);
        setThroughputData(throughput);
        setSlaCompliance(sla);
        setLeadTime(leadTimeData);
        setApprovalCycle(approvalData);
        setAgingWip(aging);
        setWorkloadData(workload);
        setTaskDetails(tasks);
      } catch (error) {
        console.error('Error loading reports data:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar dados dos relatórios.',
          variant: 'destructive'
        });
      }
    };

    loadData();
  }, [filters, toast]);

  // Prepare chart data
  const throughputChartData = useMemo(() => 
    throughputData.map(d => ({ label: d.week, value: d.count })), 
    [throughputData]
  );

  const agingChartData = useMemo(() =>
    agingWip.map(d => ({ label: d.bucket, value: d.count })),
    [agingWip]
  );

  const workloadChartData = useMemo(() =>
    workloadData.map(d => ({ 
      label: d.assigneeName || d.assigneeEmail, 
      value: d.total,
      blocked: d.blocked
    })),
    [workloadData]
  );

  // Drilldown handlers
  const handleStatusClick = (status: string) => {
    const filtered = taskDetails.filter(task => task.status === status);
    setDrilldownTasks(filtered);
    setDrilldownTitle(`Tarefas: ${status}`);
    setDrilldownOpen(true);
  };

  const handleThroughputClick = (point: any) => {
    const weekStart = new Date(point.label);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const filtered = taskDetails.filter(task => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= weekStart && completedDate < weekEnd;
    });
    
    setDrilldownTasks(filtered);
    setDrilldownTitle(`Tarefas concluídas na semana de ${weekStart.toLocaleDateString('pt-BR')}`);
    setDrilldownOpen(true);
  };

  const handleAgingClick = (point: any) => {
    const filtered = taskDetails.filter(task => {
      if (!['open', 'in_progress', 'blocked'].includes(task.status)) return false;
      
      const ageDays = task.ageDays;
      switch (point.label) {
        case '0-2 dias': return ageDays <= 2;
        case '3-5 dias': return ageDays >= 3 && ageDays <= 5;
        case '6-10 dias': return ageDays >= 6 && ageDays <= 10;
        case '>10 dias': return ageDays > 10;
        default: return false;
      }
    });
    
    setDrilldownTasks(filtered);
    setDrilldownTitle(`Tarefas WIP: ${point.label}`);
    setDrilldownOpen(true);
  };

  const handleWorkloadClick = (point: any) => {
    const assignee = workloadData.find(w => 
      w.assigneeName === point.label || w.assigneeEmail === point.label
    );
    
    if (!assignee) return;
    
    const filtered = taskDetails.filter(task => 
      task.assigneeUserId === assignee.assigneeUserId &&
      ['open', 'in_progress', 'blocked'].includes(task.status)
    );
    
    setDrilldownTasks(filtered);
    setDrilldownTitle(`Tarefas de ${assignee.assigneeName || assignee.assigneeEmail}`);
    setDrilldownOpen(true);
  };

  // Export CSV function
  const exportToCsv = () => {
    const headers = [
      'ID',
      'Instância',
      'Template',
      'Versão',
      'Tipo',
      'Título',
      'Status',
      'Prioridade',
      'Papel',
      'Responsável',
      'Email',
      'Criada',
      'Iniciada',
      'Prazo',
      'Concluída',
      'SLA (h)',
      'SLA Atendido',
      'Atrasada',
      'Idade (dias)'
    ];

    const csvContent = [
      headers.join(','),
      ...taskDetails.map(task => [
        task.id,
        task.workflowInstanceId,
        task.templateName,
        task.templateVersion,
        task.type,
        `"${task.title}"`,
        task.status,
        task.priority,
        task.assignedRole || '',
        task.assigneeName || '',
        task.assigneeEmail || '',
        task.createdAt,
        task.startedAt || '',
        task.dueAt || '',
        task.completedAt || '',
        task.slaHours || '',
        task.metSla !== undefined ? (task.metSla ? 'Sim' : 'Não') : '',
        task.overdue ? 'Sim' : 'Não',
        task.ageDays
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reports-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export realizado',
      description: 'Arquivo CSV baixado com sucesso.'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Dashboards e métricas operacionais
          </p>
        </div>
        <Button onClick={exportToCsv} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <ReportsFilters filters={filters} onFiltersChange={setFilters} />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statusCounts.map(status => (
          <KpiCard
            key={status.status}
            title={`Tarefas ${status.status}`}
            value={status.count}
            clickable
            onClick={() => handleStatusClick(status.status)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="SLA Compliance"
          value={`${slaCompliance.percentage.toFixed(1)}%`}
          subtitle={`${slaCompliance.met}/${slaCompliance.total} tarefas`}
        />
        <KpiCard
          title="Lead Time Médio"
          value={`${leadTime.avgLeadTimeHours.toFixed(1)}h`}
          subtitle="Tarefas concluídas"
        />
        <KpiCard
          title="Ciclo de Aprovação"
          value={`${approvalCycle.avgApprovalTimeHours.toFixed(1)}h`}
          subtitle="Tempo médio de decisão"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Throughput Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={throughputChartData}
              height={200}
              onPointClick={handleThroughputClick}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aging WIP</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={agingChartData}
              height={200}
              onBarClick={handleAgingClick}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Workload por Responsável</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={workloadChartData}
              height={200}
              horizontal
              onBarClick={handleWorkloadClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Drilldown Sheet */}
      <Sheet open={drilldownOpen} onOpenChange={setDrilldownOpen}>
        <SheetContent className="w-full max-w-6xl">
          <SheetHeader>
            <SheetTitle>{drilldownTitle}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <TasksTable 
              tasks={drilldownTasks}
              onInstanceClick={(instanceId) => {
                // Navigate to workflow instance board
                window.open(`/app/workflows/instances/${instanceId}`, '_blank');
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};