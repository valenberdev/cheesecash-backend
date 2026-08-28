import { pool } from '../config/db';
import { PoolClient } from 'pg';

const SUPPORTED_CURRENCIES = ["ARS", "USD", "EUR", "BTC"];

export async function createInitialBalances(walletId: number): Promise<void> {
  const values = SUPPORTED_CURRENCIES.map(
    (currency, index) => `($1, $${index + 2}, 0)`,
  ).join(", ");

  await pool.query(
    `INSERT INTO balances (wallet_id, currency, amount) VALUES ${values}`,
    [walletId, ...SUPPORTED_CURRENCIES],
  );
}

interface Balance {
  id: number;
  wallet_id: number;
  currency: string;
  amount: string;
  created_at: Date;
  updated_at: Date;
}

export async function findBalancesByWalletId(
  walletId: number,
): Promise<Balance[]> {
  const result = await pool.query(
    "SELECT * FROM balances WHERE wallet_id = $1",
    [walletId],
  );

  return result.rows;
}

export async function adjustBalance(
  client: PoolClient,
  walletId: number,
  currency: string,
  delta: number
): Promise<void> {
  await client.query(
    `UPDATE balances SET amount = amount + $1, updated_at = current_timestamp WHERE wallet_id = $2 AND currency = $3`,
    [delta, walletId, currency]
  );
}