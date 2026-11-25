import { supabase } from '@/shared/lib/supabase';
import { STORE_SLUG } from '@/shared/config/store';
import type { ShippingRate } from '@/modules/shipping/types';

export const getShippingRates = async (): Promise<ShippingRate[]> => {
  const { data, error } = await supabase
    .from('shipping_rates')
    .select('*')
    .eq('store', STORE_SLUG)
    .order('city')
    .order('neighborhood');

  if (error) throw error;
  return (data || []) as ShippingRate[];
};

export const createShippingRate = async (
  rate: Omit<ShippingRate, 'id'>
): Promise<ShippingRate> => {
  const { data, error } = await supabase
    .from('shipping_rates')
    .insert({ ...rate, store: STORE_SLUG })
    .select()
    .single();

  if (error) throw error;
  return data as ShippingRate;
};

export const updateShippingRate = async (
  id: string,
  updates: Partial<ShippingRate>
): Promise<ShippingRate> => {
  const { data, error } = await supabase
    .from('shipping_rates')
    .update({ ...updates, store: STORE_SLUG })
    .eq('id', id)
    .eq('store', STORE_SLUG)
    .select()
    .single();

  if (error) throw error;
  return data as ShippingRate;
};

export const deleteShippingRate = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('shipping_rates')
    .delete()
    .eq('id', id)
    .eq('store', STORE_SLUG);

  if (error) throw error;
};
