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
import { RoleSelect } from './RoleSelect';
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
    blockReason: '',
    isBlocked: false
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
      
      if (formData.isBlocked && formData.blockReason.trim()) {
        fields.block_reason = formData.blockReason.trim();
      }

      const taskInput: CreateTaskInput = {
        workflow_instance_id: instanceId,
        node_id: nodeId,
        type: formData.type,
        title: formData.title.trim(),
        status: formData.isBlocked ? 'blocked' : 'open',
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
      blockReason: '',
      isBlocked: false
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
              <Label htmlFor="priority">Prioridade</Label>
              <div className="space-y-2">
                <input
                  id="priority"
                  type="range"
                  min="1"
                  max="5"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                     background: `linear-gradient(to right, 
                       ${formData.priority >= 5 ? '#059669' : '#e5e7eb'} 0%, 
                       ${formData.priority >= 5 ? '#059669' : '#e5e7eb'} 20%,
                       ${formData.priority >= 4 ? '#22c55e' : '#e5e7eb'} 20%, 
                       ${formData.priority >= 4 ? '#22c55e' : '#e5e7eb'} 40%,
                       ${formData.priority >= 3 ? '#eab308' : '#e5e7eb'} 40%, 
                       ${formData.priority >= 3 ? '#eab308' : '#e5e7eb'} 60%,
                       ${formData.priority >= 2 ? '#f97316' : '#e5e7eb'} 60%, 
                       ${formData.priority >= 2 ? '#f97316' : '#e5e7eb'} 80%,
                       ${formData.priority >= 1 ? '#dc2626' : '#e5e7eb'} 80%, 
                       ${formData.priority >= 1 ? '#dc2626' : '#e5e7eb'} 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                </div>
                <div className="text-sm">
                  {formData.priority === 5 && (
                    <div>
                      <span className="font-medium text-green-800">5 - Planejada</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ideias, backlog estratégico, experimentos, "nice to have" sem prazo. 
                        Ex.: prova de conceito, otimização futura, documentação ampliada.
                        <br />SLA típico: sem data fixa; priorizar conforme roadmap.
                      </p>
                    </div>
                  )}
                  {formData.priority === 4 && (
                    <div>
                      <span className="font-medium text-green-600">4 - Baixa</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aprimoramento, débito técnico não crítico, ajustes de UX/conteúdo. 
                        Ex.: microcopys, pequenos refactors, melhorias de acessibilidade sem bloqueio.
                        <br />SLA típico: resolver neste mês/sprint.
                      </p>
                    </div>
                  )}
                  {formData.priority === 3 && (
                    <div>
                      <span className="font-medium text-yellow-600">3 - Média</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Impacto moderado, há workaround. Ex.: componente visual quebrado sem bloquear uso; 
                        melhoria que destrava dependência de outra equipe.
                        <br />SLA típico: resolver nesta semana.
                      </p>
                    </div>
                  )}
                  {formData.priority === 2 && (
                    <div>
                      <span className="font-medium text-orange-600">2 - Alta</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Impacto relevante ou risco de virada em Crítica se adiar. Ex.: bug que impede compra em um fluxo alternativo; 
                        falha em integração-chave; tarefa com prazo legal.
                        <br />SLA típico: iniciar no mesmo dia; resolver em 24–48h.
                      </p>
                    </div>
                  )}
                  {formData.priority === 1 && (
                    <div>
                      <span className="font-medium text-red-600">1 - Crítica</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Interrompe operação, causa perda financeira/reputacional imediata ou afeta muitos usuários. 
                        Ex.: checkout fora do ar, vazamento de dados, queda geral.
                        <br />SLA típico: iniciar em até 15 min; resolver/mitigar no mesmo dia.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="assignedRole">Função responsável</Label>
              <RoleSelect
                value={formData.assignedRole}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignedRole: value }))}
                placeholder="Selecione uma função..."
                disabled={formData.mode === 'node'}
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

          {/* Bloqueio da tarefa */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isBlocked"
              checked={formData.isBlocked}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                isBlocked: !!checked,
                blockReason: checked ? prev.blockReason : ''
              }))}
            />
            <Label htmlFor="isBlocked">Bloquear tarefa</Label>
          </div>

          {/* Motivo de bloqueio - só aparece se bloqueado */}
          {formData.isBlocked && (
            <div>
              <Label htmlFor="blockReason">Motivo de bloqueio *</Label>
              <Textarea
                id="blockReason"
                value={formData.blockReason}
                onChange={(e) => setFormData(prev => ({ ...prev, blockReason: e.target.value }))}
                placeholder="Descreva o motivo do bloqueio..."
                required
              />
            </div>
          )}

          {/* Subtarefas */}
          <div>
            <Label>Subtarefas:</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder='Adicionar item e aperte "Enter" ou no botão "+" ao lado.'
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