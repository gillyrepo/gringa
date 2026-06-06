import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, MessageCircle, Pencil, Truck, ShoppingCart, Clock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { CartItem } from '@/components/CartItem';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { CouponInput } from '@/components/CouponInput';
import truckIcon from '@/assets/caminhao.png';
import shopIcon from '@/assets/loja.png';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { ShippingSelectionModal } from '@/components/ShippingSelectionModal';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart, shippingRate, setShippingRate, appliedCoupon, getDiscountAmount } = useCart();
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup' | null>(null);
  const [storeObservation, setStoreObservation] = useState<string | null>(null);

  const total = getTotal();
  const itemsSubtotal = items.reduce((acc, item) => {
    const hasDiscount = !!(item.product.discount_percentage && item.product.discount_percentage > 0 && (!item.product.discount_expires_at || new Date(item.product.discount_expires_at) > new Date()));
    const price = hasDiscount ? item.product.price * (1 - (item.product.discount_percentage! / 100)) : item.product.price;
    return acc + price * item.quantity;
  }, 0);

  // Sync shipping rate with delivery method
  useEffect(() => {
    if (shippingRate) {
      setDeliveryMethod('delivery');
    }
  }, [shippingRate]);

  const handlePickupSelection = () => {
    setDeliveryMethod('pickup');
    setShippingRate(null); // Clear shipping rate when picking up
  };
  useEffect(() => {
    const fetchStoreSettings = async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('observation')
        .eq('store', 'docimdagringa')
        .single();

      if (data && data.observation) {
        setStoreObservation(data.observation);
      }
    };
    fetchStoreSettings();
  }, []);

  const handleClearCart = () => {
    clearCart();
    setIsClearDialogOpen(false);
  };

  const handleCheckout = () => {
    if (!deliveryMethod) {
      toast.error('Por favor, selecione "Local de Entrega" ou "Buscar na Loja" para continuar.');
      return;
    }

    if (deliveryMethod === 'delivery' && !shippingRate) {
      toast.error('Por favor, selecione um bairro para entrega.');
      return;
    }

    navigate('/checkout', { state: { deliveryMethod } });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <main className="container px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Carrinho</h1>
          {items.length > 0 && (
            <ShoppingCart className="h-6 w-6 text-primary" />
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Carrinho vazio
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Adicione produtos para fazer seu pedido
            </p>
            <Link to="/">
              <Button className="gradient-gold text-primary-foreground shadow-gold">
                Ver Produtos
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium">
                  R$ {itemsSubtotal.toFixed(2)}
                </span>
              </div>
              <div className="space-y-4">
                <CouponInput />
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600 font-medium items-center">
                    <span>Desconto do Cupom</span>
                    <span>- R$ {getDiscountAmount().toFixed(2)}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground block">Selecione o tipo de entrega:</span>
                  <div className="flex justify-between text-sm items-center gap-2">
                    <Button
                      variant="outline"
                      className={`flex-1 h-auto py-2 px-3 rounded-full text-xs border transition-all shadow-sm flex flex-row items-center justify-center gap-2 ${deliveryMethod === 'delivery'
                        ? shippingRate
                          ? 'bg-primary/10 border-primary text-primary font-medium italic'
                          : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 animate-pulse font-medium italic'
                        : !deliveryMethod
                          ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 animate-pulse font-medium italic'
                          : 'border-muted-foreground/30 text-muted-foreground hover:border-primary/50 italic'
                        }`}
                      onClick={() => setIsShippingModalOpen(true)}
                    >
                      <img src={truckIcon} alt="Entrega" className={`h-5 w-5 ${deliveryMethod === 'delivery' || !deliveryMethod ? 'brightness-0 invert' : 'opacity-50'}`} />
                      <span className="truncate">
                        {deliveryMethod === 'delivery' && shippingRate
                          ? `${shippingRate.neighborhood} - R$ ${shippingRate.price.toFixed(2)}`
                          : "Entregar em Casa"}
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      className={`flex-1 h-auto py-2 px-3 rounded-full text-xs border transition-all shadow-sm flex flex-row items-center justify-center gap-2 ${deliveryMethod === 'pickup'
                        ? 'bg-orange-500 text-white border-orange-500 font-medium italic'
                        : !deliveryMethod
                          ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600 animate-pulse font-medium italic'
                          : 'border-muted-foreground/30 text-muted-foreground hover:border-orange-500/50 italic'
                        }`}
                      onClick={handlePickupSelection}
                    >
                      <img src={shopIcon} alt="Loja" className={`h-5 w-5 ${deliveryMethod === 'pickup' || !deliveryMethod ? 'brightness-0 invert' : 'opacity-50'}`} />
                      <span className="truncate">Buscar na Loja</span>
                    </Button>
                  </div>
                </div>
                {storeObservation && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{storeObservation}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    Em breve mais pontos de entrega! <Truck className="h-3.5 w-3.5" />
                  </p>
                  <p>
                    <a
                      href="https://wa.me/5535991154125?text=Olá%2C%20gostaria%20de%20ver%20a%20possibilidade%20de%20um%20novo%20ponto%20de%20entrega."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline transition-colors"
                    >
                      Entre em contato para ver a possibilidade de um novo local de entrega.
                    </a>
                  </p>
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-xl text-primary">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-14 gradient-gold text-primary-foreground shadow-gold text-lg font-semibold mt-6"
              onClick={handleCheckout}
            >
              Continuar
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </>
        )}
      </main>

      <BottomNav />

      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Carrinho</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja remover todos os itens do carrinho? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCart} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Limpeza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShippingSelectionModal
        open={isShippingModalOpen}
        onOpenChange={setIsShippingModalOpen}
        onSelectRate={setShippingRate}
        currentRate={shippingRate}
      />
    </div>
  );
};

export default CartPage;
