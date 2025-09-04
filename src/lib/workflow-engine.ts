import type { WorkflowSpec, CreateTaskInput } from '@/types/mc';

export const generateInitialTasks = (spec: WorkflowSpec, instanceId: string): CreateTaskInput[] => {
  const tasks: CreateTaskInput[] = [];

  if (!spec.nodes || !Array.isArray(spec.nodes)) {
    return tasks;
  }

  // Identificar nós raiz (sem requires válidos)
  const rootNodes = spec.nodes.filter(node => {
    if (!node.requires || node.requires.length === 0) {
      return true;
    }
    
    // Considerar raiz se todos os requires estão vazios
    return node.requires.every(req => !req || req.trim() === '');
  });

  // Criar tarefas para nós raiz
  for (const node of rootNodes) {
    // Só criar tarefas para tipos que requerem interação
    if (['task', 'approval', 'form', 'automation'].includes(node.type)) {
      const task: CreateTaskInput = {
        workflow_instance_id: instanceId,
        node_id: node.id,
        type: node.type as 'task' | 'approval' | 'form' | 'automation',
        title: node.title,
        status: 'open',
        priority: 3, // prioridade padrão
        assigned_role: node.role,
        sla_hours: node.sla_hours,
        fields: {}
      };

      tasks.push(task);
    }
  }

  return tasks;
};