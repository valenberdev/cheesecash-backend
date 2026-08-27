import { pool } from "../config/db";

interface Wallet {
  id: number;
  user_id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createWallet(userId: number): Promise<Wallet> {
  const result = await pool.query(
    `INSERT INTO wallets (user_id) VALUES ($1) RETURNING *`,
    [userId],
  );

  return result.rows[0];
}

export async function findWalletByUserId(
  userId: number,
): Promise<Wallet | null> {
  const result = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [
    userId,
  ]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}
