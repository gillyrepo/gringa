import { supabase } from '@/shared/lib/supabase';
import { DEFAULT_WHATSAPP_NUMBER, STORE_SLUG } from '@/shared/config/store';
import type { StoreSettings } from '@/modules/store-settings/types';

export const getStoreSettings = async (): Promise<StoreSettings> => {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store', STORE_SLUG)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      id: '',
      store: STORE_SLUG,
      observation: '',
      whatsapp_number: DEFAULT_WHATSAPP_NUMBER,
      is_open_manually: true,
      store_address: '',
    };
  }

  return data as StoreSettings;
};

export const upsertStoreSettings = async (settings: StoreSettings): Promise<void> => {
  const { error } = await supabase.from('store_settings').upsert({
    id: settings.id || undefined,
    observation: settings.observation,
    whatsapp_number: settings.whatsapp_number,
    is_open_manually: settings.is_open_manually,
    store_address: settings.store_address,
    updated_at: new Date().toISOString(),
    store: STORE_SLUG,
  });

  if (error) throw error;
};
