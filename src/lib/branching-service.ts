import type { WorkflowSpec, WorkflowNode, Task, CreateTaskInput } from '@/types/mc';
import { templatesRepo, instancesRepo, tasksRepo } from '@/data/mc';

export interface BranchingContext {
  instanceId: string;
  completedNodeId: string;
  outcomeLabel: 'aprovado' | 'mudancas' | 'rejeitado';
}

class BranchingService {
  async executeWorkflowBranching(context: BranchingContext): Promise<{
    createdTasks: Task[];
    pendingNodes: string[];
    error?: string;
  }> {
    try {
      // Get instance and template spec
      const instance = await instancesRepo.get(context.instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      const template = await templatesRepo.getById(instance.template_id);
      if (!template) {
        throw new Error('Template not found');
      }

      // Get existing tasks for this instance
      const existingTasks = await tasksRepo.listByInstance(context.instanceId);
      
      // Find nodes that depend on the completed node
      const eligibleNodes = this.findEligibleNodes(
        template.spec,
        context.completedNodeId,
        context.outcomeLabel,
        existingTasks
      );

      const createdTasks: Task[] = [];
      const pendingNodes: string[] = [];

      // Create tasks for eligible nodes
      for (const node of eligibleNodes) {
        try {
          const taskInput: CreateTaskInput = {
            workflow_instance_id: context.instanceId,
            node_id: node.id,
            type: node.type as 'task' | 'approval' | 'form' | 'automation',
            title: node.title,
            status: 'open',
            priority: 3,
            assigned_role: node.role,
            sla_hours: node.sla_hours,
            fields: {}
          };

          const newTask = await tasksRepo.create(taskInput);
          createdTasks.push(newTask);
        } catch (error) {
          // If creation fails due to permissions, add to pending
          pendingNodes.push(node.id);
        }
      }

      return {
        createdTasks,
        pendingNodes,
        error: pendingNodes.length > 0 ? 'Some tasks could not be created due to permissions' : undefined
      };
    } catch (error) {
      return {
        createdTasks: [],
        pendingNodes: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private findEligibleNodes(
    spec: WorkflowSpec,
    completedNodeId: string,
    outcomeLabel: string,
    existingTasks: Task[]
  ): WorkflowNode[] {
    if (!spec.nodes || !Array.isArray(spec.nodes)) {
      return [];
    }

    const eligibleNodes: WorkflowNode[] = [];
    const existingNodeIds = new Set(existingTasks.map(task => task.node_id));

    for (const node of spec.nodes) {
      // Skip if task already exists for this node
      if (existingNodeIds.has(node.id)) {
        continue;
      }

      // Check if this node depends on the completed node
      if (this.nodeDependsOn(node, completedNodeId, outcomeLabel, existingTasks)) {
        eligibleNodes.push(node);
      }
    }

    return eligibleNodes;
  }

  private nodeDependsOn(
    node: WorkflowNode,
    completedNodeId: string,
    outcomeLabel: string,
    existingTasks: Task[]
  ): boolean {
    if (!node.requires || node.requires.length === 0) {
      return false;
    }

    // Check if all requirements are satisfied
    for (const requirement of node.requires) {
      if (!requirement || requirement.trim() === '') {
        continue;
      }

      const [requiredNodeId, requiredOutcome] = requirement.split(':');
      
      // Check if this requirement matches our completed node
      if (requiredNodeId === completedNodeId) {
        // If specific outcome is required, check if it matches
        if (requiredOutcome && requiredOutcome !== outcomeLabel) {
          return false;
        }
        continue; // This requirement is satisfied
      }

      // Check if other requirements are satisfied by existing tasks
      const requiredTask = existingTasks.find(task => task.node_id === requiredNodeId);
      if (!requiredTask || requiredTask.status !== 'done') {
        return false; // Requirement not satisfied
      }

      // If specific outcome is required, check it
      if (requiredOutcome) {
        const taskOutcome = requiredTask.fields?.outcome;
        if (taskOutcome !== requiredOutcome) {
          return false;
        }
      }
    }

    // All requirements satisfied
    return true;
  }
}

export const branchingService = new BranchingService();