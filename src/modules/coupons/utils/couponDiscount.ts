import type { Coupon } from '@/modules/coupons/types';
import type { CartItem } from '@/modules/cart/types';
import { getEffectiveProductPrice } from '@/modules/products/utils/pricing';

export function calculateItemsSubtotal(
  items: CartItem[],
  referenceDate: Date = new Date()
): number {
  return items.reduce(
    (sum, item) => sum + getEffectiveProductPrice(item.product, referenceDate) * item.quantity,
    0
  );
}

export function calculateCouponDiscount(
  coupon: Coupon | null,
  items: CartItem[],
  shippingPrice = 0,
  referenceDate: Date = new Date()
): number {
  if (!coupon) return 0;

  const subtotal = calculateItemsSubtotal(items, referenceDate);

  if (coupon.discount_type === 'total_with_shipping') {
    return (subtotal + shippingPrice) * (coupon.discount_percentage / 100);
  }

  if (coupon.discount_type === 'total_without_shipping') {
    return subtotal * (coupon.discount_percentage / 100);
  }

  if (coupon.discount_type === 'specific_product' && coupon.product_id) {
    const item = items.find((i) => i.product.id === coupon.product_id);
    if (!item) return 0;
    const itemSubtotal =
      getEffectiveProductPrice(item.product, referenceDate) * item.quantity;
    return itemSubtotal * (coupon.discount_percentage / 100);
  }

  return 0;
}
