import { describe, it, expect } from 'vitest';
import {
  calculateItemsSubtotal,
  calculateCouponDiscount,
} from '@/modules/coupons/utils/couponDiscount';
import type { CartItem } from '@/modules/cart/types';
import type { Coupon } from '@/modules/coupons/types';

const now = new Date('2026-11-25T18:00:00Z');

const sampleItems: CartItem[] = [
  {
    quantity: 2,
    product: {
      id: 'prod-1',
      name: 'Milka Oreo',
      category: 'Chocolates',
      price: 20,
      image_url: 'https://example.com/1.jpg',
      active: true,
      stock: 10,
      discount_percentage: 10,
    },
  },
  {
    quantity: 1,
    product: {
      id: 'prod-2',
      name: 'Reeses',
      category: 'Chocolates',
      price: 14,
      image_url: 'https://example.com/2.jpg',
      active: true,
      stock: 5,
    },
  },
];

describe('coupon discount utilities', () => {
  it('computes subtotal respecting item-level discounts', () => {
    // 2 * 18 + 1 * 14 = 50
    expect(calculateItemsSubtotal(sampleItems, now)).toBeCloseTo(50, 2);
  });

  it('computes total_with_shipping coupon discount', () => {
    const coupon: Coupon = {
      id: 'c1',
      code: 'FRETE10',
      discount_percentage: 10,
      discount_type: 'total_with_shipping',
      usage_limit: 10,
      usage_count: 0,
      active: true,
    };
    // (50 + 10) * 10% = 6
    expect(calculateCouponDiscount(coupon, sampleItems, 10, now)).toBeCloseTo(6, 2);
  });

  it('computes total_without_shipping coupon discount', () => {
    const coupon: Coupon = {
      id: 'c2',
      code: 'SUB20',
      discount_percentage: 20,
      discount_type: 'total_without_shipping',
      usage_limit: 10,
      usage_count: 0,
      active: true,
    };
    // 50 * 20% = 10
    expect(calculateCouponDiscount(coupon, sampleItems, 10, now)).toBeCloseTo(10, 2);
  });

  it('computes specific_product coupon discount only on matching item', () => {
    const coupon: Coupon = {
      id: 'c3',
      code: 'REESES50',
      discount_percentage: 50,
      discount_type: 'specific_product',
      product_id: 'prod-2',
      usage_limit: 10,
      usage_count: 0,
      active: true,
    };
    // 14 * 50% = 7
    expect(calculateCouponDiscount(coupon, sampleItems, 10, now)).toBeCloseTo(7, 2);
  });
});
