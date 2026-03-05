import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CustomerInfo, Order } from '@/types/product';
import pixIcon from '@/assets/pixicon.png';
import truckIcon from '@/assets/caminhao.png';
import shopIcon from '@/assets/loja.png';
import { supabase } from '@/lib/supabase';
import { createOrder } from '@/services/orderService';
import { PaymentModal } from '@/components/PaymentModal';
import { ChangeModal } from '@/components/ChangeModal';
import { gerarPix } from '@/services/pixService';
import { cn } from '@/lib/utils';

const DEFAULT_WHATSAPP_NUMBER = '5535991154125';

const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { items, getTotal, clearCart, addOrder, shippingRate } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
    const [pendingPaymentMethod, setPendingPaymentMethod] = useState<string | null>(null);
    const [pixCode, setPixCode] = useState('');

    const customerData = location.state?.customerData as CustomerInfo;
    const deliveryMethod = location.state?.deliveryMethod as 'delivery' | 'pickup';

    useEffect(() => {
        if (!customerData || items.length === 0) {
            toast.error('Dados inválidos para pagamento.');
            navigate('/checkout');
        }
    }, [customerData, items.length, navigate]);

    const total = getTotal();
    const itemsSubtotal = items.reduce((acc, item) => {
        const hasDiscount = !!(item.product.discount_percentage && item.product.discount_percentage > 0 && (!item.product.discount_expires_at || new Date(item.product.discount_expires_at) > new Date()));
        const price = hasDiscount ? item.product.price * (1 - (item.product.discount_percentage! / 100)) : item.product.price;
        return acc + price * item.quantity;
    }, 0);

    const handlePayment = () => {
        const chavePix = '63813434000120';
        const nome = 'GRINGA STORE';
        const cidade = 'SAO PAULO';

        const code = gerarPix({
            chave: chavePix,
            nome,
            cidade,
            valor: total,
            txid: `GRINGA${Date.now().toString().slice(-4)}`
        });

        setPixCode(code);
        setIsPaymentModalOpen(true);
    };

    const generateWhatsAppMessage = (data: CustomerInfo, paymentMethod: string, changeInfo?: string) => {
        const itemsList = items
            .map((item) => {
                const hasDiscount = !!(item.product.discount_percentage && item.product.discount_percentage > 0 && (!item.product.discount_expires_at || new Date(item.product.discount_expires_at) > new Date()));
                const price = hasDiscount ? item.product.price * (1 - (item.product.discount_percentage! / 100)) : item.product.price;

                let itemString = `- ${item.product.name} (Qtd: ${item.quantity}) - R$ ${(price * item.quantity).toFixed(2)}`;
                if (hasDiscount) {
                    itemString += ` (Desconto de ${item.product.discount_percentage}%)`;
                }
                return itemString;
            })
            .join('\n');

        let paymentText = paymentMethod;
        if (paymentMethod === 'PIX') {
            paymentText += ' (Cliente enviará o comprovante)';
        } else if (changeInfo) {
            paymentText += ` (${changeInfo})`;
        }

        return `Olá, segue meu pedido:

*Nome do responsável:* ${data.responsibleName}
${deliveryMethod === 'delivery' ? `*Endereço:* ${data.address} ${data.complement ? `- ${data.complement}` : ''}\n` : '*Retirada na Loja*\n'}*Telefone:* ${data.phone}
*E-mail:* ${data.email}
${data.orderNotes ? `*Observações:* ${data.orderNotes}\n` : ''}
*Forma de Pagamento:* ${paymentText}
${paymentMethod === 'PIX' ? '\n_O pagamento foi feito via PIX, o cliente precisa enviar o comprovante de pagamento._\n' : ''}
*Itens do pedido:*
${itemsList}

*Frete (${shippingRate?.neighborhood || (deliveryMethod === 'pickup' ? 'Retirada na Loja' : 'N/A')}):* R$ ${(deliveryMethod === 'pickup' ? 0 : (shippingRate?.price || 0)).toFixed(2)}
*Valor total do pedido:* R$ ${total.toFixed(2)}`;
    };

    const handlePaymentMethodClick = (method: string) => {
        setPendingPaymentMethod(method);
        setIsChangeModalOpen(true);
    };

    const handleConfirmChange = (paymentType: 'card' | 'cash_exact' | 'cash_change', changeAmount?: number) => {
        if (!pendingPaymentMethod) return;

        const isDelivery = pendingPaymentMethod.includes('Entrega');
        const paymentLocation = isDelivery ? 'na entrega' : 'na loja';
        let whatsappPaymentText = '';

        switch (paymentType) {
            case 'card':
                whatsappPaymentText = `Cliente vai pagar ${paymentLocation} com cartão`;
                break;
            case 'cash_exact':
                whatsappPaymentText = `Cliente vai pagar ${paymentLocation} com dinheiro, não precisa de troco`;
                break;
            case 'cash_change':
                if (changeAmount) {
                    whatsappPaymentText = `Cliente vai pagar ${paymentLocation} com dinheiro, precisa de troco para R$ ${changeAmount.toFixed(2)}`;
                } else {
                    whatsappPaymentText = `Cliente vai pagar ${paymentLocation} com dinheiro`;
                }
                break;
        }

        onSubmit(whatsappPaymentText);
        setPendingPaymentMethod(null);
    };

    const onSubmit = async (paymentMethod: string) => {
        if (!customerData) return;
        setIsSubmitting(true);

        try {
            const message = generateWhatsAppMessage(customerData, paymentMethod);

            let createdOrder = null;
            try {
                createdOrder = await createOrder({
                    items,
                    total,
                    customerInfo: customerData,
                    whatsappMessage: message,
                    shippingRate: shippingRate || undefined,
                });
            } catch (dbError) {
                console.error('Erro ao salvar pedido no banco:', dbError);
                toast.error('Aviso: Pedido gerado, mas houve um erro ao salvar histórico.');
            }

            const orderId = createdOrder?.id || Date.now().toString();

            const order: Order = {
                id: orderId,
                orderNumber: createdOrder?.order_number,
                items: [...items],
                total,
                customerInfo: customerData,
                shippingRate: shippingRate || undefined,
                createdAt: new Date().toISOString(),
                status: 'sent',
            };
            addOrder(order);

            const { data: storeSettings } = await supabase
                .from('store_settings')
                .select('whatsapp_number')
                .eq('store', 'docimdagringa')
                .single();

            const whatsappNumber = storeSettings?.whatsapp_number || DEFAULT_WHATSAPP_NUMBER;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

            clearCart();
            window.open(whatsappUrl, '_blank');
            toast.success('Pedido enviado com sucesso!');
            navigate('/pedidos');
        } catch (error) {
            toast.error('Erro ao enviar pedido. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0 || !customerData) {
        return null;
    }

    return (
        <div className="h-screen overflow-y-auto bg-background pb-32">
            <Header />

            <main className="container px-4 py-4">
                <Button
                    variant="ghost"
                    className="mb-4 -ml-2"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>

                <h1 className="text-2xl font-bold text-foreground mb-6">Pagamento</h1>

                <div className="bg-card rounded-xl border border-border p-4 mb-6">
                    <h2 className="font-semibold text-foreground mb-3">Resumo do Pedido</h2>
                    <div className="space-y-2 text-sm">
                        {items.map((item) => {
                            const hasDiscount = !!(item.product.discount_percentage && item.product.discount_percentage > 0 && (!item.product.discount_expires_at || new Date(item.product.discount_expires_at) > new Date()));
                            const price = hasDiscount ? item.product.price * (1 - (item.product.discount_percentage! / 100)) : item.product.price;

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
                                        <span className={cn("text-foreground", hasDiscount && "text-green-600 font-medium")}>
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
                                <span className="text-muted-foreground">Frete ({deliveryMethod === 'pickup' ? 'Retirada na Loja' : (shippingRate?.neighborhood || 'N/A')})</span>
                                <span className="text-foreground">R$ {(deliveryMethod === 'pickup' ? 0 : (shippingRate?.price || 0)).toFixed(2)}</span>
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
                            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white shadow-md text-lg font-semibold flex items-center justify-start px-6 gap-4"
                        >
                            <img src={truckIcon} alt="Entrega" className="h-8 w-8 brightness-0 invert flex-shrink-0" />
                            <div className="flex flex-col items-start leading-tight">
                                <span>Pagar na Entrega</span>
                                <span className="text-sm opacity-90 italic font-normal">(Cartão ou Dinheiro)</span>
                            </div>
                        </Button>
                    )}

                    {deliveryMethod === 'pickup' && (
                        <Button
                            type="button"
                            onClick={() => handlePaymentMethodClick('Loja')}
                            className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white shadow-md text-lg font-semibold flex items-center justify-start px-6 gap-4"
                        >
                            <img src={shopIcon} alt="Loja" className="h-8 w-8 brightness-0 invert flex-shrink-0" />
                            <div className="flex flex-col items-start leading-tight">
                                <span>Pagar na Loja</span>
                                <span className="text-sm opacity-90 italic font-normal">(Cartão ou Dinheiro)</span>
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
                    onSubmit('PIX');
                }}
                isSubmitting={isSubmitting}
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

            <BottomNav />
        </div>
    );
};

export default PaymentPage;
