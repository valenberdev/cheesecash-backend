import { pool } from "../config/db";
import { getExchangeRate } from "./exchangeRate.service";
import {
  findWalletByUserId,
  findWalletById,
} from "../repositories/wallet.repository";
import {
  findBalancesByWalletId,
  findBalancesByWalletIdForUpdate,
} from "../repositories/balance.repository";
import { adjustBalance } from "../repositories/balance.repository";
import {
  createTransaction,
  findTransactionsByWalletId,
  createPendingTransaction,
  findTransactionByConfirmationToken,
  confirmPendingTransaction,
  failPendingTransaction,
} from "../repositories/transaction.repository";
import { findUserById } from "../repositories/user.repository";
import { sendTransactionReceiptEmail, sendEmail } from "./email.service";
import crypto from "crypto";

const HIGH_VALUE_THRESHOLDS: Record<string, number> = {
  ARS: 500000,
  USD: 500,
  EUR: 500,
};

async function exceedsThreshold(
  currency: string,
  amount: number,
): Promise<boolean> {
  if (currency === "BTC") {
    const btcToUsdRate = await getExchangeRate("BTC", "USD");
    const amountInUsd = amount * btcToUsdRate;
    return amountInUsd >= 1000;
  }

  return amount >= HIGH_VALUE_THRESHOLDS[currency];
}

export async function isHighValueTransaction(
  fromCurrency: string,
  fromAmount: number,
  toCurrency: string,
  toAmount: number,
): Promise<boolean> {
  const fromExceeds = await exceedsThreshold(fromCurrency, fromAmount);
  const toExceeds = await exceedsThreshold(toCurrency, toAmount);

  return fromExceeds || toExceeds;
}

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

  const rate = await getExchangeRate(fromCurrency, toCurrency);
  const toAmount = fromAmount * rate;

  const MIN_RESULT_AMOUNT: Record<string, number> = {
    ARS: 0.01,
    USD: 0.01,
    EUR: 0.01,
    BTC: 0.00000001,
  };

  if (toAmount < MIN_RESULT_AMOUNT[toCurrency]) {
    throw new Error("El monto es demasiado bajo para esta operación");
  }

  const balances = await findBalancesByWalletId(wallet.id);
  const fromBalance = balances.find((b) => b.currency === fromCurrency);

  if (
    !fromBalance ||
    fromAmount <= 0 ||
    parseFloat(fromBalance.amount) < fromAmount
  ) {
    throw new Error("Saldo insuficiente");
  }

  const isHighValue = await isHighValueTransaction(
    fromCurrency,
    fromAmount,
    toCurrency,
    toAmount,
  );

  if (isHighValue) {
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const pendingTransaction = await createPendingTransaction(
      wallet.id,
      type,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
      rate,
      confirmationToken,
      expiresAt,
    );

    const userForEmail = await findUserById(userId);

    if (userForEmail) {
      const confirmLink = `${process.env.FRONTEND_URL}/confirm-transaction?token=${confirmationToken}`;

      await sendEmail(
        userForEmail.email,
        "Confirmá tu operación - CheeseCash",
        `<p>Tu operación de ${fromAmount} ${fromCurrency} a ${toCurrency} supera el monto habitual y necesita confirmación.</p>
         <p>El link vence en 2 horas.</p>
         <p><a href="${confirmLink}">Confirmar operación</a></p>`,
      );
    }

    return pendingTransaction;
  }

  const client = await pool.connect();

  let transaction;

  try {
    await client.query("BEGIN");

    const balances = await findBalancesByWalletIdForUpdate(client, wallet.id);
    const fromBalance = balances.find((b) => b.currency === fromCurrency);

    if (
      !fromBalance ||
      fromAmount <= 0 ||
      parseFloat(fromBalance.amount) < fromAmount
    ) {
      throw new Error("Saldo insuficiente");
    }

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

export async function confirmTransaction(token: string) {
  const transaction = await findTransactionByConfirmationToken(token);

  if (!transaction) {
    throw new Error("Token de confirmación inválido");
  }

  if (transaction.status !== "pending") {
    throw new Error("Esta transacción ya fue procesada");
  }

  if (
    !transaction.expires_at ||
    new Date(transaction.expires_at) < new Date()
  ) {
    await failPendingTransaction(transaction.id);
    throw new Error("El link de confirmación expiró");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const balances = await findBalancesByWalletIdForUpdate(
      client,
      transaction.wallet_id,
    );
    const fromBalance = balances.find(
      (b) => b.currency === transaction.from_currency,
    );
    const fromAmountNum = parseFloat(transaction.from_amount);

    if (!fromBalance || parseFloat(fromBalance.amount) < fromAmountNum) {
      throw new Error("Saldo insuficiente para confirmar la operación");
    }

    await adjustBalance(
      client,
      transaction.wallet_id,
      transaction.from_currency,
      -fromAmountNum,
    );
    await adjustBalance(
      client,
      transaction.wallet_id,
      transaction.to_currency,
      parseFloat(transaction.to_amount),
    );

    await confirmPendingTransaction(client, transaction.id);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    if (
      (error as Error).message ===
      "Saldo insuficiente para confirmar la operación"
    ) {
      await failPendingTransaction(transaction.id);
    }

    throw error;
  } finally {
    client.release();
  }

  const wallet = await findWalletById(transaction.wallet_id);

  if (wallet) {
    const user = await findUserById(wallet.user_id);

    if (user) {
      await sendTransactionReceiptEmail(user.email, transaction);
    }
  }

  return {
    ...transaction,
    status: "success",
    confirmation_token: null,
    expires_at: null,
  };
}
