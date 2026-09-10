import { pool } from "../config/db";
import { logger } from "../utils/logger";
import { findUserByEmail, findUserById } from "../repositories/user.repository";
import {
  findWalletByUserId,
  findWalletById,
} from "../repositories/wallet.repository";
import {
  findBalancesByWalletId,
  findBalancesByWalletIdForUpdate,
  adjustBalance,
} from "../repositories/balance.repository";
import {
  createPendingTransfer,
  createTransfer,
  findTransferByConfirmationToken,
  confirmPendingTransfer,
  failPendingTransfer,
  findTransfersByWalletId,
} from "../repositories/transfer.repository";
import { isHighValueTransaction } from "./transaction.service";
import crypto from "crypto";
import { sendEmail } from "./email.service";
import { findTransactionsByWalletId } from "../repositories/transaction.repository";
import { findUserByPin } from "../repositories/user.repository";
import { io } from "../config/socket";
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from "../utils/errors";

export async function executeTransfer(
  fromUserId: number,
  toEmail: string,
  toPin: string,
  currency: string,
  amount: number,
) {
  if (amount <= 0) {
    throw new ValidationError("El monto debe ser mayor a cero");
  }

  const fromWallet = await findWalletByUserId(fromUserId);

  if (!fromWallet) {
    throw new NotFoundError("Wallet no encontrada");
  }

  let toUser;

  if (toEmail) {
    toUser = await findUserByEmail(toEmail);
  } else if (toPin) {
    toUser = await findUserByPin(toPin);
  } else {
    throw new ValidationError(
      "Tenés que indicar un email o un PIN de destinatario",
    );
  }

  if (!toUser) {
    throw new NotFoundError("El destinatario no existe");
  }

  const toWallet = await findWalletByUserId(toUser.id);

  if (!toWallet) {
    throw new NotFoundError("El destinatario no tiene wallet");
  }

  if (fromWallet.id === toWallet.id) {
    throw new ValidationError("No podés transferirte a vos mismo");
  }

  const balances = await findBalancesByWalletId(fromWallet.id);
  const fromBalance = balances.find((b) => b.currency === currency);

  if (!fromBalance || parseFloat(fromBalance.amount) < amount) {
    throw new ValidationError("Saldo insuficiente");
  }

  const isHighValue = await isHighValueTransaction(
    fromUserId,
    currency,
    amount,
    currency,
    amount,
  );
  const fromUser = await findUserById(fromUserId);

  if (isHighValue) {
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const pendingTransfer = await createPendingTransfer(
      fromWallet.id,
      toWallet.id,
      currency,
      amount,
      confirmationToken,
      expiresAt,
    );

    const confirmLink = `${process.env.FRONTEND_URL}/confirm-transfer?token=${confirmationToken}`;

    if (fromUser) {
      try {
        await sendEmail(
          fromUser.email,
          "Confirmá tu transferencia - CheeseCash",
          `<p>Transferencia de ${amount} ${currency} pendiente de confirmación.</p>
   <p><a href="${confirmLink}">Confirmar</a></p>`,
        );
      } catch (emailError) {
        logger.error(
          "No se pudo enviar el mail de confirmacion de monto alto (transferencia):",
          emailError,
        );
      }
    }

    return pendingTransfer;
  }

  const client = await pool.connect();

  let transfer;

  try {
    await client.query("BEGIN");

    const lockedBalances = await findBalancesByWalletIdForUpdate(
      client,
      fromWallet.id,
    );
    const lockedFromBalance = lockedBalances.find(
      (b) => b.currency === currency,
    );

    if (!lockedFromBalance || parseFloat(lockedFromBalance.amount) < amount) {
      throw new Error("Saldo insuficiente");
    }

    await adjustBalance(client, fromWallet.id, currency, -amount);
    await adjustBalance(client, toWallet.id, currency, amount);

    transfer = await createTransfer(
      client,
      fromWallet.id,
      toWallet.id,
      currency,
      amount,
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  io.to(`user:${fromUserId}`).emit("transfer:completed", transfer);
  io.to(`user:${toUser.id}`).emit("transfer:completed", transfer);

  return transfer;
}

export async function confirmTransfer(token: string) {
  const transfer = await findTransferByConfirmationToken(token);

  if (!transfer) {
    throw new UnauthorizedError("Token de confirmación inválido");
  }

  if (transfer.status !== "pending") {
    throw new ValidationError("Esta transferencia ya fue procesada");
  }

  if (!transfer.expires_at || new Date(transfer.expires_at) < new Date()) {
    await failPendingTransfer(transfer.id);
    throw new UnauthorizedError("El link de confirmación expiró");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const balances = await findBalancesByWalletIdForUpdate(
      client,
      transfer.from_wallet_id,
    );
    const fromBalance = balances.find((b) => b.currency === transfer.currency);
    const amountNum = parseFloat(transfer.amount);

    if (!fromBalance || parseFloat(fromBalance.amount) < amountNum) {
      throw new UnauthorizedError(
        "Saldo insuficiente para confirmar la transferencia",
      );
    }

    await adjustBalance(
      client,
      transfer.from_wallet_id,
      transfer.currency,
      -amountNum,
    );
    await adjustBalance(
      client,
      transfer.to_wallet_id,
      transfer.currency,
      amountNum,
    );

    await confirmPendingTransfer(client, transfer.id);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    if (
      (error as Error).message ===
      "Saldo insuficiente para confirmar la transferencia"
    ) {
      await failPendingTransfer(transfer.id);
    }

    throw error;
  } finally {
    client.release();
  }

  const wallet = await findWalletById(transfer.from_wallet_id);

  if (wallet) {
    const user = await findUserById(wallet.user_id);

    if (user) {
      try {
        await sendEmail(
          user.email,
          "Transferencia confirmada - CheeseCash",
          `<p>Tu transferencia de ${transfer.amount} ${transfer.currency} fue confirmada y ya se acreditó.</p>`,
        );
      } catch (emailError) {
        logger.error(
          "No se pudo enviar el comprobante de la transferencia:",
          emailError,
        );
      }
    }
  }

  return {
    ...transfer,
    status: "success",
    confirmation_token: null,
    expires_at: null,
  };
}

export async function getCombinedHistory(userId: number) {
  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new NotFoundError("Wallet no encontrada");
  }

  const transactions = await findTransactionsByWalletId(wallet.id);
  const transfers = await findTransfersByWalletId(wallet.id);

  const normalizedTransactions = transactions.map((t) => ({
    kind: "transaction" as const,
    id: t.id,
    created_at: t.created_at,
    detail: t,
  }));

  const normalizedTransfers = await Promise.all(
    transfers.map(async (t) => {
      const direction = t.from_wallet_id === wallet.id ? "sent" : "received";
      const counterpartWalletId =
        direction === "sent" ? t.to_wallet_id : t.from_wallet_id;

      const counterpartWallet = await findWalletById(counterpartWalletId);

      let counterpart = null;

      if (counterpartWallet) {
        const counterpartUser = await findUserById(counterpartWallet.user_id);

        if (counterpartUser) {
          counterpart = {
            full_name: counterpartUser.full_name,
            email: counterpartUser.email,
          };
        }
      }

      return {
        kind: "transfer" as const,
        id: t.id,
        created_at: t.created_at,
        direction,
        counterpart,
        detail: t,
      };
    }),
  );

  const combined = [...normalizedTransactions, ...normalizedTransfers];

  combined.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return combined;
}
