export interface CustomerInfo {
  responsibleName: string;
  address: string;
  complement?: string;
  phone: string;
  email: string;
  orderNotes?: string;
}

export type DeliveryMethod = 'delivery' | 'pickup';

export type PaymentMethodCode =
  | 'pix'
  | 'card_delivery'
  | 'cash_exact_delivery'
  | 'cash_change_delivery'
  | 'card_store'
  | 'cash_exact_store'
  | 'cash_change_store';

export interface PaymentSubmission {
  whatsappPaymentText: string;
  paymentMethodCode: PaymentMethodCode;
  paymentLabel: string;
  changeAmount?: number | null;
}
