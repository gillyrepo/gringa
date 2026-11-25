import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '@/modules/cart/context/CartContext';
import { CouponInput } from '@/modules/coupons/components/CouponInput';
import type { CustomerInfo, DeliveryMethod } from '@/modules/checkout/types';
import {
  createCheckoutSchema,
  type CheckoutFormValues,
} from '@/modules/checkout/schemas/checkoutSchema';
import {
  getEffectiveProductPrice,
  isProductDiscountActive,
} from '@/modules/products/utils/pricing';
import { useStoreSettings } from '@/modules/store-settings/hooks/useStoreSettings';
import { Header } from '@/shared/components/layout/Header';
import { BottomNav } from '@/shared/components/layout/BottomNav';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { cn } from '@/shared/lib/utils';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    items,
    getSubtotal,
    getTotal,
    customerInfo,
    setCustomerInfo,
    shippingRate,
    appliedCoupon,
    getDiscountAmount,
  } = useCart();

  const deliveryMethod: DeliveryMethod = location.state?.deliveryMethod || 'delivery';
  const { data: storeSettings } = useStoreSettings();

  const formSchema = useMemo(() => createCheckoutSchema(deliveryMethod), [deliveryMethod]);

  const total = getTotal();
  const itemsSubtotal = getSubtotal();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      responsibleName: customerInfo?.responsibleName || '',
      address: customerInfo?.address || '',
      complement: customerInfo?.complement || '',
      phone: customerInfo?.phone || '',
      email: customerInfo?.email || '',
      orderNotes: customerInfo?.orderNotes || '',
    },
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/carrinho', { replace: true });
    }
  }, [items.length, navigate]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      setCustomerInfo(value as CustomerInfo);
    });
    return () => subscription.unsubscribe();
  }, [form, setCustomerInfo]);

  const onProceedToPayment = (data: CheckoutFormValues) => {
    const customerData: CustomerInfo = {
      responsibleName: data.responsibleName,
      address: data.address || '',
      complement: data.complement || '',
      phone: data.phone,
      email: data.email || '',
      orderNotes: data.orderNotes,
    };

    setCustomerInfo(customerData);
    navigate('/payment', { state: { customerData, deliveryMethod } });
  };

  if (items.length === 0) {
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Frete ({deliveryMethod === 'pickup' ? 'Retirada na Loja' : (shippingRate?.neighborhood || 'N/A')})
                </span>
                <span className="text-foreground">
                  R$ {(deliveryMethod === 'pickup' ? 0 : (shippingRate?.price || 0)).toFixed(2)}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600 font-medium pt-1">
                  <span>Desconto do Cupom ({appliedCoupon.code})</span>
                  <span>- R$ {getDiscountAmount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <CouponInput />
            </div>
          </div>
        </div>

        <div className="mb-2 text-xs text-muted-foreground flex items-center gap-1 pl-1">
          <span>*</span>
          <p>Os dados abaixo ficarão salvos para os próximos pedidos</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-foreground mb-4">Seus Dados</h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onProceedToPayment)} className="space-y-4">
              <FormField
                control={form.control}
                name="responsibleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 91234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {deliveryMethod === 'delivery' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número, cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto, bloco, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {deliveryMethod === 'pickup' && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg flex flex-col gap-2 border border-border">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    Endereço de Retirada na Loja
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {storeSettings?.store_address || 'Consulte o endereço pelo WhatsApp'}
                  </p>
                  {storeSettings?.observation && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2 p-3 bg-card rounded border border-border">
                      <span className="font-semibold block mb-1">
                        Horário de Funcionamento / Observações:
                      </span>
                      {storeSettings.observation}
                    </p>
                  )}
                </div>
              )}

              {deliveryMethod === 'delivery' && (
                <FormField
                  control={form.control}
                  name="orderNotes"
                  render={({ field }) => (
                    <FormItem className="pt-2">
                      <FormLabel>Observações do Pedido (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Deixar na portaria, campainha quebrada..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full h-14 gradient-gold text-primary-foreground shadow-gold text-lg font-semibold mt-6"
              >
                Continuar
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </form>
          </Form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default CheckoutPage;
