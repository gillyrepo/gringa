import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/queryKeys';
import type { Order } from '@/modules/orders/types';
import { getAdminOrders, getOrdersByIds } from '@/modules/orders/services/orderService';

export const useAdminOrders = () =>
  useQuery({
    queryKey: queryKeys.ordersAdmin,
    queryFn: getAdminOrders,
    staleTime: 15_000,
  });

export const useCustomerOrders = (
  localOrders: Order[],
  syncLocalOrders: (validOrders: Order[]) => void
) => {
  const orderIds = localOrders.map((o) => o.id);

  const query = useQuery({
    queryKey: queryKeys.ordersCustomer(orderIds),
    queryFn: () => getOrdersByIds(orderIds),
    enabled: orderIds.length > 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!query.isSuccess || localOrders.length === 0) return;

    const remoteOrders = query.data;
    if (remoteOrders.length > 0) {
      const updatedMap = new Map(remoteOrders.map((o) => [o.id, o]));
      const validOrders = localOrders
        .filter((local) => updatedMap.has(local.id))
        .map((local) => ({
          ...local,
          ...updatedMap.get(local.id)!,
        }));

      syncLocalOrders(validOrders);
    } else {
      syncLocalOrders([]);
    }
  }, [query.isSuccess, query.data, localOrders, syncLocalOrders]);

  return query.data ?? localOrders;
};
