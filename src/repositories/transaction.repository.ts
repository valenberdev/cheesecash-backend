import { PoolClient } from "pg";

interface Transaction {
  id: number;
  wallet_id: number;
  type: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  to_amount: string;
  exchange_rate_used: string;
  status: string;
  created_at: Date;
}

export async function createTransaction(
  client: PoolClient,
  walletId: number,
  type: string,
  fromCurrency: string,
  toCurrency: string,
  fromAmount: number,
  toAmount: number,
  exchangeRateUsed: number,
): Promise<Transaction> {
  const result = await client.query(
    `INSERT INTO transactions (wallet_id, type, from_currency, to_currency, from_amount, to_amount, exchange_rate_used, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'success')
     RETURNING *`,
    [
      walletId,
      type,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
      exchangeRateUsed,
    ],
  );

  return result.rows[0];
}
