import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CustomerInfo, DeliveryMethod } from '@/types/product';
import type { CartItem, ShippingRate } from '@/types/product';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import logo from '@/assets/vacasemfundo.png';

const THANK_YOU_MESSAGE =
  'Obrigado por fazer o pedido, de acordo com os horários da nossa loja logo o pedido será processado.';

export interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerData: CustomerInfo;
  items: CartItem[];
  total: number;
  itemsSubtotal: number;
  deliveryMethod: DeliveryMethod;
  shippingRate: ShippingRate | null;
  paymentLabel: string;
  changeAmount?: number | null;
  onConfirm: () => Promise<void>;
  /** Chamado ao clicar em "Ver meus pedidos" — deve limpar carrinho, fechar modal e navegar */
  onViewOrders: () => void;
}

export const OrderSummaryModal = ({
  isOpen,
  onClose,
  customerData,
  items,
  total,
  itemsSubtotal,
  deliveryMethod,
  shippingRate,
  paymentLabel,
  changeAmount,
  onConfirm,
  onViewOrders,
}: OrderSummaryModalProps) => {
  const [step, setStep] = useState<'summary' | 'success'>('summary');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shippingPrice = deliveryMethod === 'pickup' ? 0 : shippingRate?.price ?? 0;
  const shippingLabel = deliveryMethod === 'pickup' ? 'Retirada na Loja' : shippingRate?.neighborhood ?? 'N/A';

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      setStep('success');
    } catch {
      // Error already handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewOrders = () => {
    onViewOrders();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep('summary');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {step === 'summary' ? (
          <>
            <h2 className="text-xl font-semibold text-foreground">Resumo do pedido</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Nome</p>
                <p className="text-foreground">{customerData.responsibleName}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  {deliveryMethod === 'delivery' ? 'Endereço' : 'Retirada'}
                </p>
                <p className="text-foreground">
                  {deliveryMethod === 'delivery'
                    ? `${customerData.address}${customerData.complement ? ` - ${customerData.complement}` : ''}`
                    : 'Retirada na Loja'}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Telefone</p>
                <p className="text-foreground">{customerData.phone}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">E-mail</p>
                <p className="text-foreground">{customerData.email || '—'}</p>
              </div>
              {customerData.orderNotes && (
                <div>
                  <p className="font-medium text-muted-foreground">Observações</p>
                  <p className="text-foreground">{customerData.orderNotes}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-muted-foreground">Forma de pagamento</p>
                <p className="text-foreground">
                  {paymentLabel}
                  {changeAmount != null && changeAmount > 0 ? ` (troco para R$ ${changeAmount.toFixed(2)})` : ''}
                </p>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                {items.map((item) => {
                  const hasDiscount =
                    !!(item.product.discount_percentage && item.product.discount_percentage > 0 &&
                      (!item.product.discount_expires_at || new Date(item.product.discount_expires_at) > new Date()));
                  const price = hasDiscount
                    ? item.product.price * (1 - (item.product.discount_percentage! / 100))
                    : item.product.price;
                  return (
                    <div key={item.product.id} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className={cn('text-foreground', hasDiscount && 'text-green-600 font-medium')}>
                        R$ {(price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R$ {itemsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete ({shippingLabel})</span>
                  <span>R$ {shippingPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <Button
              type="button"
              className="w-full h-12 gradient-gold text-primary-foreground shadow-gold text-lg font-semibold"
              disabled={isSubmitting}
              onClick={handleConfirm}
            >
              {isSubmitting ? 'Enviando...' : 'Confirmar'}
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <img src={logo} alt="Docim da Gringa" className="h-24 w-auto object-contain mb-6" />
            <p className="text-foreground text-lg leading-relaxed mb-8">{THANK_YOU_MESSAGE}</p>
            <Button
              type="button"
              className="w-full h-12 gradient-gold text-primary-foreground shadow-gold text-lg font-semibold"
              onClick={handleViewOrders}
            >
              Ver meus pedidos
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
