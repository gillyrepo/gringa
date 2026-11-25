import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, MapPin, DollarSign, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  DEFAULT_STORE_CITY,
  DEFAULT_STORE_STATE,
  STORE_SLUG,
} from '@/shared/config/store';
import { queryKeys } from '@/shared/lib/queryKeys';
import type { ShippingRate } from '@/modules/shipping/types';
import { useShippingRates } from '@/modules/shipping/hooks/useShippingRates';
import {
  updateShippingRate,
  createShippingRate,
  deleteShippingRate,
} from '@/modules/shipping/services/shippingService';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Card, CardContent } from '@/shared/components/ui/card';

interface ShippingRatesManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShippingRatesManager = ({ isOpen }: ShippingRatesManagerProps) => {
  const queryClient = useQueryClient();
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<ShippingRate>>({});
  const [rateToDelete, setRateToDelete] = useState<string | null>(null);

  const { data: rates, isLoading } = useShippingRates(isOpen);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ShippingRate> }) =>
      updateShippingRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shippingRates });
      toast.success('Taxa atualizada com sucesso');
      setEditingRate(null);
    },
    onError: () => toast.error('Erro ao atualizar taxa'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<ShippingRate, 'id'>) => createShippingRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shippingRates });
      toast.success('Taxa criada com sucesso');
      setIsCreating(false);
      setFormData({});
    },
    onError: () => toast.error('Erro ao criar taxa'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteShippingRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shippingRates });
      toast.success('Taxa removida com sucesso');
      setRateToDelete(null);
    },
    onError: () => toast.error('Erro ao remover taxa'),
  });

  const handleEdit = (rate: ShippingRate) => {
    setEditingRate(rate);
    setFormData(rate);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingRate(null);
    setFormData({
      city: DEFAULT_STORE_CITY,
      state: DEFAULT_STORE_STATE,
      store: STORE_SLUG,
      price: 0,
      neighborhood: '',
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (isCreating) {
      if (!formData.neighborhood || !formData.city || formData.price === undefined) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
      createMutation.mutate(formData as Omit<ShippingRate, 'id'>);
    } else if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, data: formData });
    }
  };

  const handleCancel = () => {
    setEditingRate(null);
    setIsCreating(false);
    setFormData({});
  };

  const confirmDelete = () => {
    if (rateToDelete) {
      deleteMutation.mutate(rateToDelete);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gerenciar Taxas de Frete</h2>
        {!isCreating && !editingRate && (
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Taxa
          </Button>
        )}
      </div>

      {isCreating || editingRate ? (
        <div className="bg-muted/30 p-4 rounded-lg border">
          <h3 className="font-semibold mb-4">
            {isCreating ? 'Nova Taxa de Entrega' : 'Editar Taxa de Entrega'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Extrema"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood || ''}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="Ex: Centro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Valor (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  className="pl-9"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || createMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <p className="text-center py-4">Carregando taxas...</p>
          ) : rates?.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma taxa cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {rates?.map((rate) => (
                <Card key={rate.id} className="overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 flex-1">
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="font-medium">{rate.neighborhood}</p>
                          <p className="text-xs text-muted-foreground">
                            {rate.city} - {rate.state}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold bg-secondary/50 px-2 py-1 rounded">
                          R$ {rate.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rate)}>
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setRateToDelete(rate.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <AlertDialog
        open={!!rateToDelete}
        onOpenChange={(open) => !open && setRateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Taxa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta taxa de entrega? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
