export interface ServiceCatalog {
  id: string;
  code: string;
  name: string;
  description?: string;
  domain?: string;
  is_active: boolean;
  metadata: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceInput {
  code: string;
  name: string;
  description?: string;
  domain?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {}

class ServicesCatalogRepository {
  async listActive(): Promise<ServiceCatalog[]> {
    try {
      const services = await this.list();
      return services.filter(s => s.is_active);
    } catch (error) {
      console.error('Services catalog repository error:', error);
      throw error;
    }
  }

  async list(): Promise<ServiceCatalog[]> {
    try {
      // Return mock data for now
      return [
        {
          id: 'dev-fe-1',
          code: 'DEV_FE',
          name: 'Desenvolvimento Frontend',
          description: 'Desenvolvimento de interfaces e experiência do usuário',
          domain: 'development',
          is_active: true,
          metadata: {},
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'dev-be-1',
          code: 'DEV_BE',
          name: 'Desenvolvimento Backend',
          description: 'Desenvolvimento de APIs e sistemas backend',
          domain: 'development',
          is_active: true,
          metadata: {},
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'brand-1',
          code: 'BRAND',
          name: 'Branding',
          description: 'Criação e gestão de marca',
          domain: 'marketing',
          is_active: true,
          metadata: {},
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'traffic-1',
          code: 'TRAFFIC',
          name: 'Tráfego Pago',
          description: 'Gestão de campanhas de marketing digital',
          domain: 'marketing',
          is_active: true,
          metadata: {},
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'support-1',
          code: 'SUPPORT',
          name: 'Suporte',
          description: 'Suporte técnico e atendimento ao cliente',
          domain: 'support',
          is_active: true,
          metadata: {},
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Services catalog repository error:', error);
      throw error;
    }
  }

  async get(id: string): Promise<ServiceCatalog | null> {
    try {
      const services = await this.list();
      return services.find(s => s.id === id) || null;
    } catch (error) {
      console.error('Services catalog repository error:', error);
      return null;
    }
  }

  async create(input: CreateServiceInput): Promise<ServiceCatalog> {
    try {
      console.log('Creating service (simulated):', input);
      
      return {
        id: `service-${Date.now()}`,
        ...input,
        is_active: input.is_active !== false,
        metadata: input.metadata || {},
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Services catalog repository error:', error);
      throw error;
    }
  }

  async update(id: string, input: UpdateServiceInput): Promise<ServiceCatalog> {
    try {
      console.log('Updating service (simulated):', { id, input });
      
      const service = await this.get(id);
      if (!service) throw new Error('Service not found');

      return {
        ...service,
        ...input,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Services catalog repository error:', error);
      throw error;
    }
  }

  async deactivate(id: string): Promise<void> {
    try {
      console.log('Deactivating service (simulated):', id);
    } catch (error) {
      console.error('Services catalog repository error:', error);
      throw error;
    }
  }
}

export const servicesCatalogRepo = new ServicesCatalogRepository();