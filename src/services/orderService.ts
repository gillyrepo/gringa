
import { supabase } from '@/lib/supabase';
import { CartItem, CustomerInfo, DeliveryMethod, Order, PaymentMethodCode, Product, ShippingRate } from '@/types/product';

export interface CreateOrderParams {
  items: CartItem[];
  total: number;
  customerInfo: CustomerInfo;
  whatsappMessage?: string;
  shippingRate?: ShippingRate;
  deliveryMethod?: DeliveryMethod;
  paymentMethod?: PaymentMethodCode;
  paymentLabel?: string;
  changeAmount?: number | null;
  couponCode?: string;
  couponDiscount?: number;
}

export const createOrder = async ({
  items,
  total,
  customerInfo,
  whatsappMessage,
  shippingRate,
  deliveryMethod,
  paymentMethod,
  paymentLabel,
  changeAmount,
  couponCode,
  couponDiscount,
}: CreateOrderParams) => {
  try {
    // 1. Insert Order Header
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerInfo.responsibleName,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        complement: customerInfo.complement || null,
        customer_email: customerInfo.email,
        order_notes: customerInfo.orderNotes || null,
        total_amount: total,
        total_discount: (couponDiscount || 0) + items.reduce((acc, item) => {
          // Calculate discount per item if applicable
          const discount = item.product.discount_percentage && item.product.discount_percentage > 0 && (!item.product.discount_expires_at || new Date(item.product.discount_expires_at) > new Date())
            ? (item.product.price * (item.product.discount_percentage / 100)) * item.quantity
            : 0;
          return acc + discount;
        }, 0),
        status: 'pending',
        whatsapp_message: whatsappMessage || '',
        shipping_city: shippingRate?.city || null,
        shipping_neighborhood: shippingRate?.neighborhood || null,
        shipping_cost: shippingRate?.price || 0,
        delivery_method: deliveryMethod || null,
        payment_method: paymentMethod || null,
        payment_label: paymentLabel || null,
        change_amount: typeof changeAmount === 'number' ? changeAmount : null,
        coupon_code: couponCode || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Detalhes do erro ao criar pedido (header):', {
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
        code: orderError.code
      });
      throw orderError;
    }

    if (!orderData) throw new Error('Falha ao criar pedido: Retorno vazio do banco');

    // 2. Insert Order Items
    const orderItems = items.map((item) => {
      // Calculate active discount
      const hasDiscount = item.product.discount_percentage && item.product.discount_percentage > 0 && (!item.product.discount_expires_at || new Date(item.product.discount_expires_at) > new Date());
      const discountPercentage = hasDiscount ? item.product.discount_percentage : 0;
      // Unit price is the price PAID (so discounted if applicable)
      const unitPrice = hasDiscount ? item.product.price * (1 - (discountPercentage! / 100)) : item.product.price;

      return {
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: unitPrice * item.quantity,
        order_total_amount: total,
        discount_percentage: discountPercentage,
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Detalhes do erro ao criar itens do pedido:', {
        message: itemsError.message,
        details: itemsError.details,
        hint: itemsError.hint,
        code: itemsError.code
      });
      throw itemsError;
    }

    // 3. Increment coupon usage if a coupon was used
    if (couponCode) {
      const { error: couponError } = await supabase.rpc('increment_coupon_usage', {
        coupon_code: couponCode
      });
      if (couponError) {
        console.error('Erro ao incrementar uso do cupom:', couponError);
      }
    }

    return orderData;
  } catch (error) {
    console.error('Erro geral ao criar pedido no Supabase:', error);
    throw error;
  }
};

export const getOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (
          *
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform Supabase response to Order type
  return data.map((order: any) => ({
    id: order.id,
    orderNumber: order.order_number,
    items: order.order_items.map((item: any) => ({
      product: item.products as Product,
      quantity: item.quantity,
    })),
    total: order.total_amount,
    customerInfo: {
      responsibleName: order.customer_name,
      address: order.customer_address,
      complement: order.complement || '',
      phone: order.customer_phone,
      email: order.customer_email || '',
      orderNotes: order.order_notes || '',
    },
    shippingRate: order.shipping_city ? {
      id: 'stored-rate',
      store: '',
      state: 'SP',
      city: order.shipping_city,
      neighborhood: order.shipping_neighborhood || '',
      price: Number(order.shipping_cost || 0),
    } : undefined,
    delivery_method: order.delivery_method || undefined,
    payment_method: order.payment_method || undefined,
    payment_label: order.payment_label || undefined,
    change_amount: order.change_amount !== null && order.change_amount !== undefined ? Number(order.change_amount) : null,
    createdAt: order.created_at,
    status: order.status,
    internal_comments: order.internal_comments,
    external_comments: order.external_comments,
    total_discount: order.total_discount,
    coupon_code: order.coupon_code,
  })) as Order[];
};

export const getOrdersByIds = async (ids: string[]) => {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (
          *
        )
      )
    `)
    .in('id', ids)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pedidos por IDs:', error);
    return [];
  }

  // Transform Supabase response to Order type
  return data.map((order: any) => ({
    id: order.id,
    items: order.order_items.map((item: any) => ({
      product: item.products as Product,
      quantity: item.quantity,
    })),
    total: order.total_amount,
    orderNumber: order.order_number,
    customerInfo: {
      responsibleName: order.customer_name,
      address: order.customer_address,
      complement: order.complement || '',
      phone: order.customer_phone,
      email: order.customer_email || '',
      orderNotes: order.order_notes || '',
    },
    shippingRate: order.shipping_city ? {
      id: 'stored-rate',
      store: '',
      state: 'SP',
      city: order.shipping_city,
      neighborhood: order.shipping_neighborhood || '',
      price: Number(order.shipping_cost || 0),
    } : undefined,
    delivery_method: order.delivery_method || undefined,
    payment_method: order.payment_method || undefined,
    payment_label: order.payment_label || undefined,
    change_amount: order.change_amount !== null && order.change_amount !== undefined ? Number(order.change_amount) : null,
    createdAt: order.created_at,
    status: order.status,
    internal_comments: order.internal_comments,
    external_comments: order.external_comments,
    total_discount: order.total_discount,
    coupon_code: order.coupon_code,
  })) as Order[];
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.error('Erro ao atualizar status do pedido:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      statusAttempted: status
    });
    throw error;
  }
};

export const updateOrderComment = async (orderId: string, internal_comments: string) => {
  const { error } = await supabase
    .from('orders')
    .update({ internal_comments })
    .eq('id', orderId);

  if (error) throw error;
};

export const updateOrderExternalComment = async (orderId: string, external_comments: string) => {
  const { error } = await supabase
    .from('orders')
    .update({ external_comments })
    .eq('id', orderId);

  if (error) throw error;
};

export const deleteOrder = async (orderId: string) => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) throw error;
};
