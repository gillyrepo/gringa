import { z } from 'zod';
import type { DeliveryMethod } from '@/modules/checkout/types';

export const baseCheckoutSchema = z.object({
  responsibleName: z
    .string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  address: z.string().trim().max(200, 'Endereço muito longo').optional(),
  complement: z.string().trim().max(100, 'Complemento muito longo').optional(),
  phone: z
    .string()
    .trim()
    .min(9, 'Telefone inválido')
    .max(20, 'Telefone muito longo'),
  email: z
    .string()
    .trim()
    .email('E-mail inválido')
    .max(100, 'E-mail muito longo')
    .optional()
    .or(z.literal('')),
  orderNotes: z.string().trim().max(500, 'Observação muito longa').optional(),
});

export type CheckoutFormValues = z.infer<typeof baseCheckoutSchema>;

export function createCheckoutSchema(deliveryMethod: DeliveryMethod) {
  return baseCheckoutSchema.superRefine((data, ctx) => {
    if (deliveryMethod === 'delivery' && (!data.address || data.address.trim().length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Endereço deve ter pelo menos 5 caracteres',
        path: ['address'],
      });
    }
  });
}
