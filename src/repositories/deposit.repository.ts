import { PoolClient } from "pg";
import { pool } from "../config/db";

export interface Deposit {
  id: number;
  wallet_id: number;
  currency: string;
  amount: string;
  reference: string;
  status: string;
  created_at: Date;
}

export async function createDeposit(
  client: PoolClient,
  walletId: number,
  currency: string,
  amount: number,
  reference: string,
): Promise<Deposit> {
  const result = await client.query(
    `INSERT INTO deposits (wallet_id, currency, amount, reference)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [walletId, currency, amount, reference],
  );

  return result.rows[0];
}

export async function findDepositByReference(
  reference: string,
): Promise<Deposit | null> {
  const result = await pool.query(
    "SELECT * FROM deposits WHERE reference = $1",
    [reference],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function findDepositsByWalletId(
  walletId: number,
): Promise<Deposit[]> {
  const result = await pool.query(
    "SELECT * FROM deposits WHERE wallet_id = $1 ORDER BY created_at DESC",
    [walletId],
  );

  return result.rows;
}