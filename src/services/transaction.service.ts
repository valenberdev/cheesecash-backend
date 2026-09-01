import { pool } from "../config/db";
import { getExchangeRate } from "./exchangeRate.service";
import { findWalletByUserId } from "../repositories/wallet.repository";
import { findBalancesByWalletId } from "../repositories/balance.repository";
import { adjustBalance } from "../repositories/balance.repository";
import {
  createTransaction,
  findTransactionsByWalletId,
} from "../repositories/transaction.repository";
import { findUserById } from "../repositories/user.repository";
import { sendTransactionReceiptEmail } from "./email.service";

export async function executeTransaction(
  userId: number,
  type: string,
  fromCurrency: string,
  toCurrency: string,
  fromAmount: number,
) {
  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new Error("Wallet no encontrada");
  }

  const balances = await findBalancesByWalletId(wallet.id);
  const fromBalance = balances.find((b) => b.currency === fromCurrency);

  if (!fromBalance || parseFloat(fromBalance.amount) < fromAmount) {
    throw new Error("Saldo insuficiente");
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency);
  const toAmount = fromAmount * rate;

  const client = await pool.connect();

  let transaction;

  try {
    await client.query("BEGIN");

    await adjustBalance(client, wallet.id, fromCurrency, -fromAmount);
    await adjustBalance(client, wallet.id, toCurrency, toAmount);

    transaction = await createTransaction(
      client,
      wallet.id,
      type,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
      rate,
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const user = await findUserById(userId);

  if (user) {
    await sendTransactionReceiptEmail(user.email, transaction);
  }

  return transaction;
}

export async function getTransactionHistory(userId: number) {
  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new Error("Wallet no encontrada");
  }

  const transactions = await findTransactionsByWalletId(wallet.id);

  return transactions;
}
