import { z } from 'zod';

export const createTransferSchema = z.object({
  toEmail: z.string().email('Email inválido').optional(),
  toPin: z.string().length(6, 'El PIN debe tener 6 dígitos').optional(),
  currency: z.enum(['ARS', 'USD', 'EUR', 'BTC']),
  amount: z.number().positive('El monto debe ser mayor a cero'),
}).refine((data) => data.toEmail || data.toPin, {
  message: 'Tenés que indicar un email o un PIN de destinatario',
});