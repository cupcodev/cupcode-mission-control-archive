import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { tasksRepo } from '@/data/mc';
import type { Task } from '@/types/mc';

interface SubtaskCreateDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (updatedTask: Task) => void;
}

export const SubtaskCreateDialog = ({ task, isOpen, onClose, onCreated }: SubtaskCreateDialogProps) => {
  const [subtaskText, setSubtaskText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!subtaskText.trim()) {
      toast.error('Digite o texto da subtarefa');
      return;
    }

    try {
      setSaving(true);
      
      const newItem = {
        id: Date.now().toString(),
        text: subtaskText.trim(),
        completed: false
      };
      
      const currentChecklist = (task.fields?.checklist || []) as Array<{id: string, text: string, completed: boolean}>;
      const updatedChecklist = [...currentChecklist, newItem];
      
      const updatedTask = await tasksRepo.update(task.id, {
        fields: { ...task.fields, checklist: updatedChecklist }
      });
      
      onCreated({ ...task, fields: { ...task.fields, checklist: updatedChecklist } });
      setSubtaskText('');
      onClose();
      
      toast.success('Subtarefa criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar subtarefa:', error);
      toast.error('Não foi possível criar a subtarefa');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSubtaskText('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Subtarefa
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="subtask-text">Descrição da subtarefa</Label>
            <Textarea
              id="subtask-text"
              value={subtaskText}
              onChange={(e) => setSubtaskText(e.target.value)}
              placeholder="Descreva a subtarefa..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !subtaskText.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {saving ? 'Criando...' : 'Criar Subtarefa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};