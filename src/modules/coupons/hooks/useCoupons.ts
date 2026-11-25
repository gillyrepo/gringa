import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/queryKeys';
import { getAdminCoupons } from '@/modules/coupons/services/couponService';

export const useAdminCoupons = () =>
  useQuery({
    queryKey: queryKeys.couponsAdmin,
    queryFn: getAdminCoupons,
    staleTime: 30_000,
  });
