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
