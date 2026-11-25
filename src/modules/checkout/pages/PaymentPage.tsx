import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PIX_CONFIG } from '@/shared/config/store';
import { useCart } from '@/modules/cart/context/CartContext';
import {
  getEffectiveProductPrice,
  getProductDiscountAmount,
  isProductDiscountActive,
} from '@/modules/products/utils/pricing';
import type {
  CustomerInfo,
  DeliveryMethod,
  PaymentMethodCode,
  PaymentSubmission,
} from '@/modules/checkout/types';
import { gerarPix } from '@/modules/checkout/services/pixService';
import { PaymentModal } from '@/modules/checkout/components/PaymentModal';
import { ChangeModal } from '@/modules/checkout/components/ChangeModal';
import { OrderSummaryModal } from '@/modules/checkout/components/OrderSummaryModal';
import type { Order } from '@/modules/orders/types';
import { createOrder } from '@/modules/orders/services/orderService';
import { Header } from '@/shared/components/layout/Header';
import { BottomNav } from '@/shared/components/layout/BottomNav';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import pixIcon from '@/shared/assets/pixicon.png';
import truckIcon from '@/shared/assets/caminhao.png';
import shopIcon from '@/shared/assets/loja.png';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    items,
    getSubtotal,
    getTotal,
    clearCart,
    addOrder,
    shippingRate,
    appliedCoupon,
    getDiscountAmount,
  } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState('');
  const [pendingSubmission, setPendingSubmission] = useState<PaymentSubmission | null>(null);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);

  const customerData = location.state?.customerData as CustomerInfo | undefined;
  const deliveryMethod = location.state?.deliveryMethod as DeliveryMethod | undefined;

  useEffect(() => {
    if (!customerData || items.length === 0) {
      toast.error('Dados inválidos para pagamento.');
      navigate('/checkout', { replace: true });
    }
  }, [customerData, items.length, navigate]);

  const total = getTotal();
  const itemsSubtotal = getSubtotal();

  const handlePayment = () => {
    const code = gerarPix({
      chave: PIX_CONFIG.key,
      nome: PIX_CONFIG.merchantName,
      cidade: PIX_CONFIG.merchantCity,
      valor: total,
      txid: `GRINGA${Date.now().toString().slice(-4)}`,
    });

    setPixCode(code);
    setIsPaymentModalOpen(true);
  };

  const generateWhatsAppMessage = (
    data: CustomerInfo,
    paymentText: string,
    isPix: boolean
  ) => {
    const itemsList = items
      .map((item) => {
        const hasDiscount = isProductDiscountActive(item.product);
        const price = getEffectiveProductPrice(item.product);

        let itemString = `- ${item.product.name} (Qtd: ${item.quantity}) - R$ ${(price * item.quantity).toFixed(2)}`;
        if (hasDiscount) {
          itemString += ` (Desconto de ${item.product.discount_percentage}%)`;
        }
        return itemString;
      })
      .join('\n');

    return `Olá, segue meu pedido:

*Nome do responsável:* ${data.responsibleName}
${deliveryMethod === 'delivery' ? `*Endereço:* ${data.address} ${data.complement ? `- ${data.complement}` : ''}\n` : '*Retirada na Loja*\n'}*Telefone:* ${data.phone}
*E-mail:* ${data.email}
${data.orderNotes ? `*Observações:* ${data.orderNotes}\n` : ''}
*Forma de Pagamento:* ${paymentText}
${isPix ? '\n_O pagamento foi feito via PIX, o cliente precisa enviar o comprovante de pagamento._\n' : ''}
*Itens do pedido:*
${itemsList}

*Frete (${shippingRate?.neighborhood || (deliveryMethod === 'pickup' ? 'Retirada na Loja' : 'N/A')}):* R$ ${(deliveryMethod === 'pickup' ? 0 : (shippingRate?.price || 0)).toFixed(2)}
*Valor total do pedido:* R$ ${total.toFixed(2)}`;
  };

  const handlePaymentMethodClick = (method: string) => {
    setPendingPaymentMethod(method);
    setIsChangeModalOpen(true);
  };

  const handleConfirmChange = (
    paymentType: 'card' | 'cash_exact' | 'cash_change',
    changeAmount?: number
  ) => {
    if (!pendingPaymentMethod) return;

    const isDelivery = pendingPaymentMethod.includes('Entrega');
    const paymentLocation = isDelivery ? 'na entrega' : 'na loja';
    let whatsappPaymentText = '';
    let paymentMethodCode: PaymentMethodCode = 'card_delivery';
    let paymentLabel = '';

    switch (paymentType) {
      case 'card':
        whatsappPaymentText = `Cliente vai pagar ${paymentLocation} com cartão`;
        paymentMethodCode = isDelivery ? 'card_delivery' : 'card_store';
        paymentLabel = isDelivery ? 'Pagar na Entrega - Cartão' : 'Pagar na Loja - Cartão';
        break;
      case 'cash_exact':
        whatsappPaymentText = `Cliente vai pagar ${paymentLocation} com dinheiro, não precisa de troco`;
        paymentMethodCode = isDelivery ? 'cash_exact_delivery' : 'cash_exact_store';
        paymentLabel = isDelivery
          ? 'Pagar na Entrega - Dinheiro (sem troco)'
          : 'Pagar na Loja - Dinheiro (sem troco)';
        break;
      case 'cash_change':
        whatsappPaymentText = changeAmount
          ? `Cliente vai pagar ${paymentLocation} com dinheiro, precisa de troco para R$ ${changeAmount.toFixed(2)}`
          : `Cliente vai pagar ${paymentLocation} com dinheiro`;
        paymentMethodCode = isDelivery ? 'cash_change_delivery' : 'cash_change_store';
        paymentLabel = isDelivery
          ? 'Pagar na Entrega - Dinheiro (com troco)'
          : 'Pagar na Loja - Dinheiro (com troco)';
        break;
    }

    setPendingSubmission({
      whatsappPaymentText,
      paymentMethodCode,
      paymentLabel,
      changeAmount: paymentType === 'cash_change' ? (changeAmount ?? null) : null,
    });
    setPendingPaymentMethod(null);
    setIsChangeModalOpen(false);
    setIsOrderSummaryOpen(true);
  };

  const onSubmit = async ({
    whatsappPaymentText,
    paymentMethodCode,
    paymentLabel,
    changeAmount = null,
  }: PaymentSubmission) => {
    if (!customerData || !deliveryMethod) return;
    setIsSubmitting(true);

    try {
      const message = generateWhatsAppMessage(
        customerData,
        whatsappPaymentText,
        paymentMethodCode === 'pix'
      );

      let createdOrder: Awaited<ReturnType<typeof createOrder>> | null = null;
      try {
        createdOrder = await createOrder({
          items,
          customerInfo: customerData,
          whatsappMessage: message,
          shippingRate: shippingRate || undefined,
          deliveryMethod,
          paymentMethod: paymentMethodCode,
          paymentLabel,
          changeAmount,
          couponCode: appliedCoupon?.code,
        });
      } catch (dbError) {
        console.error('Erro ao salvar pedido no banco:', dbError);
        toast.error('Aviso: Pedido gerado, mas houve um erro ao salvar histórico.');
      }

      const orderId = createdOrder?.id || Date.now().toString();
      const totalItemsDiscount = items.reduce(
        (acc, item) => acc + getProductDiscountAmount(item.product, item.quantity),
        0
      );

      const order: Order = {
        id: orderId,
        orderNumber: createdOrder?.order_number,
        items: [...items],
        total: createdOrder?.total_amount ?? total,
        customerInfo: customerData,
        shippingRate: shippingRate || undefined,
        delivery_method: deliveryMethod,
        payment_method: paymentMethodCode,
        payment_label: paymentLabel,
        change_amount: changeAmount,
        coupon_code: appliedCoupon?.code,
        total_discount: createdOrder?.total_discount ?? (getDiscountAmount() + totalItemsDiscount),
        createdAt: createdOrder?.created_at || new Date().toISOString(),
        status: 'pending',
      };

      addOrder(order);
      toast.success('Pedido enviado com sucesso!');
    } catch {
      toast.error('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 || !customerData || !deliveryMethod) {
    return null;
  }

  return (
    <div className="h-screen overflow-y-auto bg-background pb-32">
      <Header />

      <main className="container px-4 py-4">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Pagamento</h1>

        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <h2 className="font-semibold text-foreground mb-3">Resumo do Pedido</h2>
          <div className="space-y-2 text-sm">
            {items.map((item) => {
              const hasDiscount = isProductDiscountActive(item.product);
              const price = getEffectiveProductPrice(item.product);

              return (
                <div key={item.product.id} className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.product.name}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-green-600 font-medium">
                        Desconto de {item.product.discount_percentage}% aplicado
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    {hasDiscount && (
                      <span className="text-xs text-muted-foreground line-through">
                        R$ {(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    )}
                    <span className={cn('text-foreground', hasDiscount && 'text-green-600 font-medium')}>
                      R$ {(price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="border-t border-border pt-2 mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">R$ {itemsSubtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && getDiscountAmount() > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Desconto do Cupom ({appliedCoupon.code})</span>
                  <span>- R$ {getDiscountAmount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Frete ({deliveryMethod === 'pickup' ? 'Retirada na Loja' : (shippingRate?.neighborhood || 'N/A')})
                </span>
                <span className="text-foreground">
                  R$ {(deliveryMethod === 'pickup' ? 0 : (shippingRate?.price || 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-6">
          <Button
            type="button"
            onClick={handlePayment}
            disabled={isSubmitting}
            className="w-full h-16 bg-green-600 hover:bg-green-700 text-white shadow-md text-lg font-semibold flex items-center justify-start px-6 gap-4"
          >
            <img src={pixIcon} alt="PIX" className="h-8 w-8 brightness-0 invert flex-shrink-0" />
            <div className="flex flex-col items-start leading-tight">
              <span>Fazer Pagamento Agora</span>
              <span className="text-sm opacity-90 italic font-normal">(PIX)</span>
            </div>
          </Button>

          {deliveryMethod === 'delivery' && shippingRate && (
            <Button
              type="button"
              onClick={() => handlePaymentMethodClick('Entrega')}
              disabled={isSubmitting}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white shadow-md text-lg font-semibold flex items-center justify-start px-6 gap-4"
            >
              <img
                src={truckIcon}
                alt="Entrega"
                className="h-8 w-8 brightness-0 invert flex-shrink-0"
              />
              <div className="flex flex-col items-start leading-tight">
                <span>Pagar na Entrega</span>
                <span className="text-sm opacity-90 italic font-normal">
                  (Cartão ou Dinheiro)
                </span>
              </div>
            </Button>
          )}

          {deliveryMethod === 'pickup' && (
            <Button
              type="button"
              onClick={() => handlePaymentMethodClick('Loja')}
              disabled={isSubmitting}
              className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white shadow-md text-lg font-semibold flex items-center justify-start px-6 gap-4"
            >
              <img
                src={shopIcon}
                alt="Loja"
                className="h-8 w-8 brightness-0 invert flex-shrink-0"
              />
              <div className="flex flex-col items-start leading-tight">
                <span>Pagar na Loja</span>
                <span className="text-sm opacity-90 italic font-normal">
                  (Cartão ou Dinheiro)
                </span>
              </div>
            </Button>
          )}
        </div>
      </main>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        pixCode={pixCode}
        total={total}
        onConfirm={() => {
          setIsPaymentModalOpen(false);
          setPendingSubmission({
            whatsappPaymentText: 'PIX (Cliente enviará o comprovante)',
            paymentMethodCode: 'pix',
            paymentLabel: 'PIX',
            changeAmount: null,
          });
          setIsOrderSummaryOpen(true);
        }}
        isSubmitting={false}
      />

      <ChangeModal
        isOpen={isChangeModalOpen}
        onClose={() => {
          setIsChangeModalOpen(false);
          setPendingPaymentMethod(null);
        }}
        onConfirm={handleConfirmChange}
        isStorePickup={pendingPaymentMethod === 'Loja'}
      />

      {pendingSubmission && (
        <OrderSummaryModal
          isOpen={isOrderSummaryOpen}
          onClose={() => {
            setIsOrderSummaryOpen(false);
            setPendingSubmission(null);
          }}
          customerData={customerData}
          items={items}
          total={total}
          itemsSubtotal={itemsSubtotal}
          deliveryMethod={deliveryMethod}
          shippingRate={shippingRate ?? null}
          paymentLabel={pendingSubmission.paymentLabel}
          changeAmount={pendingSubmission.changeAmount ?? null}
          couponCode={appliedCoupon?.code}
          couponDiscount={getDiscountAmount()}
          onConfirm={async () => {
            await onSubmit(pendingSubmission);
          }}
          onViewOrders={() => {
            clearCart();
            setIsOrderSummaryOpen(false);
            setPendingSubmission(null);
            navigate('/pedidos');
          }}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default PaymentPage;
