export const STORE_SLUG = 'docimdagringa' as const;

export const DEFAULT_STORE_CITY = 'Extrema';
export const DEFAULT_STORE_STATE = 'MG';
export const DEFAULT_WHATSAPP_NUMBER = '5535991154125';

export const PIX_CONFIG = {
  key: '65649727000140',
  merchantName: 'GRINGA STORE',
  merchantCity: 'SAO PAULO',
} as const;

export const STORAGE_KEYS = {
  cart: 'docim_cart',
  customer: 'docim_customer',
  orders: 'docim_orders',
  shipping: 'docim_shipping',
  adminTab: 'admin_active_tab',
  adminMobileSection: 'admin_active_mobile_section',
} as const;
