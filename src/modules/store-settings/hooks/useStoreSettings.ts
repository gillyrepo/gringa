import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/queryKeys';
import { getStoreSettings } from '@/modules/store-settings/services/storeSettingsService';

export const useStoreSettings = () =>
  useQuery({
    queryKey: queryKeys.storeSettings,
    queryFn: getStoreSettings,
    staleTime: 5 * 60_000,
  });
