import { pool } from '../config/db';
import { PoolClient } from 'pg';

const SUPPORTED_CURRENCIES = ["ARS", "USD", "EUR", "BTC"];

const DEMO_INITIAL_BALANCES: Record<string, number> = {
  ARS: 10000000,
  USD: 100,
  EUR: 100,
  BTC: 0.01,
};

export async function createInitialBalances(client: PoolClient, walletId: number): Promise<void> {
  const currencies = Object.keys(DEMO_INITIAL_BALANCES);
  const values = currencies
    .map((currency, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
    .join(', ');

  const params: (number | string)[] = [walletId];
  currencies.forEach((c) => {
    params.push(c, DEMO_INITIAL_BALANCES[c]);
  });

  await client.query(
    `INSERT INTO balances (wallet_id, currency, amount) VALUES ${values}`,
    params
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

export async function findBalancesByWalletIdForUpdate(client: PoolClient, walletId: number): Promise<Balance[]> {
  const result = await client.query(
    'SELECT * FROM balances WHERE wallet_id = $1 FOR UPDATE',
    [walletId]
  );

  return result.rows;
}