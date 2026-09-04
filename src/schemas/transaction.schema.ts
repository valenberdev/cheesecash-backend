import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['buy', 'sell', 'exchange']),
  fromCurrency: z.enum(['ARS', 'USD', 'EUR', 'BTC']),
  toCurrency: z.enum(['ARS', 'USD', 'EUR', 'BTC']),
  fromAmount: z.number().positive('El monto debe ser mayor a cero'),
});