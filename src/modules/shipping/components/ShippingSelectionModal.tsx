import { useState, useEffect } from 'react';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';
import type { ShippingRate } from '@/modules/shipping/types';
import { useShippingRates } from '@/modules/shipping/hooks/useShippingRates';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';

interface ShippingSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRate: (rate: ShippingRate) => void;
  currentRate: ShippingRate | null;
}

export function ShippingSelectionModal({
  open,
  onOpenChange,
  onSelectRate,
  currentRate,
}: ShippingSelectionModalProps) {
  const { data: rates = [], isLoading, error } = useShippingRates(open);
  const [selectedRateId, setSelectedRateId] = useState<string>('');

  useEffect(() => {
    if (open && currentRate) {
      setSelectedRateId(currentRate.id);
    }
  }, [open, currentRate]);

  useEffect(() => {
    if (error) {
      toast.error('Erro ao carregar taxas de entrega');
    }
  }, [error]);

  const handleConfirm = () => {
    const rate = rates.find((r) => r.id === selectedRateId);
    if (rate) {
      onSelectRate(rate);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Selecione seu Bairro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Bairro de Entrega (Extrema/MG)</label>
            <Select value={selectedRateId} onValueChange={setSelectedRateId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Carregando...' : 'Selecione...'} />
              </SelectTrigger>
              <SelectContent>
                {rates.map((rate) => (
                  <SelectItem key={rate.id} value={rate.id}>
                    {rate.neighborhood} - R$ {rate.price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full gradient-gold text-primary-foreground"
            onClick={handleConfirm}
            disabled={!selectedRateId}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
