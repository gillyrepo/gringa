import { supabase } from '@/shared/lib/supabase';
import { STORE_SLUG } from '@/shared/config/store';
import type { Coupon } from '@/modules/coupons/types';

export const validateCouponByCode = async (code: string): Promise<Coupon | null> => {
  const normalizedCode = code.trim().toUpperCase();
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('store', STORE_SLUG)
    .eq('code', normalizedCode)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as Coupon;
};

export const getAdminCoupons = async (): Promise<Coupon[]> => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('store', STORE_SLUG)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Coupon[];
};

export const saveAdminCoupon = async (coupon: Partial<Coupon>): Promise<void> => {
  const payload = {
    code: coupon.code!.toUpperCase(),
    discount_percentage: coupon.discount_percentage!,
    discount_type: coupon.discount_type!,
    product_id: coupon.discount_type === 'specific_product' ? coupon.product_id : null,
    usage_limit: coupon.usage_limit!,
    active: coupon.active ?? true,
    store: STORE_SLUG,
  };

  if (coupon.id) {
    const { error } = await supabase
      .from('coupons')
      .update(payload)
      .eq('id', coupon.id)
      .eq('store', STORE_SLUG);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('coupons').insert(payload);
    if (error) {
      if (error.code === '23505') throw new Error('Código já existe');
      throw error;
    }
  }
};

export const toggleAdminCouponStatus = async (coupon: Coupon): Promise<void> => {
  const { error } = await supabase
    .from('coupons')
    .update({ active: !coupon.active })
    .eq('id', coupon.id)
    .eq('store', STORE_SLUG);

  if (error) throw error;
};
