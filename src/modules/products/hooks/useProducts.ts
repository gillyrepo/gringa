import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/queryKeys';
import { getPublicProducts, getAdminProducts } from '@/modules/products/services/productService';

export const useProducts = () =>
  useQuery({
    queryKey: queryKeys.productsPublic,
    queryFn: getPublicProducts,
    staleTime: 60_000,
  });

export const useAdminProducts = () =>
  useQuery({
    queryKey: queryKeys.productsAdmin,
    queryFn: getAdminProducts,
    staleTime: 30_000,
  });
