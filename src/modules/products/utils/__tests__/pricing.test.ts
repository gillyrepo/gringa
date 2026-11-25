import { describe, it, expect } from 'vitest';
import {
  isProductDiscountActive,
  getEffectiveProductPrice,
  getProductDiscountAmount,
} from '@/modules/products/utils/pricing';

describe('product pricing utilities', () => {
  const now = new Date('2026-11-25T18:00:00Z');

  it('returns base price when product has no discount', () => {
    const product = { price: 25, discount_percentage: 0 };
    expect(isProductDiscountActive(product, now)).toBe(false);
    expect(getEffectiveProductPrice(product, now)).toBe(25);
    expect(getProductDiscountAmount(product, 2, now)).toBe(0);
  });

  it('applies discount when discount has no expiration date', () => {
    const product = { price: 20, discount_percentage: 15 };
    expect(isProductDiscountActive(product, now)).toBe(true);
    expect(getEffectiveProductPrice(product, now)).toBeCloseTo(17, 2);
    expect(getProductDiscountAmount(product, 3, now)).toBeCloseTo(9, 2);
  });

  it('applies discount when expiration date is in the future', () => {
    const product = {
      price: 50,
      discount_percentage: 20,
      discount_expires_at: '2026-12-01T00:00:00Z',
    };
    expect(isProductDiscountActive(product, now)).toBe(true);
    expect(getEffectiveProductPrice(product, now)).toBeCloseTo(40, 2);
  });

  it('ignores expired discount', () => {
    const product = {
      price: 50,
      discount_percentage: 20,
      discount_expires_at: '2026-11-20T00:00:00Z',
    };
    expect(isProductDiscountActive(product, now)).toBe(false);
    expect(getEffectiveProductPrice(product, now)).toBe(50);
    expect(getProductDiscountAmount(product, 2, now)).toBe(0);
  });
});
