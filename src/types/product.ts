export interface Coupon {
  id: string;
  code: string;
  discount_percentage: number;
  discount_type: 'total_with_shipping' | 'total_without_shipping' | 'specific_product';
  product_id?: string | null;
  usage_limit: number;
  usage_count: number;
  active: boolean;
  store?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string;
  image_url_2?: string;
  image_url_3?: string;
  description?: string;
  active: boolean;
  stock: number;
  sku?: string;
  store?: string;
  created_at?: string;
  discount_percentage?: number;
  discount_expires_at?: string;
}

export interface ShippingRate {
  id: string;
  store: string;
  state: string;
  city: string;
  neighborhood: string;
  price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

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
  status: 'pending' | 'processing' | 'sent' | 'delivered' | 'cancelled';
  internal_comments?: string;
  external_comments?: string;
  total_discount?: number;
  coupon_code?: string;
}

export interface CustomerInfo {
  responsibleName: string;
  address: string;
  complement?: string;
  phone: string;
  email: string;
  orderNotes?: string;
}

export type DeliveryMethod = 'delivery' | 'pickup';

export type PaymentMethodCode =
  | 'pix'
  | 'card_delivery'
  | 'cash_exact_delivery'
  | 'cash_change_delivery'
  | 'card_store'
  | 'cash_exact_store'
  | 'cash_change_store';

export type ProductCategory =
  | 'gels-pomadas'
  | 'maquinas'
  | 'laminas'
  | 'tesouras'
  | 'capas'
  | 'higiene'
  | 'acessorios';

export const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'gels-pomadas', label: 'Géis e Pomadas' },
  { id: 'maquinas', label: 'Máquinas de Corte' },
  { id: 'laminas', label: 'Lâminas' },
  { id: 'tesouras', label: 'Tesouras' },
  { id: 'capas', label: 'Capas' },
  { id: 'higiene', label: 'Produtos de Higiene' },
  { id: 'acessorios', label: 'Acessórios' },
];
