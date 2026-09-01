import { PoolClient } from "pg";
import { pool } from "../config/db";

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
  confirmation_token: string | null;
  expires_at: Date | null;
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

export async function findTransactionsByWalletId(
  walletId: number,
): Promise<Transaction[]> {
  const result = await pool.query(
    "SELECT * FROM transactions WHERE wallet_id = $1 ORDER BY created_at DESC",
    [walletId],
  );

  return result.rows;
}


export async function createPendingTransaction(
  walletId: number,
  type: string,
  fromCurrency: string,
  toCurrency: string,
  fromAmount: number,
  toAmount: number,
  exchangeRateUsed: number,
  confirmationToken: string,
  expiresAt: Date
): Promise<Transaction> {
  const result = await pool.query(
    `INSERT INTO transactions (wallet_id, type, from_currency, to_currency, from_amount, to_amount, exchange_rate_used, status, confirmation_token, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9)
     RETURNING *`,
    [walletId, type, fromCurrency, toCurrency, fromAmount, toAmount, exchangeRateUsed, confirmationToken, expiresAt]
  );

  return result.rows[0];
}

export async function findTransactionByConfirmationToken(token: string): Promise<Transaction | null> {
  const result = await pool.query(
    'SELECT * FROM transactions WHERE confirmation_token = $1',
    [ token ]
  );

  if ( result.rows.length === 0 ) {
    return null;
  }

  return result.rows[0];
}

export async function confirmPendingTransaction(client: PoolClient, transactionId: number): Promise<void> {
  await client.query(
    `UPDATE transactions SET status = 'success', confirmation_token = NULL, expires_at = NULL WHERE id = $1`,
    [transactionId]
  );
}

export async function failPendingTransaction(transactionId: number): Promise<void> {
  await pool.query(
    `UPDATE transactions SET status = 'failed', confirmation_token = NULL, expires_at = NULL WHERE id = $1`,
    [transactionId]
  );
}