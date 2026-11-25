import { supabase } from '@/shared/lib/supabase';
import { STORE_SLUG } from '@/shared/config/store';
import type { Product } from '@/modules/products/types';

export const getPublicProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store', STORE_SLUG)
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return (data || []) as Product[];
};

export const getAdminProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store', STORE_SLUG)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Product[];
};

export const createProduct = async (
  product: Omit<Product, 'id' | 'created_at'>
): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .insert({ ...product, store: STORE_SLUG })
    .select()
    .single();

  if (error) throw error;
  return data as Product;
};

export const updateProduct = async (
  id: string,
  product: Partial<Product>
): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .eq('store', STORE_SLUG)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('store', STORE_SLUG);

  if (error) throw error;
};

export const updateCategoryName = async (
  oldName: string,
  newName: string
): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ category: newName })
    .eq('store', STORE_SLUG)
    .eq('category', oldName);

  if (error) throw error;
};
