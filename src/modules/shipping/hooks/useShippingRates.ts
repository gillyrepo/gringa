import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/queryKeys';
import { getShippingRates } from '@/modules/shipping/services/shippingService';

export const useShippingRates = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.shippingRates,
    queryFn: getShippingRates,
    enabled,
    staleTime: 5 * 60_000,
  });
