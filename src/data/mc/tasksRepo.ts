import { supabase } from '@/integrations/supabase/client';
import type { Task, CreateTaskInput, UpdateTaskInput, Comment } from '@/types/mc';

class TasksRepository {
  async listByInstance(instanceId: string): Promise<Task[]> {
    try {
      // Return mock tasks for now
      return [
        {
          id: 'task-1',
          workflow_instance_id: instanceId,
          node_id: 'start',
          type: 'form',
          title: 'Coletar insumos do projeto',
          status: 'open',
          priority: 2,
          assigned_role: 'CS',
          assignee_user_id: 'current-user',
          sla_hours: 24,
          fields: {
            form_url: 'https://forms.example.com/requirements',
            client_contact: 'cliente@exemplo.com'
          },
          created_by: 'current-user',
          created_at: new Date().toISOString()
        },
        {
          id: 'task-2',
          workflow_instance_id: instanceId,
          node_id: 'ux_brief',
          type: 'task',
          title: 'Briefing UX/Wireframes',
          status: 'open',
          priority: 3,
          assigned_role: 'Designer',
          sla_hours: 72,
          fields: {
            figma_url: '',
            wireframes_ready: false
          },
          created_by: 'current-user',
          created_at: new Date().toISOString()
        },
        {
          id: 'task-3',
          workflow_instance_id: instanceId,
          node_id: 'front_impl',
          type: 'task',
          title: 'Implementação Front-end',
          status: 'open',
          priority: 4,
          assigned_role: 'FrontEnd',
          fields: {
            repo_url: 'https://github.com/cupcode/projeto-exemplo',
            tech_stack: 'React + TypeScript + Tailwind'
          },
          created_by: 'current-user',
          created_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }

  async get(id: string): Promise<Task | null> {
    try {
      const tasks = await this.listByInstance('instance-1');
      return tasks.find(t => t.id === id) || null;
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }

  async create(task: CreateTaskInput): Promise<Task> {
    try {
      console.log('Creating task (simulated):', task);

      const newTask: Task = {
        id: `task-${Date.now()}`,
        workflow_instance_id: task.workflow_instance_id,
        node_id: task.node_id,
        type: task.type,
        title: task.title,
        status: task.status || 'open',
        priority: task.priority || 3,
        assigned_role: task.assigned_role,
        assignee_user_id: task.assignee_user_id,
        due_at: task.due_at,
        sla_hours: task.sla_hours,
        fields: task.fields || {},
        created_by: 'current-user',
        created_at: new Date().toISOString()
      };

      return newTask;
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }

  async update(id: string, updates: UpdateTaskInput): Promise<Task> {
    try {
      console.log('Updating task (simulated):', { id, updates });

      const existing = await this.get(id);
      if (!existing) {
        throw new Error('Tarefa não encontrada');
      }

      return {
        ...existing,
        ...updates
      };
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }

  async addComment(taskId: string, body: string, attachments: Array<{name: string; url: string}> = []): Promise<Comment> {
    try {
      console.log('Adding comment (simulated):', { taskId, body, attachments });

      const comment: Comment = {
        id: `comment-${Date.now()}`,
        task_id: taskId,
        author_user_id: 'current-user',
        body,
        attachments,
        created_at: new Date().toISOString()
      };

      return comment;
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }

  async getComments(taskId: string): Promise<Comment[]> {
    try {
      // Return mock comments
      return [
        {
          id: 'comment-1',
          task_id: taskId,
          author_user_id: 'current-user',
          body: 'Tarefa criada automaticamente pelo seed. Cliente enviou os requisitos iniciais por email.',
          attachments: [],
          created_at: new Date().toISOString()
        },
        {
          id: 'comment-2',
          task_id: taskId,
          author_user_id: 'current-user',
          body: 'Aguardando aprovação da tarefa anterior para iniciar o briefing UX.',
          attachments: [],
          created_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }
}

export const tasksRepo = new TasksRepository();