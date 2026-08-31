import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { executeTransaction, getTransactionHistory } from "../services/transaction.service";

export async function createTransactionEndpoint(
  req: AuthRequest,
  res: Response,
) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const { type, fromCurrency, toCurrency, fromAmount } = req.body;

    const transaction = await executeTransaction(
      req.userId,
      type,
      fromCurrency,
      toCurrency,
      fromAmount,
    );

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function getHistory(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
    }

    const history = await getTransactionHistory(req.userId);

    res.status(200).json(history)
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
}