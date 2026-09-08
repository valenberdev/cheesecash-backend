import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getWalletBalances } from '../services/wallet.service';
import { formatAmount } from '../utils/formatAmount';
import { UnauthorizedError } from '../utils/errors';

export async function getBalances(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const balances = await getWalletBalances(req.userId);

    const formatted = balances.map((b) => ({
      ...b,
      amount: formatAmount(b.amount, b.currency),
    }));

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
}