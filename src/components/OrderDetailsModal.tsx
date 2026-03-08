
import { useState, useEffect } from 'react';
import { Order } from '@/types/product';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onSaveInternalComment?: (orderId: string, comment: string) => void;
  onSaveExternalComment?: (orderId: string, comment: string) => void;
  isSaving?: boolean;
}

export const OrderDetailsModal = ({
  order,
  isOpen,
  onClose,
  isAdmin = false,
  onSaveInternalComment,
  onSaveExternalComment,
  isSaving = false,
}: OrderDetailsModalProps) => {
  const [internalComment, setInternalComment] = useState('');
  const [externalComment, setExternalComment] = useState('');

  useEffect(() => {
    if (order) {
      setInternalComment(order.internal_comments || '');
      setExternalComment(order.external_comments || '');
    }
  }, [order]);

  if (!order) return null;

  const resolvedDeliveryMethod = order.delivery_method || (order.shippingRate ? 'delivery' : 'pickup');
  const deliveryLabel = resolvedDeliveryMethod === 'pickup' ? 'Retirada na loja' : 'Entrega';
  const paymentLabel = order.payment_label || 'Não informado';
  const shouldShowAddress = resolvedDeliveryMethod === 'delivery';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detalhes do Pedido #{order.orderNumber ? order.orderNumber : order.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="rounded-lg border bg-muted/40 p-3">
            <h3 className="font-semibold mb-2">Informações principais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border bg-background p-2">
                <span className="text-xs uppercase font-bold text-muted-foreground block">Forma de pagamento</span>
                <span className="font-semibold">{paymentLabel}</span>
                {typeof order.change_amount === 'number' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Troco para: R$ {order.change_amount.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="rounded-md border bg-background p-2">
                <span className="text-xs uppercase font-bold text-muted-foreground block">Forma de entrega</span>
                <span className="font-semibold">{deliveryLabel}</span>
                {shouldShowAddress && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {order.customerInfo.address}
                    {order.customerInfo.complement ? ` - ${order.customerInfo.complement}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Cliente</h3>
              <p className="text-sm"><span className="font-medium">Responsável:</span> {order.customerInfo.responsibleName}</p>
              <p className="text-sm"><span className="font-medium">Email:</span> {order.customerInfo.email}</p>
              <p className="text-sm"><span className="font-medium">Telefone:</span> {order.customerInfo.phone}</p>
              {shouldShowAddress && (
                <p className="text-sm"><span className="font-medium">Endereço:</span> {order.customerInfo.address} {order.customerInfo.complement ? `- ${order.customerInfo.complement}` : ''}</p>
              )}
              {order.customerInfo.orderNotes && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                   <span className="font-medium block mb-1">Observações do Cliente:</span>
                   {order.customerInfo.orderNotes}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Resumo</h3>
              <p className="text-sm mb-2">Data: {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
              
              <div className="space-y-1 text-sm border-t pt-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {order.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete {order.shippingRate ? `(${order.shippingRate.city} - ${order.shippingRate.neighborhood})` : ''}:</span>
                  <span>R$ {(order.shippingRate?.price ?? (order.total - order.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0))).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t mt-1">
                  <span>Total:</span>
                  <span>R$ {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Itens</h3>
            <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{item.quantity}x {item.product.name}</span>
                  <span>R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comentários para o cliente */}
          <div>
            <h3 className="font-semibold mb-2">Comentários para o cliente</h3>
            <div className="flex gap-2">
              <Textarea
                value={externalComment}
                onChange={(e) => setExternalComment(e.target.value)}
                placeholder={isAdmin ? "Escreva uma mensagem para o cliente..." : "Nenhum comentário do administrador."}
                className="min-h-[80px]"
                disabled={!isAdmin}
                readOnly={!isAdmin}
              />
            </div>
            {isAdmin && onSaveExternalComment && (
              <Button 
                className="mt-2 w-full" 
                onClick={() => onSaveExternalComment(order.id, externalComment)}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Comentário Cliente
              </Button>
            )}
          </div>

          {/* Comentários internos (Apenas Admin) */}
          {isAdmin && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2 text-muted-foreground flex items-center gap-2">
                Comentários internos
              </h3>
              <div className="flex gap-2">
                <Textarea
                  value={internalComment}
                  onChange={(e) => setInternalComment(e.target.value)}
                  placeholder="Adicione observações internas sobre este pedido..."
                  className="min-h-[80px]"
                />
              </div>
              {onSaveInternalComment && (
                <Button 
                  variant="secondary"
                  className="mt-2 w-full" 
                  onClick={() => onSaveInternalComment(order.id, internalComment)}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Comentário Interno
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
