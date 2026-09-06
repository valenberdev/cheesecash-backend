import { z } from 'zod';

export const createDepositSchema = z.object({
  currency: z.enum(['ARS', 'USD', 'EUR', 'BTC']),
  amount: z.number().positive('El monto debe ser mayor a cero'),
  // Opcional: si el cliente reintenta el mismo pedido con la misma
  // referencia, el depósito no se acredita dos veces.
  reference: z.string().min(8).max(80).optional(),
});