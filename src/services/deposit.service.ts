import { randomUUID } from "crypto";
import { pool } from "../config/db";
import { io } from "../config/socket";
import { findWalletByUserId } from "../repositories/wallet.repository";
import { adjustBalance } from "../repositories/balance.repository";
import {
  createDeposit,
  findDepositByReference,
  findDepositsByWalletId,
} from "../repositories/deposit.repository";

/**
 * Tope por operación, por moneda. Sin esto un usuario podría acreditarse
 * cualquier cifra y las estadísticas de la demo pierden sentido.
 */
const MAX_DEPOSIT: Record<string, number> = {
  ARS: 5_000_000,
  USD: 5_000,
  EUR: 5_000,
  BTC: 0.1,
};

export async function executeDeposit(
  userId: number,
  currency: string,
  amount: number,
  reference?: string,
) {
  if (amount <= 0) {
    throw new Error("El monto debe ser mayor a cero");
  }

  const max = MAX_DEPOSIT[currency];

  if (max !== undefined && amount > max) {
    throw new Error(`El máximo por operación es ${max} ${currency}`);
  }

  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new Error("Wallet no encontrada");
  }

  // Idempotencia: si ya acreditamos un depósito con esta referencia,
  // devolvemos el original en vez de sumar de nuevo. Con una pasarela real
  // el webhook puede repetirse, y acreditar dos veces sería crear dinero.
  const ref = reference ?? randomUUID();
  const existing = await findDepositByReference(ref);

  if (existing) {
    return existing;
  }

  const client = await pool.connect();
  let deposit;

  try {
    await client.query("BEGIN");

    deposit = await createDeposit(client, wallet.id, currency, amount, ref);
    await adjustBalance(client, wallet.id, currency, amount);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  io.to(`user:${userId}`).emit("deposit:completed", deposit);

  return deposit;
}

export async function getMyDeposits(userId: number) {
  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new Error("Wallet no encontrada");
  }

  return findDepositsByWalletId(wallet.id);
}