import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: () => void;
  editingUser?: any;
}

export const UserCreateDialog = ({ open, onOpenChange, onUserCreated, editingUser }: UserCreateDialogProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    display_name: '',
    role: 'user' as 'user' | 'admin' | 'superadmin' | 'client',
    password: ''
  });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const isSuperAdmin = profile?.role === 'superadmin';

  const resetForm = () => {
    if (editingUser) {
      setFormData({
        email: editingUser.email,
        display_name: editingUser.display_name || '',
        role: editingUser.role,
        password: ''
      });
    } else {
      setFormData({
        email: '',
        display_name: '',
        role: 'user',
        password: ''
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async () => {
    if (!formData.email.trim() || !formData.display_name.trim()) {
      toast({
        title: 'Erro',
        description: 'Email e nome são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      toast({
        title: 'Erro',
        description: 'Senha é obrigatória para novos usuários',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: formData.display_name,
            role: formData.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso',
        });
      } else {
        // Create new user - would need admin API call or edge function
        toast({
          title: 'Aviso',
          description: 'Criação de novos usuários requer implementação de edge function para segurança',
          variant: 'destructive',
        });
        return;
      }

      handleOpenChange(false);
      onUserCreated?.();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar usuário',
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
          <DialogTitle>
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {editingUser ? 'Atualize as informações do usuário.' : 'Cadastre um novo usuário no sistema.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@exemplo.com"
              disabled={!!editingUser}
            />
          </div>

          <div>
            <Label htmlFor="display_name">Nome *</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Nome completo"
            />
          </div>

          <div>
            <Label htmlFor="role">Cargo *</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: any) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                {isAdmin && <SelectItem value="admin">Administrador</SelectItem>}
                {isSuperAdmin && <SelectItem value="superadmin">Super Admin</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {!editingUser && (
            <div>
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Senha temporária"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : (editingUser ? 'Atualizar' : 'Cadastrar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};