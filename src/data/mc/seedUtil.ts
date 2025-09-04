import { supabase } from '@/integrations/supabase/client';
import { templatesRepo } from './templatesRepo';
import { instancesRepo } from './instancesRepo';
import { tasksRepo } from './tasksRepo';
import type { WorkflowSpec } from '@/types/mc';

// Sample workflow spec for development onboarding
const DEV_ONBOARDING_SPEC: WorkflowSpec = {
  nodes: [
    { 
      id: "start", 
      type: "form", 
      title: "Coletar insumos", 
      role: "CS", 
      sla_hours: 24, 
      outputs: ["ok"] 
    },
    { 
      id: "repo", 
      type: "automation", 
      title: "Criar repositório", 
      role: "PO", 
      requires: ["start"], 
      outputs: ["ok", "erro"] 
    },
    { 
      id: "ux_brief", 
      type: "task", 
      title: "Briefing UX/Wireframes", 
      role: "Designer", 
      requires: ["repo"], 
      sla_hours: 72 
    },
    { 
      id: "ui_approval", 
      type: "approval", 
      title: "Aprovação UI interna", 
      role: "Aprovador", 
      requires: ["ux_brief"], 
      outputs: ["aprovado", "mudancas"] 
    },
    { 
      id: "front_impl", 
      type: "task", 
      title: "Implementação Front-end", 
      role: "FrontEnd", 
      requires: ["ui_approval:aprovado"] 
    },
    { 
      id: "qa_gate", 
      type: "approval", 
      title: "QA & Checklist", 
      role: "QA", 
      requires: ["front_impl"], 
      outputs: ["ok", "bugs"] 
    },
    { 
      id: "handoff", 
      type: "task", 
      title: "Handoff Go-Live", 
      role: "PO", 
      requires: ["qa_gate:ok"] 
    }
  ]
};

export interface SeedResult {
  template: any;
  instance: any;
  tasks: any[];
  comments: any[];
}

class SeedUtility {
  async checkAndSeedDevData(): Promise<SeedResult | null> {
    try {
      // Check if already seeded
      const seeded = localStorage.getItem('mcSeeded');
      if (seeded === 'true') {
        console.log('MC data already seeded, skipping...');
        return null;
      }

      // Verify user is admin/superadmin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
        throw new Error('Apenas administradores podem executar o seed de dados');
      }

      console.log('Starting MC seed process...');

      // 1. Create workflow template
      const template = await templatesRepo.create({
        name: 'Onboarding – Desenvolvimento',
        version: 1,
        domain: 'development',
        spec: DEV_ONBOARDING_SPEC
      });

      console.log('Template created:', template);

      // 2. Create workflow instance
      const instance = await instancesRepo.createFromTemplate(
        template.id,
        { project_name: 'Projeto de Teste', client_name: 'Cliente Exemplo' }
      );

      console.log('Instance created:', instance);

      // 3. Add current user as participant
      await instancesRepo.addParticipant(instance.id, user.id, 'PO', false);

      console.log('Participant added');

      // 4. Create sample tasks based on spec nodes
      const tasks = [];
      
      // Task 1: Collect requirements (assign to current user)
      const task1 = await tasksRepo.create({
        workflow_instance_id: instance.id,
        node_id: 'start',
        type: 'form',
        title: 'Coletar insumos do projeto',
        status: 'open',
        priority: 2,
        assigned_role: 'CS',
        assignee_user_id: user.id,
        sla_hours: 24,
        fields: {
          form_url: 'https://forms.example.com/requirements',
          client_contact: 'cliente@exemplo.com'
        }
      });
      tasks.push(task1);

      // Task 2: UX Brief
      const task2 = await tasksRepo.create({
        workflow_instance_id: instance.id,
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
        }
      });
      tasks.push(task2);

      // Task 3: Front-end Implementation
      const task3 = await tasksRepo.create({
        workflow_instance_id: instance.id,
        node_id: 'front_impl',
        type: 'task',
        title: 'Implementação Front-end',
        status: 'open',
        priority: 4,
        assigned_role: 'FrontEnd',
        fields: {
          repo_url: 'https://github.com/cupcode/projeto-exemplo',
          tech_stack: 'React + TypeScript + Tailwind'
        }
      });
      tasks.push(task3);

      console.log('Tasks created:', tasks.length);

      // 5. Add sample comments
      const comments = [];
      
      const comment1 = await tasksRepo.addComment(
        task1.id,
        'Tarefa criada automaticamente pelo seed. Cliente enviou os requisitos iniciais por email.',
        []
      );
      comments.push(comment1);

      const comment2 = await tasksRepo.addComment(
        task2.id,
        'Aguardando aprovação da tarefa anterior para iniciar o briefing UX.',
        []
      );
      comments.push(comment2);

      console.log('Comments created:', comments.length);

      // Mark as seeded
      localStorage.setItem('mcSeeded', 'true');

      console.log('MC seed completed successfully!');

      return {
        template,
        instance,
        tasks,
        comments
      };

    } catch (error) {
      console.error('Seed error:', error);
      throw error;
    }
  }

  async resetSeed(): Promise<void> {
    localStorage.removeItem('mcSeeded');
    console.log('Seed flag reset. You can run seed again.');
  }

  isSeedCompleted(): boolean {
    return localStorage.getItem('mcSeeded') === 'true';
  }
}

export const seedUtil = new SeedUtility();