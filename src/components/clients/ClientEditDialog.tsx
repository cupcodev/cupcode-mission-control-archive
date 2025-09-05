import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { clientsRepo, type Client } from '@/data/core';
import { useToast } from '@/hooks/use-toast';

interface ClientEditDialogProps {
  open: boolean;
  client: Client | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const ClientEditDialog = ({ open, client, onOpenChange, onSaved }: ClientEditDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    legal_name: '',
    tax_id: '',
    status: 'active' as 'active' | 'inactive',
    website: ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        display_name: client.display_name || '',
        legal_name: client.legal_name || '',
        tax_id: client.tax_id || '',
        status: client.status,
        website: client.website || ''
      });
    }
  }, [client]);

  const handleSave = async () => {
    if (!client) return;
    if (!formData.display_name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      await clientsRepo.update(client.id, {
        display_name: formData.display_name,
        legal_name: formData.legal_name || undefined,
        tax_id: formData.tax_id || undefined,
        status: formData.status,
        website: formData.website || undefined,
      });
      toast({ title: 'Cliente atualizado com sucesso' });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar cliente', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>Atualize as informações do cliente</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="display_name">Nome</Label>
            <Input id="display_name" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="legal_name">Razão Social</Label>
            <Input id="legal_name" value={formData.legal_name} onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="tax_id">CNPJ/CPF</Label>
            <Input id="tax_id" value={formData.tax_id} onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v: 'active' | 'inactive') => setFormData({ ...formData, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
