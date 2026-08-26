import { pool } from "../config/db";

const SUPPORTED_CURRENCIES = ["ARS", "USD", "EUR", "BTC"];

export async function createInitialBalances(userId: number): Promise<void> {
  const values = SUPPORTED_CURRENCIES.map(
    (currency, index) => `($1, $${index + 2}, 0)`,
  ).join(", ");

  await pool.query(
    `INSERT INTO balances (user_id, currency, amount) VALUES ${values}`,
    [userId, ...SUPPORTED_CURRENCIES],
  );
}
