import { supabase } from '@/shared/lib/supabase';
import { DEFAULT_STORE_STATE, STORE_SLUG } from '@/shared/config/store';
import type { Product } from '@/modules/products/types';
import type { CartItem } from '@/modules/cart/types';
import type { ShippingRate } from '@/modules/shipping/types';
import type {
  CustomerInfo,
  DeliveryMethod,
  PaymentMethodCode,
} from '@/modules/checkout/types';
import type { Order, OrderStatus } from '@/modules/orders/types';

export interface CreateOrderParams {
  items: CartItem[];
  customerInfo: CustomerInfo;
  whatsappMessage?: string;
  shippingRate?: ShippingRate;
  deliveryMethod: DeliveryMethod;
  paymentMethod?: PaymentMethodCode;
  paymentLabel?: string;
  changeAmount?: number | null;
  couponCode?: string;
}

export interface CreatedOrderResult {
  id: string;
  order_number: number;
  created_at: string;
  total_amount: number;
  total_discount: number;
  shipping_cost: number;
  status: OrderStatus;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RawOrderItemRow {
  quantity?: number | null;
  products?: Product | null;
}

interface RawOrderRow {
  id: string;
  order_number?: number;
  order_items?: RawOrderItemRow[] | null;
  total_amount?: number | string | null;
  customer_name?: string | null;
  customer_address?: string | null;
  complement?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  order_notes?: string | null;
  shipping_city?: string | null;
  shipping_neighborhood?: string | null;
  shipping_cost?: number | string | null;
  delivery_method?: DeliveryMethod | null;
  payment_method?: PaymentMethodCode | null;
  payment_label?: string | null;
  change_amount?: number | string | null;
  created_at: string;
  status?: OrderStatus | null;
  internal_comments?: string;
  external_comments?: string;
  total_discount?: number | string | null;
  coupon_code?: string | null;
}

function mapRawOrderToDomain(order: RawOrderRow): Order {
  const rawItems = Array.isArray(order.order_items) ? order.order_items : [];

  return {
    id: order.id,
    orderNumber: order.order_number,
    items: rawItems
      .filter((item): item is RawOrderItemRow & { products: Product } => Boolean(item?.products))
      .map((item) => ({
        product: item.products,
        quantity: Number(item.quantity || 1),
      })),
    total: Number(order.total_amount || 0),
    customerInfo: {
      responsibleName: order.customer_name || '',
      address: order.customer_address || '',
      complement: order.complement || '',
      phone: order.customer_phone || '',
      email: order.customer_email || '',
      orderNotes: order.order_notes || '',
    },
    shippingRate: order.shipping_city
      ? {
          id: 'stored-rate',
          store: STORE_SLUG,
          state: DEFAULT_STORE_STATE,
          city: order.shipping_city,
          neighborhood: order.shipping_neighborhood || '',
          price: Number(order.shipping_cost || 0),
        }
      : undefined,
    delivery_method: order.delivery_method || undefined,
    payment_method: order.payment_method || undefined,
    payment_label: order.payment_label || undefined,
    change_amount:
      order.change_amount !== null && order.change_amount !== undefined
        ? Number(order.change_amount)
        : null,
    createdAt: order.created_at,
    status: (order.status || 'pending') as OrderStatus,
    internal_comments: order.internal_comments,
    external_comments: order.external_comments,
    total_discount:
      order.total_discount !== null && order.total_discount !== undefined
        ? Number(order.total_discount)
        : undefined,
    coupon_code: order.coupon_code || undefined,
  };
}

export const createOrder = async ({
  items,
  customerInfo,
  whatsappMessage,
  shippingRate,
  deliveryMethod,
  paymentMethod,
  paymentLabel,
  changeAmount,
  couponCode,
}: CreateOrderParams): Promise<CreatedOrderResult> => {
  const rpcItems = items.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
  }));

  const shippingRateUuid =
    deliveryMethod === 'delivery' && shippingRate?.id && UUID_REGEX.test(shippingRate.id)
      ? shippingRate.id
      : null;

  const { data, error } = await supabase.rpc('create_public_order', {
    p_customer_name: customerInfo.responsibleName,
    p_customer_phone: customerInfo.phone,
    p_customer_address: customerInfo.address || '',
    p_complement: customerInfo.complement || null,
    p_customer_email: customerInfo.email || null,
    p_order_notes: customerInfo.orderNotes || null,
    p_whatsapp_message: whatsappMessage || '',
    p_delivery_method: deliveryMethod,
    p_shipping_rate_id: shippingRateUuid,
    p_payment_method: paymentMethod || null,
    p_payment_label: paymentLabel || null,
    p_change_amount: typeof changeAmount === 'number' ? changeAmount : null,
    p_coupon_code: couponCode || null,
    p_items: rpcItems,
  });

  if (error) throw error;
  if (!data) throw new Error('Falha ao criar pedido: Retorno vazio do banco');

  return data as CreatedOrderResult;
};

export const getAdminOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        *,
        products (
          *
        )
      )
    `
    )
    .eq('store', STORE_SLUG)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as unknown as RawOrderRow[]).map(mapRawOrderToDomain);
};

export const getOrdersByIds = async (ids: string[]): Promise<Order[]> => {
  const validUuids = ids.filter((id) => UUID_REGEX.test(id));
  if (validUuids.length === 0) return [];

  const { data, error } = await supabase.rpc('get_customer_orders_by_ids', {
    p_order_ids: validUuids,
  });

  if (error) {
    console.error('Erro ao buscar pedidos por IDs:', error);
    throw error;
  }

  const rows = Array.isArray(data) ? (data as unknown as RawOrderRow[]) : [];
  return rows.map(mapRawOrderToDomain);
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('store', STORE_SLUG);

  if (error) throw error;
};

export const updateOrderComment = async (
  orderId: string,
  internal_comments: string
): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ internal_comments })
    .eq('id', orderId)
    .eq('store', STORE_SLUG);

  if (error) throw error;
};

export const updateOrderExternalComment = async (
  orderId: string,
  external_comments: string
): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ external_comments })
    .eq('id', orderId)
    .eq('store', STORE_SLUG);

  if (error) throw error;
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .eq('store', STORE_SLUG);

  if (error) throw error;
};
