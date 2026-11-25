export type CouponDiscountType =
  | 'total_with_shipping'
  | 'total_without_shipping'
  | 'specific_product';

export interface Coupon {
  id: string;
  code: string;
  discount_percentage: number;
  discount_type: CouponDiscountType;
  product_id?: string | null;
  usage_limit: number;
  usage_count: number;
  active: boolean;
  store?: string;
}
