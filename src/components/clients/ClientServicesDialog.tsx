import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { clientsRepo, servicesCatalogRepo, clientServicesRepo, type Client, type ClientServiceWithDetails, type ServiceCatalog } from '@/data/core';

interface ClientServicesDialogProps {
  open: boolean;
  client: Client | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const ClientServicesDialog = ({ open, client, onOpenChange, onSaved }: ClientServicesDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableServices, setAvailableServices] = useState<ServiceCatalog[]>([]);
  const [linked, setLinked] = useState<ClientServiceWithDetails[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !client) return;
    (async () => {
      try {
        setLoading(true);
        const [services, links] = await Promise.all([
          servicesCatalogRepo.listActive(),
          clientServicesRepo.listByClient(client.id),
        ]);
        setAvailableServices(services);
        setLinked(links);
        setSelected(new Set(links.map((l) => l.service_id)));
      } catch (e: any) {
        toast({ title: 'Erro ao carregar serviços', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, client]);

  const existingMap = useMemo(() => {
    const map = new Map<string, ClientServiceWithDetails>();
    linked.forEach((l) => map.set(l.service_id, l));
    return map;
  }, [linked]);

  const toggle = (serviceId: string) => {
    const copy = new Set(selected);
    if (copy.has(serviceId)) copy.delete(serviceId); else copy.add(serviceId);
    setSelected(copy);
  };

  const handleSave = async () => {
    if (!client) return;
    try {
      setLoading(true);
      // Determine diffs
      const selectedIds = Array.from(selected);
      const existingIds = Array.from(existingMap.keys());
      const toAdd = selectedIds.filter((id) => !existingMap.has(id));
      const toRemove = existingIds.filter((id) => !selected.has(id));

      await Promise.all([
        ...toAdd.map((serviceId) => clientServicesRepo.link(client.id, serviceId)),
        ...toRemove.map((serviceId) => {
          const link = existingMap.get(serviceId);
          if (link) return clientServicesRepo.unlink(link.id);
          return Promise.resolve();
        }),
      ]);

      toast({ title: 'Serviços atualizados' });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar serviços', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Serviços de {client.display_name}</DialogTitle>
          <DialogDescription>Marque os serviços contratados para este cliente</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label>Serviços disponíveis</Label>
          <ScrollArea className="h-64 pr-2">
            <div className="space-y-2">
              {availableServices.map((s) => (
                <label key={s.id} className="flex items-center gap-3 rounded-md border p-2">
                  <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                  <div className="flex flex-col">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.code}{s.domain ? ` · ${s.domain}` : ''}</span>
                  </div>
                </label>
              ))}
              {availableServices.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhum serviço disponível</div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || availableServices.length === 0}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
