import { supabase } from '@/integrations/supabase/client';
import type { WorkflowTemplate, CreateTemplateInput } from '@/types/mc';

class TemplatesRepository {
  async listActive(): Promise<WorkflowTemplate[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('workflow_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('workflow_templates')
        .insert({
          ...template,
          version: template.version || 1,
          is_active: template.is_active !== false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Templates repository error:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<CreateTemplateInput>): Promise<WorkflowTemplate> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('workflow_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Templates repository error:', error);
      throw error;
    }
  }
}

export const templatesRepo = new TemplatesRepository();