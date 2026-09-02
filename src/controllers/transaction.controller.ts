import { Response, Request } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { executeTransaction, getTransactionHistory, confirmTransaction } from "../services/transaction.service";
import { formatAmount } from "../utils/formatAmount";

export async function createTransactionEndpoint(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { type, fromCurrency, toCurrency, fromAmount } = req.body;

    const transaction = await executeTransaction(
      req.userId,
      type,
      fromCurrency,
      toCurrency,
      fromAmount
    );

    res.status(201).json({
      ...transaction,
      from_amount: formatAmount(transaction.from_amount, transaction.from_currency),
      to_amount: formatAmount(transaction.to_amount, transaction.to_currency),
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function getHistory(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const history = await getTransactionHistory(req.userId);

    const formatted = history.map((t) => ({
      ...t,
      from_amount: formatAmount(t.from_amount, t.from_currency),
      to_amount: formatAmount(t.to_amount, t.to_currency),
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
}

export async function confirmTransactionEndpoint(req: Request, res: Response) {
  try {
    const token = req.params.token as string;

    const transaction = await confirmTransaction(token);

    res.status(200).json({
      ...transaction,
      from_amount: formatAmount(transaction.from_amount, transaction.from_currency),
      to_amount: formatAmount(transaction.to_amount, transaction.to_currency),
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}