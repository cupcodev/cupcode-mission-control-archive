import type { WorkflowSpec, WorkflowNode } from '@/types/mc';

export const validateWorkflowSpec = (spec: WorkflowSpec): string[] => {
  const errors: string[] = [];

  // Verificar se tem nodes
  if (!spec.nodes || !Array.isArray(spec.nodes)) {
    errors.push('Spec deve conter um array "nodes"');
    return errors;
  }

  if (spec.nodes.length === 0) {
    errors.push('Spec deve conter pelo menos um nó');
    return errors;
  }

  // Verificar IDs únicos
  const nodeIds = new Set<string>();
  const duplicateIds: string[] = [];

  for (const node of spec.nodes) {
    if (!node.id) {
      errors.push('Todos os nós devem ter um ID');
      continue;
    }

    if (nodeIds.has(node.id)) {
      duplicateIds.push(node.id);
    } else {
      nodeIds.add(node.id);
    }
  }

  if (duplicateIds.length > 0) {
    errors.push(`IDs duplicados encontrados: ${duplicateIds.join(', ')}`);
  }

  // Verificar tipos válidos
  const validTypes = ['task', 'approval', 'form', 'automation'];
  for (const node of spec.nodes) {
    if (!node.type) {
      errors.push(`Nó "${node.id}" deve ter um tipo`);
    } else if (!validTypes.includes(node.type)) {
      errors.push(`Nó "${node.id}" tem tipo inválido: ${node.type}`);
    }
  }

  // Verificar títulos
  for (const node of spec.nodes) {
    if (!node.title || node.title.trim() === '') {
      errors.push(`Nó "${node.id}" deve ter um título`);
    }
  }

  // Verificar referências de requires
  for (const node of spec.nodes) {
    if (node.requires && Array.isArray(node.requires)) {
      for (const requirement of node.requires) {
        // Remover sufixos como ":aprovado" para validar apenas o ID do nó
        const baseNodeId = requirement.split(':')[0];
        if (!nodeIds.has(baseNodeId)) {
          errors.push(`Nó "${node.id}" referencia nó inexistente: ${baseNodeId}`);
        }
      }
    }
  }

  // Verificar se existe pelo menos um nó raiz (sem requires ou com requires vazio)
  const rootNodes = spec.nodes.filter(node => 
    !node.requires || 
    node.requires.length === 0 || 
    node.requires.every(req => req.trim() === '')
  );

  if (rootNodes.length === 0) {
    errors.push('Deve existir pelo menos um nó raiz (sem dependências)');
  }

  // Verificar SLA (se presente)
  for (const node of spec.nodes) {
    if (node.sla_hours !== undefined) {
      if (typeof node.sla_hours !== 'number' || node.sla_hours <= 0) {
        errors.push(`Nó "${node.id}" tem SLA inválido: deve ser um número positivo`);
      }
    }
  }

  // Verificar tamanho do spec
  const specSize = JSON.stringify(spec).length;
  if (specSize > 50000) { // 50KB limite
    errors.push('Spec muito grande (máximo 50KB)');
  }

  return errors;
};