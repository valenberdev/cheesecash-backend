import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { executeTransaction, getTransactionHistory, confirmTransaction } from '../services/transaction.service';
import { formatAmount } from '../utils/formatAmount';
import { UnauthorizedError } from '../utils/errors';

export async function createTransactionEndpoint(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
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
    next(error);
  }
}

export async function getHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const history = await getTransactionHistory(req.userId);

    const formatted = history.map((t) => ({
      ...t,
      from_amount: formatAmount(t.from_amount, t.from_currency),
      to_amount: formatAmount(t.to_amount, t.to_currency),
    }));

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
}

export async function confirmTransactionEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.params.token as string;

    const transaction = await confirmTransaction(token);

    res.status(200).json({
      ...transaction,
      from_amount: formatAmount(transaction.from_amount, transaction.from_currency),
      to_amount: formatAmount(transaction.to_amount, transaction.to_currency),
    });
  } catch (error) {
    next(error);
  }
}