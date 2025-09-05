import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/types/mc';
import { useAuth } from '@/hooks/useAuth';
import { tasksRepo } from '@/data/mc';
import { approvalsRepo } from '@/data/mc/approvalsRepo';
import { branchingService } from '@/lib/branching-service';

const decisionSchema = z.object({
  decision: z.enum(['approved', 'changes_requested', 'rejected']),
  reason: z.string().optional(),
  artifacts: z.array(z.object({
    name: z.string(),
    url: z.string().url()
  })).default([])
});

type DecisionForm = z.infer<typeof decisionSchema>;

interface ApprovalDecisionDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const ApprovalDecisionDialog = ({ 
  task, 
  isOpen, 
  onClose, 
  onComplete 
}: ApprovalDecisionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [artifacts, setArtifacts] = useState<Array<{ name: string; url: string }>>([]);
  const { toast } = useToast();

  const form = useForm<DecisionForm>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      decision: 'approved',
      reason: '',
      artifacts: []
    }
  });

  const watchedDecision = form.watch('decision');

  // Check if checklist validation should block approval
  const getChecklistValidation = () => {
    const checklist = task.fields?.checklist;
    if (!checklist || !Array.isArray(checklist)) {
      return { isValid: true, message: '' };
    }

    const requiredUnchecked = checklist.filter(
      (item: any) => item.required && !item.done
    );

    if (requiredUnchecked.length > 0 && watchedDecision === 'approved') {
      return {
        isValid: false,
        message: `${requiredUnchecked.length} item(s) obrigatório(s) não concluído(s)`
      };
    }

    return { isValid: true, message: '' };
  };

  const checklistValidation = getChecklistValidation();

  const isReasonRequired = watchedDecision === 'changes_requested' || watchedDecision === 'rejected';

  const addArtifact = () => {
    setArtifacts([...artifacts, { name: '', url: '' }]);
  };

  const removeArtifact = (index: number) => {
    setArtifacts(artifacts.filter((_, i) => i !== index));
  };

  const updateArtifact = (index: number, field: 'name' | 'url', value: string) => {
    const updated = [...artifacts];
    updated[index][field] = value;
    setArtifacts(updated);
  };

  const getDecisionLabel = (decision: string) => {
    switch (decision) {
      case 'approved': return 'Aprovado';
      case 'changes_requested': return 'Mudanças Solicitadas';
      case 'rejected': return 'Rejeitado';
      default: return decision;
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'changes_requested': return <AlertTriangle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const onSubmit = async (data: DecisionForm) => {
    if (!checklistValidation.isValid) {
      toast({
        title: "Validação falhou",
        description: checklistValidation.message,
        variant: "destructive"
      });
      return;
    }

    if (isReasonRequired && !data.reason?.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo para mudanças solicitadas ou rejeição",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { user } = useAuth();
      
      // Save approval decision
      await approvalsRepo.create({
        task_id: task.id,
        approver_user_id: user?.id || '',
        decision: data.decision,
        reason: data.reason || undefined,
        artifacts: artifacts.filter(a => a.name && a.url)
      });

      // Update task outcome and status
      const outcomeMap = {
        approved: 'aprovado',
        changes_requested: 'mudancas',
        rejected: 'rejeitado'
      };

      const statusMap = {
        approved: 'done',
        changes_requested: 'rejected',
        rejected: 'rejected'
      };

      try {
        await tasksRepo.update(task.id, {
          status: statusMap[data.decision] as any,
          completed_at: data.decision === 'approved' ? new Date().toISOString() : undefined,
          fields: {
            ...task.fields,
            outcome: outcomeMap[data.decision]
          }
        });
      } catch (error) {
        // If status update fails due to permissions, continue with branching
        toast({
          title: "Status será atualizado pelo responsável",
          description: "Sua decisão foi registrada mas o status será atualizado pelo PO/Admin",
          variant: "default"
        });
      }

      // Execute branching logic
      const branchResult = await branchingService.executeWorkflowBranching({
        instanceId: task.workflow_instance_id,
        completedNodeId: task.node_id,
        outcomeLabel: outcomeMap[data.decision] as any
      });

      let successMessage = `Decisão "${getDecisionLabel(data.decision)}" registrada com sucesso.`;
      
      if (branchResult.createdTasks.length > 0) {
        successMessage += ` ${branchResult.createdTasks.length} nova(s) tarefa(s) criada(s).`;
      }

      if (branchResult.pendingNodes.length > 0) {
        successMessage += ` Algumas tarefas ficaram pendentes de criação pelo Admin.`;
      }

      toast({
        title: "Aprovação processada",
        description: successMessage
      });

      onComplete?.();
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao processar aprovação",
        description: "Tente novamente ou contate o suporte",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Decisão de Aprovação</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">{task.title}</h4>
            <div className="flex gap-2">
              <Badge variant="outline">{task.type}</Badge>
              <Badge variant="secondary">{task.status}</Badge>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Decision Selection */}
            <div className="space-y-3">
              <Label>Decisão</Label>
              <RadioGroup
                value={watchedDecision}
                onValueChange={(value) => form.setValue('decision', value as any)}
                className="grid grid-cols-1 gap-3"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="approved" id="approved" />
                  <Label htmlFor="approved" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Aprovado
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="changes_requested" id="changes_requested" />
                  <Label htmlFor="changes_requested" className="flex items-center gap-2 cursor-pointer flex-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Solicitar mudanças
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="rejected" id="rejected" />
                  <Label htmlFor="rejected" className="flex items-center gap-2 cursor-pointer flex-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Rejeitado
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Checklist Validation */}
            {!checklistValidation.isValid && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{checklistValidation.message}</AlertDescription>
              </Alert>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Motivo {isReasonRequired && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  watchedDecision === 'approved' 
                    ? "Comentários adicionais (opcional)"
                    : "Descreva o motivo para sua decisão"
                }
                {...form.register('reason')}
                className="min-h-[100px]"
              />
            </div>

            {/* Artifacts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Evidências/Links</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addArtifact}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar link
                </Button>
              </div>
              
              {artifacts.map((artifact, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Nome do arquivo/evidência"
                    value={artifact.name}
                    onChange={(e) => updateArtifact(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL"
                    value={artifact.url}
                    onChange={(e) => updateArtifact(index, 'url', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArtifact(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !checklistValidation.isValid}
                className="flex items-center gap-2"
              >
                {getDecisionIcon(watchedDecision)}
                {isSubmitting ? 'Processando...' : `Confirmar ${getDecisionLabel(watchedDecision)}`}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};