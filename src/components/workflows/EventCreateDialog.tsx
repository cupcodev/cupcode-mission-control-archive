import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { tasksRepo } from '@/data/mc/tasksRepo';
import { instancesRepo } from '@/data/mc/instancesRepo';

interface EventCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: () => void;
}

export const EventCreateDialog = ({ open, onOpenChange, onEventCreated }: EventCreateDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const [instances, setInstances] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    type: 'meeting',
    instanceId: '',
    description: '',
    participants: ''
  });

  // Load instances when dialog opens
  const loadInstances = async () => {
    try {
      const data = await instancesRepo.listMineOrParticipant();
      setInstances(data);
    } catch (error) {
      console.error('Error loading instances:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      loadInstances();
    } else {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'meeting',
      instanceId: '',
      description: '',
      participants: ''
    });
    setDate(undefined);
    setTime('09:00');
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Erro',
        description: 'Título é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (!date) {
      toast({
        title: 'Erro',
        description: 'Data é obrigatória',
        variant: 'destructive',
      });
      return;
    }


    try {
      setLoading(true);

      // Combine date and time
      const [hours, minutes] = time.split(':').map(Number);
      const dueDate = new Date(date);
      dueDate.setHours(hours, minutes, 0, 0);

      // Create task as calendar event
      await tasksRepo.create({
        workflow_instance_id: formData.instanceId || undefined,
        node_id: `event-${Date.now()}`,
        type: 'form', // Use 'form' type for events
        title: formData.title,
        status: 'open',
        priority: 3,
        due_at: dueDate.toISOString(),
        fields: {
          event_type: formData.type,
          description: formData.description,
          participants: formData.participants.split(',').map(p => p.trim()).filter(Boolean)
        }
      } as any);

      toast({
        title: 'Sucesso',
        description: 'Evento criado com sucesso',
      });

      handleOpenChange(false);
      onEventCreated?.();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar evento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
          <DialogDescription>
            Crie um novo evento no calendário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reunião de Planning"
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Evento</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="deadline">Prazo</SelectItem>
                <SelectItem value="approval">Aprovação</SelectItem>
                <SelectItem value="release">Release</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instance">Projeto *</Label>
            <Select 
              value={formData.instanceId} 
              onValueChange={(value) => setFormData({ ...formData, instanceId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {instances.map((instance) => (
                  <SelectItem key={instance.id} value={instance.id}>
                    {instance.variables?.project_name || `Projeto ${instance.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do evento"
            />
          </div>

          <div>
            <Label htmlFor="participants">Participantes</Label>
            <Input
              id="participants"
              value={formData.participants}
              onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
              placeholder="Separe por vírgula: João, Maria, Pedro"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};