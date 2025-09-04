export interface Client {
  id: string;
  display_name: string;
  legal_name?: string;
  tax_id?: string;
  website?: string;
  status: 'active' | 'inactive';
  metadata: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  display_name: string;
  legal_name?: string;
  tax_id?: string;
  website?: string;
  status?: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}

class ClientsRepository {
  async list(): Promise<Client[]> {
    try {
      // Return mock data for now
      return [
        {
          id: 'demo-client-1',
          display_name: 'Cliente Demo',
          legal_name: 'Cliente Demo Ltda',
          tax_id: '12.345.678/0001-90',
          website: 'https://clientedemo.com',
          status: 'active' as const,
          metadata: {},
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'cliente-exemplo-2',
          display_name: 'Empresa Exemplo',
          legal_name: 'Empresa Exemplo S.A.',
          status: 'active' as const,
          metadata: {},
          created_by: 'system',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
    } catch (error) {
      console.error('Clients repository error:', error);
      throw error;
    }
  }

  async get(id: string): Promise<Client | null> {
    try {
      const clients = await this.list();
      return clients.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Clients repository error:', error);
      return null;
    }
  }

  async create(input: CreateClientInput): Promise<Client> {
    try {
      console.log('Creating client (simulated):', input);
      
      return {
        id: `client-${Date.now()}`,
        ...input,
        status: input.status || 'active',
        metadata: input.metadata || {},
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Clients repository error:', error);
      throw error;
    }
  }

  async update(id: string, input: UpdateClientInput): Promise<Client> {
    try {
      console.log('Updating client (simulated):', { id, input });
      
      const client = await this.get(id);
      if (!client) throw new Error('Client not found');

      return {
        ...client,
        ...input,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Clients repository error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log('Deactivating client (simulated):', id);
    } catch (error) {
      console.error('Clients repository error:', error);
      throw error;
    }
  }
}

export const clientsRepo = new ClientsRepository();