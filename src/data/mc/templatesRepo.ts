import { supabase } from '@/integrations/supabase/client';
import type { WorkflowTemplate, CreateTemplateInput } from '@/types/mc';

class TemplatesRepository {
  async listActive(): Promise<WorkflowTemplate[]> {
    try {
      // Use a raw SQL query since the mc schema is not in the generated types yet
      const { data, error } = await supabase.rpc('get_assets_with_usage'); // Use existing function to access DB
      if (error) {
        console.log('MC schema not accessible through typed client, using simulated data');
      }

      // For now, return mock data until the schema types are regenerated
      return [
        {
          id: 'template-1',
          name: 'Onboarding – Desenvolvimento', 
          version: 1,
          domain: 'development',
          spec: {
            nodes: [
              { id: "start", type: "form", title: "Coletar insumos", role: "CS", sla_hours: 24, outputs: ["ok"] },
              { id: "repo", type: "automation", title: "Criar repositório", role: "PO", requires: ["start"], outputs: ["ok", "erro"] },
              { id: "ux_brief", type: "task", title: "Briefing UX/Wireframes", role: "Designer", requires: ["repo"], sla_hours: 72 },
              { id: "ui_approval", type: "approval", title: "Aprovação UI interna", role: "Aprovador", requires: ["ux_brief"], outputs: ["aprovado", "mudancas"] },
              { id: "front_impl", type: "task", title: "Implementação Front-end", role: "FrontEnd", requires: ["ui_approval:aprovado"] },
              { id: "qa_gate", type: "approval", title: "QA & Checklist", role: "QA", requires: ["front_impl"], outputs: ["ok", "bugs"] },
              { id: "handoff", type: "task", title: "Handoff Go-Live", role: "PO", requires: ["qa_gate:ok"] }
            ]
          },
          is_active: true,
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Templates repository error:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<WorkflowTemplate | null> {
    try {
      const templates = await this.listActive();
      return templates.find(t => t.id === id) || null;
    } catch (error) {
      console.error('Templates repository error:', error);
      throw error;
    }
  }

  async create(template: CreateTemplateInput): Promise<WorkflowTemplate> {
    try {
      // Since we can't use the MC schema yet, simulate successful creation
      console.log('Creating template (simulated):', template);
      
      const newTemplate: WorkflowTemplate = {
        id: `template-${Date.now()}`,
        name: template.name,
        version: template.version || 1,
        domain: template.domain,
        spec: template.spec,
        is_active: template.is_active ?? true,
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return newTemplate;
    } catch (error) {
      console.error('Templates repository error:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<CreateTemplateInput>): Promise<WorkflowTemplate> {
    try {
      // Simulate update
      console.log('Updating template (simulated):', { id, updates });
      
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error('Template não encontrado');
      }

      return {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Templates repository error:', error);
      throw error;
    }
  }
}

export const templatesRepo = new TemplatesRepository();