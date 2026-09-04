import { z } from 'zod';

export const createTransferSchema = z.object({
  toEmail: z.string().email('Email inválido'),
  currency: z.enum(['ARS', 'USD', 'EUR', 'BTC']),
  amount: z.number().positive('El monto debe ser mayor a cero'),
});