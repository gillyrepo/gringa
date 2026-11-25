export const queryKeys = {
  productsAll: ['products'] as const,
  productsPublic: ['products', 'public'] as const,
  productsAdmin: ['products', 'admin'] as const,
  shippingRates: ['shipping-rates'] as const,
  couponsAdmin: ['coupons', 'admin'] as const,
  storeSettings: ['store-settings'] as const,
  ordersAdmin: ['orders', 'admin'] as const,
  ordersCustomer: (ids: string[]) => ['orders', 'customer', ...ids] as const,
};
