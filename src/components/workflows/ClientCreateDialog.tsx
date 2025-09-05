import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { clientsRepo } from '@/data/core/clientsRepo';

interface ClientCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated?: () => void;
}

export const ClientCreateDialog = ({ open, onOpenChange, onClientCreated }: ClientCreateDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    legal_name: '',
    tax_id: '',
    status: 'active' as 'active' | 'inactive'
  });

  const resetForm = () => {
    setFormData({
      display_name: '',
      legal_name: '',
      tax_id: '',
      status: 'active'
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async () => {
    if (!formData.display_name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome de exibição é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      await clientsRepo.create({
        display_name: formData.display_name,
        legal_name: formData.legal_name || undefined,
        tax_id: formData.tax_id || undefined,
        status: formData.status
      });

      toast({
        title: 'Sucesso',
        description: 'Cliente criado com sucesso',
      });

      handleOpenChange(false);
      onClientCreated?.();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar cliente',
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
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Cadastre um novo cliente no sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="display_name">Nome de Exibição *</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Ex: Empresa ABC Ltda"
            />
          </div>

          <div>
            <Label htmlFor="legal_name">Razão Social</Label>
            <Input
              id="legal_name"
              value={formData.legal_name}
              onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              placeholder="Nome completo da empresa"
            />
          </div>

          <div>
            <Label htmlFor="tax_id">CNPJ/CPF</Label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};