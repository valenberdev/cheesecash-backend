import { pool } from '../config/db';
import { PoolClient } from 'pg';

interface Transfer {
  id: number;
  from_wallet_id: number;
  to_wallet_id: number;
  currency: string;
  amount: string;
  status: string;
  confirmation_token: string | null;
  expires_at: Date | null;
  created_at: Date;
}

export async function createPendingTransfer(
  fromWalletId: number,
  toWalletId: number,
  currency: string,
  amount: number,
  confirmationToken: string,
  expiresAt: Date
): Promise<Transfer> {
  const result = await pool.query(
    `INSERT INTO transfers (from_wallet_id, to_wallet_id, currency, amount, status, confirmation_token, expires_at)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6)
     RETURNING *`,
    [fromWalletId, toWalletId, currency, amount, confirmationToken, expiresAt]
  );

  return result.rows[0];
}

export async function createTransfer(
  client: PoolClient,
  fromWalletId: number,
  toWalletId: number,
  currency: string,
  amount: number
): Promise<Transfer> {
  const result = await client.query(
    `INSERT INTO transfers (from_wallet_id, to_wallet_id, currency, amount, status)
     VALUES ($1, $2, $3, $4, 'success')
     RETURNING *`,
    [fromWalletId, toWalletId, currency, amount]
  );

  return result.rows[0];
}

export async function findTransferByConfirmationToken(token: string): Promise<Transfer | null> {
  const result = await pool.query(
    'SELECT * FROM transfers WHERE confirmation_token = $1',
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function confirmPendingTransfer(client: PoolClient, transferId: number): Promise<void> {
  await client.query(
    `UPDATE transfers SET status = 'success', confirmation_token = NULL, expires_at = NULL WHERE id = $1`,
    [transferId]
  );
}

export async function failPendingTransfer(transferId: number): Promise<void> {
  await pool.query(
    `UPDATE transfers SET status = 'failed', confirmation_token = NULL, expires_at = NULL WHERE id = $1`,
    [transferId]
  );
}

export async function findTransfersByWalletId(walletId: number): Promise<Transfer[]> {
  const result = await pool.query(
    'SELECT * FROM transfers WHERE from_wallet_id = $1 OR to_wallet_id = $1 ORDER BY created_at DESC',
    [walletId]
  );

  return result.rows;
}