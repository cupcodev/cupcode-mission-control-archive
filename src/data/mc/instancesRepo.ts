import { supabase } from '@/integrations/supabase/client';
import type { WorkflowInstance, CreateInstanceInput, InstanceParticipant } from '@/types/mc';

class InstancesRepository {
  async createFromTemplate(
    templateId: string, 
    variables: Record<string, any> = {}
  ): Promise<WorkflowInstance> {
    try {
      // Simulate instance creation since MC schema is not in types yet
      console.log('Creating instance (simulated):', { templateId, variables });

      const newInstance: WorkflowInstance = {
        id: `instance-${Date.now()}`,
        template_id: templateId,
        template_version: 1,
        status: 'running',
        client_id: variables.client_id,
        service_id: variables.service_id,
        variables,
        created_by: 'current-user',
        created_at: new Date().toISOString()
      };

      return newInstance;
    } catch (error) {
      console.error('Instances repository error:', error);
      throw error;
    }
  }

  async listMineOrParticipant(): Promise<WorkflowInstance[]> {
    try {
      // Return mock instances for now
      return [
        {
          id: 'instance-1',
          template_id: 'template-1',
          template_version: 1,
          status: 'running',
          variables: { project_name: 'Projeto de Teste', client_name: 'Cliente Exemplo' },
          created_by: 'current-user',
          created_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Instances repository error:', error);
      throw error;
    }
  }

  async get(id: string): Promise<WorkflowInstance | null> {
    try {
      const instances = await this.listMineOrParticipant();
      return instances.find(i => i.id === id) || null;
    } catch (error) {
      console.error('Instances repository error:', error);
      throw error;
    }
  }

  async addParticipant(
    instanceId: string, 
    userId: string, 
    roleInInstance?: string, 
    isClient: boolean = false
  ): Promise<InstanceParticipant> {
    try {
      console.log('Adding participant (simulated):', { instanceId, userId, roleInInstance, isClient });

      const participant: InstanceParticipant = {
        instance_id: instanceId,
        user_id: userId,
        role_in_instance: roleInInstance,
        is_client: isClient,
        added_at: new Date().toISOString()
      };

      return participant;
    } catch (error) {
      console.error('Instances repository error:', error);
      throw error;
    }
  }

  async getParticipants(instanceId: string): Promise<InstanceParticipant[]> {
    try {
      // Return mock participants
      return [
        {
          instance_id: instanceId,
          user_id: 'current-user',
          role_in_instance: 'PO',
          is_client: false,
          added_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Instances repository error:', error);
      throw error;
    }
  }
}

export const instancesRepo = new InstancesRepository();