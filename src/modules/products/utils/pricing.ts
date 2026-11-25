import type { Product } from '@/modules/products/types';

export type DiscountableProduct = Pick<
  Product,
  'price' | 'discount_percentage' | 'discount_expires_at'
>;

export function isProductDiscountActive(
  product: DiscountableProduct,
  referenceDate: Date = new Date()
): boolean {
  const percentage = product.discount_percentage ?? 0;
  if (percentage <= 0) return false;
  if (!product.discount_expires_at) return true;
  return new Date(product.discount_expires_at) > referenceDate;
}

export function getEffectiveProductPrice(
  product: DiscountableProduct,
  referenceDate: Date = new Date()
): number {
  if (!isProductDiscountActive(product, referenceDate)) {
    return product.price;
  }
  const percentage = product.discount_percentage ?? 0;
  return product.price * (1 - percentage / 100);
}

export function getProductDiscountAmount(
  product: DiscountableProduct,
  quantity = 1,
  referenceDate: Date = new Date()
): number {
  if (!isProductDiscountActive(product, referenceDate)) {
    return 0;
  }
  const unitPrice = getEffectiveProductPrice(product, referenceDate);
  return (product.price - unitPrice) * quantity;
}
