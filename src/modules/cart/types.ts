import type { Product } from '@/modules/products/types';

export interface CartItem {
  product: Product;
  quantity: number;
}
