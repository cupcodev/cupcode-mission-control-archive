import { supabase } from '@/integrations/supabase/client';

export interface ReportsFilter {
  startDate: string;
  endDate: string;
  domain?: string;
  clientId?: string;
  serviceId?: string;
  instanceId?: string;
  assignedRole?: string;
  assigneeUserId?: string;
  status?: string[];
}

export interface TaskStatusCount {
  status: string;
  count: number;
}

export interface ThroughputData {
  week: string;
  count: number;
}

export interface SlaCompliance {
  total: number;
  met: number;
  percentage: number;
}

export interface LeadTimeData {
  avgLeadTimeHours: number;
}

export interface ApprovalCycleData {
  avgApprovalTimeHours: number;
}

export interface AgingWipData {
  bucket: string;
  count: number;
}

export interface WorkloadData {
  assigneeUserId: string;
  assigneeEmail: string;
  assigneeName: string;
  total: number;
  blocked: number;
}

export interface TaskDetail {
  id: string;
  workflowInstanceId: string;
  templateName: string;
  templateVersion: number;
  type: string;
  title: string;
  status: string;
  priority: number;
  assignedRole?: string;
  assigneeUserId?: string;
  assigneeEmail?: string;
  assigneeName?: string;
  createdAt: string;
  startedAt?: string;
  dueAt?: string;
  completedAt?: string;
  slaHours?: number;
  metSla?: boolean;
  overdue: boolean;
  ageDays: number;
}

class ReportsRepository {
  private buildWhereClause(filters: ReportsFilter): { whereClause: string; params: any } {
    const conditions: string[] = [];
    const params: any = {};

    // Base date filter
    conditions.push('t.created_at >= $1::timestamptz');
    conditions.push('t.created_at <= $2::timestamptz');
    params[1] = filters.startDate;
    params[2] = filters.endDate;

    let paramCount = 2;

    if (filters.domain) {
      paramCount++;
      conditions.push(`wt.domain = $${paramCount}`);
      params[paramCount] = filters.domain;
    }

    if (filters.clientId) {
      paramCount++;
      conditions.push(`wi.client_id = $${paramCount}`);
      params[paramCount] = filters.clientId;
    }

    if (filters.serviceId) {
      paramCount++;
      conditions.push(`wi.service_id = $${paramCount}`);
      params[paramCount] = filters.serviceId;
    }

    if (filters.instanceId) {
      paramCount++;
      conditions.push(`t.workflow_instance_id = $${paramCount}`);
      params[paramCount] = filters.instanceId;
    }

    if (filters.assignedRole) {
      paramCount++;
      conditions.push(`t.assigned_role = $${paramCount}`);
      params[paramCount] = filters.assignedRole;
    }

    if (filters.assigneeUserId) {
      paramCount++;
      conditions.push(`t.assignee_user_id = $${paramCount}`);
      params[paramCount] = filters.assigneeUserId;
    }

    if (filters.status && filters.status.length > 0) {
      paramCount++;
      conditions.push(`t.status = ANY($${paramCount})`);
      params[paramCount] = filters.status;
    }

    return {
      whereClause: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
      params
    };
  }

  async getTaskStatusCounts(filters: ReportsFilter): Promise<TaskStatusCount[]> {
    try {
      // Return mock data for now
      return [
        { status: 'open', count: 15 },
        { status: 'in_progress', count: 8 },
        { status: 'blocked', count: 3 },
        { status: 'done', count: 24 },
        { status: 'rejected', count: 1 }
      ];
    } catch (error) {
      console.error('Reports repository error:', error);
      throw error;
    }
  }

  async getThroughputData(filters: ReportsFilter): Promise<ThroughputData[]> {
    try {
      // Return mock data for now
      const weeks = [];
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      let currentWeek = new Date(startDate);
      while (currentWeek <= endDate) {
        weeks.push({
          week: currentWeek.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + 1
        });
        currentWeek.setDate(currentWeek.getDate() + 7);
      }
      
      return weeks;
    } catch (error) {
      console.error('Reports repository error:', error);
      throw error;
    }
  }

  async getSlaCompliance(filters: ReportsFilter): Promise<SlaCompliance> {
    try {
      // Return mock data for now
      return {
        total: 45,
        met: 38,
        percentage: 84.4
      };
    } catch (error) {
      console.error('Reports repository error:', error);
      throw error;
    }
  }

  async getLeadTime(filters: ReportsFilter): Promise<LeadTimeData> {
    try {
      // Return mock data for now
      return {
        avgLeadTimeHours: 18.5
      };
    } catch (error) {
      console.error('Reports repository error:', error);
      throw error;
    }
  }

  async getApprovalCycle(filters: ReportsFilter): Promise<ApprovalCycleData> {
    try {
      // Return mock data for now
      return {
        avgApprovalTimeHours: 6.2
      };
    } catch (error) {
      console.error('Reports repository error:', error);
      throw error;
    }
  }

  async getAgingWip(filters: ReportsFilter): Promise<AgingWipData[]> {
    try {
      // Return mock data for now
      return [
        { bucket: '0-2 dias', count: 12 },
        { bucket: '3-5 dias', count: 8 },
        { bucket: '6-10 dias', count: 4 },
        { bucket: '>10 dias', count: 2 }
      ];
    } catch (error) {
      console.error('Reports repository error:', error);
      throw error;
    }
  }

  async getWorkloadData(filters: ReportsFilter): Promise<WorkloadData[]> {
    try {
      // Return mock data for now
      return [
        {
          assigneeUserId: 'user-1',
          assigneeEmail: 'designer@empresa.com',
          assigneeName: 'Ana Silva',
          total: 7,
          blocked: 1
        },
        {
          assigneeUserId: 'user-2',
          assigneeEmail: 'dev@empresa.com',
          assigneeName: 'Carlos Santos',
          total: 5,
          blocked: 0
        },
        {
          assigneeUserId: 'user-3',
          assigneeEmail: 'cs@empresa.com',
          assigneeName: 'Mariana Costa',
          total: 9,
          blocked: 2
        }
      ];
    } catch (error) {
      console.error('Reports repository error:', error);
      throw error;
    }
  }

  async getTaskDetails(filters: ReportsFilter): Promise<TaskDetail[]> {
    try {
      // Return mock data for now
      return [
        {
          id: 'task-1',
          workflowInstanceId: 'instance-1',
          templateName: 'Projeto Website',
          templateVersion: 1,
          type: 'task',
          title: 'Briefing UX/Wireframes',
          status: 'in_progress',
          priority: 3,
          assignedRole: 'Designer',
          assigneeUserId: 'user-1',
          assigneeEmail: 'designer@empresa.com',
          assigneeName: 'Ana Silva',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          slaHours: 72,
          metSla: undefined,
          overdue: false,
          ageDays: 2
        },
        {
          id: 'task-2',
          workflowInstanceId: 'instance-1',
          templateName: 'Projeto Website',
          templateVersion: 1,
          type: 'form',
          title: 'Coletar insumos do projeto',
          status: 'done',
          priority: 2,
          assignedRole: 'CS',
          assigneeUserId: 'user-3',
          assigneeEmail: 'cs@empresa.com',
          assigneeName: 'Mariana Costa',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          slaHours: 24,
          metSla: true,
          overdue: false,
          ageDays: 5
        }
      ];
    } catch (error) {
      console.error('Reports repository error:', error);
      throw error;
    }
  }
}

export const reportsRepo = new ReportsRepository();