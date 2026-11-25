import type { CartItem } from '@/modules/cart/types';
import type { ShippingRate } from '@/modules/shipping/types';
import type {
  CustomerInfo,
  DeliveryMethod,
  PaymentMethodCode,
} from '@/modules/checkout/types';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber?: number;
  items: CartItem[];
  total: number;
  shippingRate?: ShippingRate;
  delivery_method?: DeliveryMethod;
  payment_method?: PaymentMethodCode;
  payment_label?: string;
  change_amount?: number | null;
  customerInfo: CustomerInfo;
  createdAt: string;
  status: OrderStatus;
  internal_comments?: string;
  external_comments?: string;
  total_discount?: number;
  coupon_code?: string;
}
