import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import creditCardIcon from '@/shared/assets/creditcardicon.png';
import moneyIcon from '@/shared/assets/dinheiroicon.png';

interface ChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentType: 'card' | 'cash_exact' | 'cash_change', changeAmount?: number) => void;
  isStorePickup: boolean;
}

export const ChangeModal = ({ isOpen, onClose, onConfirm }: ChangeModalProps) => {
  const [step, setStep] = useState<'confirm' | 'amount'>('confirm');
  const [changeAmount, setChangeAmount] = useState('');

  const resetModal = () => {
    setStep('confirm');
    setChangeAmount('');
    onClose();
  };

  const handleChoice = (type: 'card' | 'cash_exact' | 'cash_change') => {
    if (type === 'cash_change') {
      setStep('amount');
    } else {
      onConfirm(type);
      resetModal();
    }
  };

  const handleAmountConfirm = () => {
    const amount = parseFloat(changeAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    onConfirm('cash_change', amount);
    resetModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forma de Pagamento</DialogTitle>
        </DialogHeader>

        {step === 'confirm' ? (
          <div className="space-y-4 py-4">
            <p className="text-center text-muted-foreground mb-4">
              Como você deseja realizar o pagamento?
            </p>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => handleChoice('card')}
                className="h-12 w-full justify-start px-4 text-left font-normal flex items-center gap-3"
              >
                <img
                  src={creditCardIcon}
                  alt="Cartão"
                  className="h-5 w-5 object-contain brightness-0"
                />
                Vou pagar com cartão
              </Button>

              <Button
                variant="outline"
                onClick={() => handleChoice('cash_exact')}
                className="h-12 w-full justify-start px-4 text-left font-normal flex items-center gap-3"
              >
                <img
                  src={moneyIcon}
                  alt="Dinheiro"
                  className="h-5 w-5 object-contain brightness-0"
                />
                Vou pagar com dinheiro / Sem Troco
              </Button>

              <Button
                variant="outline"
                onClick={() => handleChoice('cash_change')}
                className="h-12 w-full justify-start px-4 text-left font-normal flex items-center gap-3"
              >
                <img
                  src={moneyIcon}
                  alt="Dinheiro"
                  className="h-5 w-5 object-contain brightness-0"
                />
                Vou pagar com dinheiro, preciso de troco!
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="change-amount">Precisa de troco para quanto?</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="change-amount"
                  type="number"
                  placeholder="0.00"
                  className="pl-9"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('confirm')}>
                Voltar
              </Button>
              <Button onClick={handleAmountConfirm} disabled={!changeAmount}>
                Confirmar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
