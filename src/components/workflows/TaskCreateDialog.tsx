import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { tasksRepo, templatesRepo } from '@/data/mc';
import { useToast } from '@/hooks/use-toast';
import type { CreateTaskInput, WorkflowTemplate, WorkflowNode } from '@/types/mc';

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  templateId?: string;
  onSuccess?: (task: any) => void;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export const TaskCreateDialog = ({ 
  open, 
  onOpenChange, 
  instanceId, 
  templateId,
  onSuccess 
}: TaskCreateDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [availableNodes, setAvailableNodes] = useState<WorkflowNode[]>([]);
  const [existingTasks, setExistingTasks] = useState<string[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const [formData, setFormData] = useState({
    title: '',
    type: 'task' as 'task' | 'approval' | 'form' | 'automation',
    mode: 'adhoc' as 'adhoc' | 'node',
    nodeId: '',
    priority: 3,
    assignedRole: '',
    assigneeUserId: '',
    slaHours: '',
    blockReason: ''
  });

  useEffect(() => {
    if (open && templateId) {
      loadTemplateData();
      loadExistingTasks();
    }
  }, [open, templateId, instanceId]);

  const loadTemplateData = async () => {
    if (!templateId) return;
    
    try {
      const templateData = await templatesRepo.getById(templateId);
      setTemplate(templateData);
      
      if (templateData?.spec?.nodes) {
        setAvailableNodes(templateData.spec.nodes);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const loadExistingTasks = async () => {
    try {
      const tasks = await tasksRepo.listByInstance(instanceId);
      const nodeIds = tasks
        .map(task => task.node_id)
        .filter(nodeId => nodeId && !nodeId.startsWith('adhoc-'));
      setExistingTasks(nodeIds);
    } catch (error) {
      console.error('Error loading existing tasks:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || formData.title.length < 3) {
      toast({
        title: "Erro de validação",
        description: "O título deve ter pelo menos 3 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (formData.title.length > 200) {
      toast({
        title: "Erro de validação", 
        description: "O título deve ter no máximo 200 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (formData.priority < 1 || formData.priority > 5) {
      toast({
        title: "Erro de validação",
        description: "A prioridade deve estar entre 1 e 5.",
        variant: "destructive"
      });
      return;
    }

    if (dueDate && dueDate < new Date()) {
      toast({
        title: "Erro de validação",
        description: "A data de entrega não pode ser no passado.",
        variant: "destructive"
      });
      return;
    }

    if (formData.mode === 'node' && existingTasks.includes(formData.nodeId)) {
      toast({
        title: "Erro de validação",
        description: "Já existe uma tarefa para este nó do template.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const nodeId = formData.mode === 'adhoc' 
        ? `adhoc-${crypto.randomUUID().slice(0, 8)}`
        : formData.nodeId;

      const fields: Record<string, any> = {};
      
      if (checklistItems.length > 0) {
        fields.checklist = checklistItems;
      }
      
      if (formData.blockReason.trim()) {
        fields.block_reason = formData.blockReason.trim();
      }

      const taskInput: CreateTaskInput = {
        workflow_instance_id: instanceId,
        node_id: nodeId,
        type: formData.type,
        title: formData.title.trim(),
        status: formData.blockReason.trim() ? 'blocked' : 'open',
        priority: formData.priority,
        assigned_role: formData.assignedRole || undefined,
        assignee_user_id: formData.assigneeUserId || undefined,
        due_at: dueDate?.toISOString(),
        sla_hours: formData.slaHours ? parseInt(formData.slaHours) : undefined,
        fields
      };

      const task = await tasksRepo.create(taskInput);
      
      toast({
        title: "Tarefa criada!",
        description: `A tarefa "${formData.title}" foi criada com sucesso.`
      });

      onSuccess?.(task);
      handleClose();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Erro ao criar tarefa",
        description: error.message || "Erro desconhecido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      type: 'task',
      mode: 'adhoc',
      nodeId: '',
      priority: 3,
      assignedRole: '',
      assigneeUserId: '',
      slaHours: '',
      blockReason: ''
    });
    setChecklistItems([]);
    setNewChecklistItem('');
    setDueDate(undefined);
    onOpenChange(false);
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: crypto.randomUUID(),
        text: newChecklistItem.trim(),
        completed: false
      };
      setChecklistItems([...checklistItems, newItem]);
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  const availableNodesForSelection = availableNodes.filter(
    node => !existingTasks.includes(node.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Modo de criação */}
          <div>
            <Label>Tipo de tarefa</Label>
            <Select value={formData.mode} onValueChange={(value: 'adhoc' | 'node') => 
              setFormData(prev => ({ ...prev, mode: value, nodeId: '' }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adhoc">Tarefa avulsa (ad-hoc)</SelectItem>
                {template && (
                  <SelectItem value="node">Baseada em nó do template</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de nó (se modo = node) */}
          {formData.mode === 'node' && (
            <div>
              <Label>Nó do template</Label>
              <Select value={formData.nodeId} onValueChange={(value) => {
                const node = availableNodesForSelection.find(n => n.id === value);
                setFormData(prev => ({ 
                  ...prev, 
                  nodeId: value,
                  title: node?.title || prev.title,
                  type: (node?.type as any) || prev.type,
                  assignedRole: node?.role || prev.assignedRole,
                  slaHours: node?.sla_hours?.toString() || prev.slaHours
                }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um nó..." />
                </SelectTrigger>
                <SelectContent>
                  {availableNodesForSelection.map(node => (
                    <SelectItem key={node.id} value={node.id}>
                      <div>
                        <div className="font-medium">{node.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {node.type} {node.role && `• ${node.role}`}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Informações básicas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título da tarefa..."
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={formData.type} onValueChange={(value: any) => 
                setFormData(prev => ({ ...prev, type: value }))
              } disabled={formData.mode === 'node'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Tarefa</SelectItem>
                  <SelectItem value="approval">Aprovação</SelectItem>
                  <SelectItem value="form">Formulário</SelectItem>
                  <SelectItem value="automation">Automação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Prioridade (1-5)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="5"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 3 }))}
              />
            </div>

            <div>
              <Label htmlFor="assignedRole">Função responsável</Label>
              <Input
                id="assignedRole"
                value={formData.assignedRole}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedRole: e.target.value }))}
                placeholder="Ex: Desenvolvedor, Designer..."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Data de entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="slaHours">SLA (horas)</Label>
              <Input
                id="slaHours"
                type="number"
                min="1"
                value={formData.slaHours}
                onChange={(e) => setFormData(prev => ({ ...prev, slaHours: e.target.value }))}
                placeholder="Ex: 24, 48..."
              />
            </div>
          </div>

          {/* Motivo de bloqueio */}
          <div>
            <Label htmlFor="blockReason">Motivo de bloqueio (opcional)</Label>
            <Textarea
              id="blockReason"
              value={formData.blockReason}
              onChange={(e) => setFormData(prev => ({ ...prev, blockReason: e.target.value }))}
              placeholder="Se preenchido, a tarefa será criada como 'bloqueada'..."
            />
          </div>

          {/* Checklist */}
          <div>
            <Label>Checklist inicial (opcional)</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Adicionar item..."
                onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
              />
              <Button type="button" size="sm" onClick={addChecklistItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {checklistItems.length > 0 && (
              <div className="space-y-2 mt-3">
                {checklistItems.map(item => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox 
                      checked={item.completed}
                      onCheckedChange={(checked) => {
                        setChecklistItems(items => 
                          items.map(i => 
                            i.id === item.id ? { ...i, completed: !!checked } : i
                          )
                        );
                      }}
                    />
                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                      {item.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChecklistItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.title.trim()}>
            {loading ? 'Criando...' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};