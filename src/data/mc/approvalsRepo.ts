import type { Approval } from '@/types/mc';

// Mock data for now - will connect to Supabase later
const mockApprovals: Approval[] = [
  {
    id: '1',
    task_id: 'task-1',
    approver_user_id: 'user-1',
    decision: 'approved',
    reason: 'Looks good to proceed',
    artifacts: [],
    decided_at: '2024-01-15T10:30:00Z'
  }
];

export const approvalsRepo = {
  async create(approval: Omit<Approval, 'id' | 'decided_at'>): Promise<Approval> {
    const newApproval: Approval = {
      ...approval,
      id: `approval-${Date.now()}`,
      decided_at: new Date().toISOString()
    };
    
    mockApprovals.push(newApproval);
    return newApproval;
  },

  async listByTask(taskId: string): Promise<Approval[]> {
    return mockApprovals.filter(approval => approval.task_id === taskId);
  },

  async get(id: string): Promise<Approval | null> {
    return mockApprovals.find(approval => approval.id === id) || null;
  }
};