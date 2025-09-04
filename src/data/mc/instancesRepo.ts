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
      // Return enhanced mock data with client and service information
      return [
        {
          id: 'instance-1',
          template_id: 'template-1',
          template_version: 1,
          status: 'running',
          client_id: 'demo-client-1',
          service_id: 'dev-fe-1',
          variables: { 
            project_name: 'Projeto de Desenvolvimento Frontend',
            client_name: 'Cliente Demo'
          },
          created_by: 'current-user',
          created_at: new Date().toISOString(),
          client_name: 'Cliente Demo',
          service_name: 'Desenvolvimento Frontend'
        },
        {
          id: 'instance-2',
          template_id: 'template-2',
          template_version: 1,
          status: 'paused',
          client_id: 'demo-client-1',
          service_id: 'traffic-1',
          variables: { 
            project_name: 'Campanha de Tráfego Pago',
            client_name: 'Cliente Demo'
          },
          created_by: 'current-user',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          client_name: 'Cliente Demo',
          service_name: 'Tráfego Pago'
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