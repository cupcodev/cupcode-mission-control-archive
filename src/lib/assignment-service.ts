import { rolesRepo } from '@/data/mc/rolesRepo';
import { tasksRepo } from '@/data/mc/tasksRepo';
import { supabase } from '@/integrations/supabase/client';

export interface AssignmentResult {
  success: boolean;
  assigned?: string; // user_id
  error?: string;
}

export interface BulkAssignmentResult {
  total: number;
  assigned: number;
  failed: Array<{ taskId: string; error: string; role?: string }>;
}

class AssignmentService {
  async getNextAssignee(roleName: string): Promise<string | null> {
    try {
      // Get active members for the role, ordered by order_index
      const members = await rolesRepo.listMembers(roleName);
      const activeMembers = members.filter(m => m.is_active);
      
      if (activeMembers.length === 0) {
        return null;
      }

      // Get assignment rule to find last assigned user
      const rule = await rolesRepo.getAssignmentRule(roleName);
      const lastAssignedUserId = rule?.last_assigned_user_id;

      // If no last assigned user or strategy is manual, return first active member
      if (!lastAssignedUserId || rule?.strategy === 'manual') {
        return activeMembers[0].user_id;
      }

      // Find current position and return next user (round-robin)
      const currentIndex = activeMembers.findIndex(m => m.user_id === lastAssignedUserId);
      const nextIndex = (currentIndex + 1) % activeMembers.length;
      
      return activeMembers[nextIndex].user_id;
    } catch (error) {
      console.error('Error getting next assignee:', error);
      return null;
    }
  }

  async assignTaskByRole(taskId: string): Promise<AssignmentResult> {
    try {
      // Get task to check assigned_role
      const task = await tasksRepo.get(taskId);
      if (!task) {
        return { success: false, error: 'Tarefa não encontrada' };
      }

      if (!task.assigned_role) {
        return { success: false, error: 'Tarefa não possui função definida' };
      }

      // Get next assignee for the role
      const nextUserId = await this.getNextAssignee(task.assigned_role);
      if (!nextUserId) {
        return { success: false, error: `Nenhum membro ativo encontrado para a função "${task.assigned_role}"` };
      }

      // Update task assignee
      await tasksRepo.update(taskId, {
        assignee_user_id: nextUserId
      });

      // Update assignment rule with new last assigned user
      await rolesRepo.upsertAssignmentRule(task.assigned_role, 'round_robin', nextUserId);

      // Try to log activity (ignore if RLS denies)
      try {
        const { data: currentUser } = await supabase.auth.getUser();
        if (currentUser.user) {
          // TODO: When mc.activity_logs is available, uncomment:
          // await supabase.from('activity_logs').insert({...});
          console.log('Auto-assignment logged:', { taskId, nextUserId, assigned_role: task.assigned_role });
        }
      } catch (logError) {
        // Ignore log errors - assignment still succeeded
        console.warn('Could not log auto-assignment activity:', logError);
      }

      return { success: true, assigned: nextUserId };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao atribuir tarefa' };
    }
  }

  async bulkAssignUnassigned(instanceId: string): Promise<BulkAssignmentResult> {
    const result: BulkAssignmentResult = {
      total: 0,
      assigned: 0,
      failed: []
    };

    try {
      // Get all unassigned tasks for the instance
      const tasks = await tasksRepo.listByInstance(instanceId);
      const unassignedTasks = tasks.filter(t => !t.assignee_user_id);
      
      result.total = unassignedTasks.length;

      // Assign each unassigned task
      for (const task of unassignedTasks) {
        if (!task.assigned_role) {
          result.failed.push({
            taskId: task.id,
            error: 'Função não definida'
          });
          continue;
        }

        const assignResult = await this.assignTaskByRole(task.id);
        if (assignResult.success) {
          result.assigned++;
        } else {
          result.failed.push({
            taskId: task.id,
            role: task.assigned_role,
            error: assignResult.error || 'Erro desconhecido'
          });
        }
      }

      // Try to log bulk assignment activity
      try {
        const { data: currentUser } = await supabase.auth.getUser();
        if (currentUser.user) {
          // TODO: When mc.activity_logs is available, uncomment:
          // await supabase.from('activity_logs').insert({...});
          console.log('Bulk assignment logged:', { instanceId, result });
        }
      } catch (logError) {
        console.warn('Could not log bulk assignment activity:', logError);
      }

    } catch (error: any) {
      result.failed.push({
        taskId: 'bulk',
        error: error.message || 'Erro ao carregar tarefas'
      });
    }

    return result;
  }
}

export const assignmentService = new AssignmentService();